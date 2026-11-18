# HospedJá — frontend

Implementação iniciada em **18/11/2026**, a partir da exportação do Figma Make fornecida pela equipe. Preserva a identidade roxa e laranja, o logotipo, as fontes Sora e Plus Jakarta Sans, a apresentação inicial, o formulário de login e a estrutura para celular do projeto.

## Origem e escopo

- Projeto de referência: https://www.figma.com/make/K6ZbicnItaNEQLAn153Ppg/HOSPEDJ%C3%81
- ZIP original preservado na pasta local `figma/`, fora do versionamento.
- SHA-256 do ZIP recebido: `e7d66b8eb47347637e72ba058084b9cc2fbe24adfe6c4b32c3a3c5ca432e0501`.
- O ZIP contém telas adicionais de guia, hotel, carteira, saque, chat, 2FA e pagamento, com operações simuladas. Essas simulações não foram ativadas na aplicação integrada. O arquivo original continua disponível para implementar essas telas em etapas futuras.
- Trabalho na branch `feat/frontend-figma`. Nenhuma nova implantação na AWS foi realizada nesta etapa.

## Funcionalidades integradas

| Tela / operação | Contrato da API | Comportamento |
| --- | --- | --- |
| Criar conta de cliente | `POST /api/v1/auth/register` | Nome, CPF obrigatório, e-mail, senha, telefone e nascimento; mensagens reais de conflito e validação |
| Login | `POST /api/v1/auth/login` | E-mail e senha; autenticação real e retorno à tela protegida solicitada |
| Perfil | `GET/PATCH /api/v1/usuarios/me` | Atualiza somente nome, telefone e nascimento; não expõe nem inventa CPF |
| Segurança | `PATCH /api/v1/auth/password` | Confere senha atual; após sucesso exige novo login |
| Catálogo e detalhes | `GET /api/v1/hoteis`, `/quartos`, `/guias` | Consulta páginas de até 100 registros até completar a listagem; filtros locais por nome/descrição e categoria |
| Favoritos | Estado em memória | Disponíveis enquanto a página está aberta; não são persistidos no banco e são limpos ao trocar de conta |
| Reservas | `GET/POST/DELETE /api/v1/reservas` | Lista, cria rascunho `PENDENTE` e solicita confirmação antes de cancelar; o servidor decide se o cancelamento é permitido |

A reserva atual **não vincula hotel/quarto, não consulta estoque por data, não confirma hospedagem e não efetua pagamento**. O formulário não envia identificadores ou preços que o backend não aceita. Os valores de quartos e guias são apenas diárias de referência. Classificação por estrelas é exibida somente quando informada no cadastro; notas de hóspedes, avaliações e promoções fictícias não são mostradas.

Consulta real em 18/11/2026: `/health` e as três listagens públicas responderam **HTTP 200**. Hotéis, quartos e guias retornaram listas vazias. A aplicação apresenta estado vazio e não substitui esses dados por exemplos.

As imagens das hospedagens são ilustrações identificadas, pois a API ainda não fornece fotos. As três fotografias da apresentação inicial vieram do projeto original e responderam HTTP 200 na verificação. Fontes e fotos dessa apresentação dependem de serviços externos.

## Executar no PowerShell

Pré-requisito: Node.js **22.18 ou superior compatível** e npm. Use `npm.cmd` caso a política do PowerShell impeça executar `npm.ps1`.

Na raiz do repositório (`C:\Arquivos de Aula\Codesync\Codesync`):

```powershell
npm.cmd run web:install
npm.cmd run web:dev
```

Abra **http://127.0.0.1:5173/**. A tela inicial apresenta a marca e o onboarding. Também é possível abrir diretamente `http://127.0.0.1:5173/#/login`.

O arquivo local ignorado `frontend/.env.local` foi preparado para consultar a API existente em `https://44.201.28.10`. Somente o endereço público está nele; não há senhas de banco ou chaves AWS. Acessos e cadastros feitos manualmente pela interface utilizam a API e o banco reais dessa hospedagem.

Para desenvolver contra a API local, copie os valores de `frontend/.env.example` para `frontend/.env.local`, configure `API_PROXY_TARGET=http://127.0.0.1:3000` e execute também a API conforme o README principal. Reinicie o Vite após alterar o arquivo.

O navegador chama `/api/v1` na mesma origem; o proxy de desenvolvimento encaminha à API. A verificação do certificado HTTPS permanece habilitada. Não use `VITE_` para segredos: essas variáveis são públicas no bundle.

## Compilar e servir com o backend

```powershell
npm.cmd run web:build
npm.cmd start
```

O Express serve `frontend/dist/index.html` em `/` e os arquivos gerados em `/assets`. As rotas da interface usam `HashRouter`, por exemplo `/#/app/profile`, sem converter endpoints inexistentes da API em páginas HTML. Se o frontend não estiver compilado, o backend continua funcionando com suas rotas de API.

O Dockerfile inclui uma etapa de build do frontend e copia apenas `dist` para a imagem final da API. Mantém o processo como usuário `node`, o banco privado e o proxy Nginx existente. Para publicar, ainda é necessário revisar a branch, testar a imagem Docker e realizar a implantação pelo procedimento existente. O daemon Docker estava indisponível nesta máquina; o build da imagem não foi executado nesta etapa.

