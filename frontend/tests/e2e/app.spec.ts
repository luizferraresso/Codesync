import { test, expect, type Page } from '@playwright/test';

const user = { id_usuario: '5', nome: 'Cliente de Teste', email: 'cliente@example.test', telefone: '(11) 99999-0000', data_nascimento: '1990-05-15', tipo_usuario: 'CLIENTE', status: 'ATIVO' };
const hotel = { id_hotel: '7', nome: 'Hotel de integração', categoria: 'HOTEL', classificacao: 4, descricao: 'Hospedagem retornada pelo serviço.', comodidades: ['Wi-Fi', 'Piscina'], status: 'ATIVO' };
const room = { id_tipo_quarto: '9', id_hotel: '7', nome: 'Quarto duplo', tipo: 'CASAL', capacidade: 2, valor_diaria: '220.00', status: 'DISPONIVEL', quantidade_disponivel: 1, tamanho_m2: 20, quantidade_camas: 1 };
let profile = { ...user };
let reservations: Record<string, unknown>[] = [];
let failLogin = false;
let duplicate = false;
let expired = false;
let offlineCatalog = false;
let lastRegistration: Record<string, unknown> | null;
let lastProfile: Record<string, unknown> | null;
let lastDraft: Record<string, unknown> | null;

test.beforeEach(async ({ page }) => {
  profile = { ...user }; reservations = []; failLogin = false; duplicate = false; expired = false; offlineCatalog = false;
  lastRegistration = null; lastProfile = null; lastDraft = null;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://127.0.0.1:4173') return route.abort();
    if (!url.pathname.startsWith('/api/v1/')) return route.continue();
    const body = route.request().postDataJSON();
    const path = url.pathname.replace('/api/v1', '');
    const method = route.request().method();
    const respond = (data: unknown, status = 200) => route.fulfill({ status, json: { data } });
    const error = (status: number, code: string, message: string) => route.fulfill({ status, json: { error: { code, message } } });
    if (path === '/auth/login') return failLogin ? error(401, 'CREDENCIAIS_INVALIDAS', 'Credenciais inválidas') : respond({ user: profile, token: 'token-ficticio-somente-teste' });
    if (path === '/auth/register') {
      lastRegistration = body;
      return duplicate ? error(409, 'CPF_CADASTRADO', 'CPF já cadastrado') : respond(profile, 201);
    }
    if (path === '/auth/password') {
      if (body.atual !== 'SenhaFicticia123!') return error(401, 'SENHA_ATUAL_INVALIDA', 'Senha atual inválida');
      return route.fulfill({ status: 204 });
    }
    if (expired && route.request().headers().authorization) return error(401, 'TOKEN_INVALIDO', 'Token expirado');
    if (path === '/usuarios/me') {
      if (method === 'PATCH') { lastProfile = body; profile = { ...profile, ...body }; }
      return respond(profile);
    }
    if (path === '/hoteis') return offlineCatalog ? error(503, 'INDISPONIVEL', 'Serviço indisponível') : respond([hotel]);
    if (path === '/quartos') return respond([room]);
    if (path === '/guias') return respond([]);
    if (path === '/reservas' && method === 'POST') {
      lastDraft = body;
      const item = { ...body, id_reserva: '12', codigo_confirmacao: 'HJ-TESTE', status_codigo: 'PENDENTE', valor_total: '0.00', taxas: '0.00' };
      reservations.unshift(item);
      return respond(item, 201);
    }
    if (path === '/reservas' && method === 'GET') return respond(reservations);
    if (path === '/reservas/12' && method === 'DELETE') {
      reservations = reservations.map(r => ({ ...r, status_codigo: 'CANCELADA' }));
      return respond({ status: 'CANCELADA' });
    }
    return error(404, 'ROTA_NAO_ENCONTRADA', 'Endpoint não encontrado');
  });
});

