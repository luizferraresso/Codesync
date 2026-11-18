import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient, ApiError } from '../src/api/client.ts';

test('envia JSON e Bearer, extrai data e não utiliza cookies', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'https://example.test/api/v1/usuarios/me');
      assert.equal(init.headers.get('Authorization'), 'Bearer token-ficticio');
      assert.equal(init.headers.get('Content-Type'), 'application/json');
      assert.equal(init.credentials, 'omit');
      assert.equal(init.redirect, 'error');
      return Response.json({ data: { nome: 'Teste' } });
    };
    const request = createClient({ baseUrl: 'https://example.test/api/v1/', getToken: () => 'token-ficticio', onUnauthorized() {} });
    assert.deepEqual(await request('/usuarios/me', { method: 'PATCH', body: '{"nome":"Teste"}' }), { nome: 'Teste' });
  } finally { globalThis.fetch = original; }
});
test('preserva código e mensagem de conflito sem invalidar sessão', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ error: { code: 'CPF_CADASTRADO', message: 'CPF já cadastrado' } }, { status: 409 });
    const request = createClient({ baseUrl: '/api/v1', getToken: () => 'ficticio', onUnauthorized() { assert.fail('não deve sair'); } });
    await assert.rejects(request('/auth/register'), e => e instanceof ApiError && e.status === 409 && e.code === 'CPF_CADASTRADO');
  } finally { globalThis.fetch = original; }
});
test('sessão expirada invalida o token utilizado, senha atual errada mantém sessão', async () => {
  const original = globalThis.fetch;
  let invalidations = 0;
  try {
    const request = createClient({ baseUrl: '/api/v1', getToken: () => 'antigo', onUnauthorized(token) { assert.equal(token, 'antigo'); invalidations++; } });
    globalThis.fetch = async () => Response.json({ error: { code: 'TOKEN_INVALIDO', message: 'Token expirado' } }, { status: 401 });
    await assert.rejects(request('/usuarios/me'));
    assert.equal(invalidations, 1);
    globalThis.fetch = async () => Response.json({ error: { code: 'SENHA_ATUAL_INVALIDA', message: 'Senha atual inválida' } }, { status: 401 });
    await assert.rejects(request('/auth/password'));
    assert.equal(invalidations, 1);
  } finally { globalThis.fetch = original; }
});
test('operações 204 não exigem JSON; falhas de rede e HTML não são sucesso', async () => {
  const original = globalThis.fetch;
  try {
    const request = createClient({ baseUrl: '/api/v1', getToken: () => null, onUnauthorized() {} });
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await request('/auth/password'), undefined);
    globalThis.fetch = async () => { throw new TypeError('network'); };
    await assert.rejects(request('/hoteis'), e => e.code === 'CONEXAO_INDISPONIVEL');
    globalThis.fetch = async () => new Response('<html>proxy</html>', { status: 200 });
    await assert.rejects(request('/hoteis'), e => e.code === 'RESPOSTA_INVALIDA');
  } finally { globalThis.fetch = original; }
});