A configuração entregue usa frontend e API na mesma origem. Uma hospedagem separada exigirá revisar `VITE_API_BASE_URL`, CORS e CSP; não é a configuração padrão.

## Autenticação e tratamento de erros

- Token Bearer em memória e `sessionStorage` da aba. Senha, CPF e dados de cartão não são gravados no armazenamento do navegador. Fechar a aba encerra o armazenamento da sessão; não há renovação automática de JWT.
- Após recarregar, o perfil é consultado novamente no servidor. Falha temporária permite tentar novamente; token inválido, conta inativa ou sessão revogada exigem novo login.
- Rotas de perfil e reservas exigem sessão. Permissões e propriedade continuam sendo verificadas pelo backend.
- Validação de CPF e senha no cliente auxilia o preenchimento; o servidor e as restrições do banco continuam sendo a autoridade. A senha exige ao menos 10 caracteres e no máximo 72 bytes UTF-8.
- Requisições têm limite de tempo de 15 segundos, erros visíveis e novas tentativas explícitas. Operações mutantes não são repetidas automaticamente.
- A CSP das páginas permite scripts apenas da mesma origem, bloqueia execução inline de JavaScript e permite estilos inline usados pelo design. O Swagger mantém sua configuração independente.
- Foco de teclado, nomes acessíveis para campos, diálogo modal nativo, estados de carregamento e preferência de movimento reduzido foram considerados.

## Tecnologias instaladas

Versões resolvidas no `package-lock.json` desta etapa:

| Tecnologia | Versão |
| --- | --- |
| React / React DOM | 19.3.1 |
| React Router DOM | 7.18.6 |
| TypeScript | 5.9.3 |
| Vite | 8.3.8 |
| Plugin React para Vite | 6.3.0 |
| Tailwind CSS / plugin Vite | 4.3.5 |
| Playwright Test | 1.65.1 |

Compilação local com Node.js 24.22.1; execução de navegador com Chrome instalado nesta máquina. A CI usa Node.js 22 e Chromium do Playwright. `npm ci` reproduz as versões do lockfile.

## Testes

```powershell
npm.cmd run web:test
npm.cmd run web:build
npm.cmd run test:e2e --prefix frontend
```

Para usar o Chrome já instalado, sem baixar o Chromium:

```powershell
$env:PLAYWRIGHT_EXECUTABLE_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm.cmd run test:e2e --prefix frontend
```

Ou, dentro da pasta `frontend`, instale o navegador do Playwright com `npx.cmd playwright install chromium`.

Os testes de navegador interceptam a API e utilizam dados fictícios, sem escrever no RDS. Verificam cadastro, conflitos, autenticação, perfil, proteção de rotas, catálogo, favoritos, indisponibilidade, rascunhos, cancelamento, expiração e layout em 320, 390 e 1440 pixels. A consulta pública à AWS é uma verificação separada, somente de leitura; ainda é necessário validar manualmente os fluxos autenticados completos em homologação antes de publicar.

Os testes unitários verificam documentos, limites de senha, datas e transporte HTTP. Os testes HTTP do backend verificam os arquivos estáticos e seus cabeçalhos, incluindo preservação de 404 JSON nas URLs da API. Nenhuma alteração de schema foi feita nesta etapa.

Resultados locais em 18/11/2026:

- Compilação TypeScript e Vite aprovada.
- **7/7** testes unitários do frontend e **10/10** testes de navegador aprovados.
- **198/198** testes do backend, em 16 suítes, aprovados; cobertura de linhas **90,28%** na execução com cobertura.
- `npm run check`, `npm run integrity` e verificação de checksums aprovados.
- Auditoria npm das dependências de execução do frontend e do backend: nenhuma vulnerabilidade reportada.
- Smoke de leitura no Chrome: frontend local HTTP 200, catálogo da AWS HTTP 200, fotografia do onboarding carregada e nenhum erro JavaScript de página.
- Build da imagem Docker, execução da CI remota e operações autenticadas contra o banco hospedado não foram realizados nesta etapa. Os fluxos mutantes do navegador foram testados com API interceptada.

## Próximas etapas

1. Conferir as telas com a equipe e ajustar a versão para desktop, hoje com composição central de celular preservada do protótipo.
2. Validar cadastro, login, edição, senha e rascunhos com contas de homologação e persistência real no banco.
3. Cadastrar hotéis, quartos e guias pelo fluxo administrativo autorizado; adicionar suporte a fotos e endereços no contrato público.
4. Implementar disponibilidade por período, cotação e vínculo de hotel/quarto na reserva antes de habilitar o checkout do protótipo.
5. Implementar pagamento, confirmação, cancelamento/estorno e suas regras no backend antes de ativar essas telas.
6. Implementar os painéis de gestor/guia com autorização, contratação de guias, recuperação de senha, 2FA, SAC e notificações.
7. Validar a imagem Docker, revisar a branch e publicar o frontend junto à API na AWS; depois conferir os fluxos pela URL HTTPS pública.