async function login(page: Page, destination = '/app/home') {
  await page.goto(`/#${destination}`);
  if (!page.url().includes('/login')) await expect(page.getByLabel('Senha', { exact: true })).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill('cliente@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('SenhaFicticia123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#${destination}$`));
}

test('cadastro valida CPF e confirmação e envia somente campos permitidos', async ({ page }) => {
  await page.goto('/#/register');
  await page.getByLabel('Nome completo').fill('Pessoa de Teste');
  await page.getByLabel('CPF', { exact: true }).fill('11111111111');
  await page.getByLabel('Data de nascimento').fill('1995-01-01');
  await page.getByLabel('Telefone com DDD').fill('11999990000');
  await page.getByLabel('E-mail', { exact: true }).fill('nova@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('SenhaFicticia123!');
  await page.getByLabel('Confirmar senha').fill('Diferente123!');
  await page.getByRole('button', { name: 'Criar Conta', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('CPF válido');
  expect(lastRegistration).toBeNull();
  await page.getByLabel('CPF', { exact: true }).fill('52998224725');
  await page.getByRole('button', { name: 'Criar Conta', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('senhas precisam ser iguais');
  await page.getByLabel('Confirmar senha').fill('SenhaFicticia123!');
  duplicate = true;
  await page.getByRole('button', { name: 'Criar Conta', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('CPF já cadastrado');
  duplicate = false;
  await page.getByRole('button', { name: 'Criar Conta', exact: true }).click();
  await expect(page).toHaveURL(/#\/login$/);
  await expect(page.getByRole('status')).toContainText('Conta criada');
  expect(Object.keys(lastRegistration!).sort()).toEqual(['cpf', 'data_nascimento', 'email', 'nome', 'senha', 'telefone']);
  expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }))).not.toContain('SenhaFicticia');
});

test('login rejeitado mantém visitante fora e login válido retorna à rota protegida', async ({ page }) => {
  failLogin = true;
  await page.goto('/#/app/reservations');
  await page.getByLabel('E-mail', { exact: true }).fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill('SenhaIncorreta!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Credenciais inválidas');
  expect(await page.evaluate(() => sessionStorage.getItem('hospedja.session'))).toBeNull();
  failLogin = false;
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/#\/app\/reservations$/);
  await expect(page.getByRole('heading', { name: 'Minhas reservas' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Minhas reservas' })).toBeVisible();
});

test('perfil vem da API e edição preserva CPF e e-mail; logout bloqueia acesso', async ({ page }) => {
  await login(page, '/app/profile');
  await expect(page.getByRole('heading', { name: user.nome })).toBeVisible();
  await page.getByRole('link', { name: /Editar perfil/ }).click();
  await page.getByLabel('Nome completo').fill('Nome atualizado');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('status')).toContainText('atualizado');
  expect(lastProfile).toEqual({ nome: 'Nome atualizado', telefone: user.telefone, data_nascimento: user.data_nascimento });
  await page.getByRole('link', { name: 'Voltar ao perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Nome atualizado' })).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await page.goto('/#/app/profile');
  await expect(page).toHaveURL(/#\/login$/);
});

test('catálogo usa registros do serviço, favoritos e detalhes sem avaliações inventadas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/app/home');
  await expect(page.getByRole('heading', { name: hotel.nome })).toBeVisible();
  await page.getByRole('button', { name: `Adicionar aos favoritos: ${hotel.nome}` }).click();
  await expect(page.getByRole('button', { name: `Remover dos favoritos: ${hotel.nome}` })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: /HOTEL Hotel de integração/ }).click();
  await expect(page.getByRole('heading', { name: hotel.nome })).toBeVisible();
  await expect(page.getByText('Quarto duplo', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Ver detalhes' }).click();
  await expect(page.getByText('A reserva deste quarto', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test('falha de catálogo oferece nova tentativa sem trocar por dados fictícios', async ({ page }) => {
  offlineCatalog = true;
  await page.goto('/#/app/home');
  await expect(page.getByRole('alert')).toContainText('Serviço indisponível');
  await expect(page.getByText('Grand Floripa Beach Resort', { exact: true })).toHaveCount(0);
  offlineCatalog = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: hotel.nome })).toBeVisible();
});

test('cria rascunho pendente no serviço e exige confirmação para cancelar', async ({ page }) => {
  await login(page, '/app/reservations');
  await page.getByRole('link', { name: 'Criar rascunho de reserva' }).click();
  const checkin = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const checkout = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Check-in').fill(checkin);
  await page.getByLabel('Check-out').fill(checkout);
  await page.getByLabel('Hóspedes').fill('2');
  await page.getByLabel('Observações').fill('Planejamento inicial');
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page.getByRole('heading', { name: 'Rascunho salvo' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Nenhuma hospedagem foi reservada');
  expect(lastDraft).toEqual({ checkin, checkout, quantidade_hospedes: 2, observacoes: 'Planejamento inicial' });
  await page.getByRole('button', { name: 'Ver minhas reservas' }).click();
  await expect(page.getByText('PENDENTE', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar rascunho', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Manter rascunho' }).click();
  await expect(page.getByText('PENDENTE', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar rascunho', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar cancelamento' }).click();
  await expect(page.getByText('CANCELADA', { exact: true })).toBeVisible();
});

test('token expirado é removido e a rota protegida pede novo login', async ({ page }) => {
  await login(page, '/app/profile');
  expired = true;
  await page.reload();
  await expect(page).toHaveURL(/#\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem('hospedja.session'))).toBeNull();
});

test('senha atual errada preserva sessão; sucesso exige novo login', async ({ page }) => {
  await login(page, '/app/security');
  await page.getByLabel('Senha atual').fill('Incorreta123!');
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!');
  await page.getByLabel('Confirmar nova senha').fill('NovaSenha123!');
  await page.getByRole('button', { name: 'Alterar senha' }).click();
  await expect(page.getByRole('alert')).toContainText('Senha atual inválida');
  await expect(page).toHaveURL(/#\/app\/security$/);
  await page.getByLabel('Senha atual').fill('SenhaFicticia123!');
  await page.getByRole('button', { name: 'Alterar senha' }).click();
  await expect(page).toHaveURL(/#\/login$/);
  await expect(page.getByRole('status')).toContainText('Senha alterada com sucesso');
  expect(await page.evaluate(() => sessionStorage.getItem('hospedja.session'))).toBeNull();
});

test('rotas futuras não simulam pagamentos, envio de e-mail ou verificação de identidade', async ({ page }) => {
  for (const route of ['/app/payment', '/forgot-password', '/verify-2fa', '/guia/acesso/codigo', '/hotel/cadastro']) {
    await page.goto(`/#${route}`);
    await expect(page.getByRole('heading', { name: 'Estamos preparando esta experiência' })).toBeVisible();
    await expect(page.locator('input')).toHaveCount(0);
  }
});

test('layout mantém leitura em celular e desktop sem rolagem horizontal', async ({ page }) => {
  await page.goto('/#/login');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.screenshot({ path: 'test-results/preview-login-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/preview-login-mobile.png', fullPage: true });
});
