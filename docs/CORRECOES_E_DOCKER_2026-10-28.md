# Correções e execução Docker — 28/10/2026

**Atualização documental:** resultados consolidados em [README.md](README.md). A publicação ocorreu na [PR #3](https://github.com/luizferraresso/Codesync/pull/3), com CI aprovada e revisão/merge pendentes na consulta desta revisão.

As falhas reproduzidas na avaliação anterior foram corrigidas. API e banco foram executados no Docker Desktop, usando **Node.js 22.23.4 e MySQL 8.0.46**, com healthchecks saudáveis. Este documento atualiza o estado descrito em `AVALIACAO_PROJETO_2026-10-28.md`, que permanece como registro histórico.

## Alterações aplicadas

| Problema | Comportamento atual |
|---|---|
| Pagamento podia ser registrado após cancelamento concorrente | A reserva é lida e bloqueada dentro da transação do pagamento, usando o mesmo bloqueio do cancelamento; estado inválido gera 409 e rollback |
| Ocorrência aceitava reserva alheia | Valida dono/permissão, reserva derivada do guia, correspondência entre reservas e vínculo do alvo com a reserva |
| Bcrypt truncava senhas Unicode | Cadastro, troca e bootstrap limitam a senha a 72 bytes UTF-8; hash também tem proteção; login rejeita entradas que seriam truncadas |
| Token continuava válido após troca de senha | JWT carrega versão de sessão, consultada no banco; alteração da senha incrementa a versão no mesmo UPDATE condicional |
| Compose de integração inválido | Healthcheck corrigido e configurações validadas pelo Compose |
| Quantidade maior que SMALLINT e outros limites SQL | Validação limitada ao tipo SQL, incluindo BIGINT UNSIGNED e valores DECIMAL; erros de intervalo retornam 422 |
| Payload excessivo retornava 500 | Retorna 413 com código `CORPO_MUITO_GRANDE` |
| Troca de senha registrada como cadastro | Persiste `ALTERACAO_SENHA` |
| Inativos escondiam hotéis/guias ativos na listagem | Filtro ocorre no SQL antes do limite; catálogo aceita `limit` e `offset` validados |
| Alerta alto no Zod | Atualizado para Zod 4.6.7, com regressões executadas |
| Cobertura selecionava só seis arquivos | Agora mede todo `src/**/*.js`; limiares globais de 80% linhas/instruções, 70% ramificações e 65% funções |
| Instalações não reproduzíveis | Lockfile incluído; Docker e CI usam `npm ci` |
| CI sem banco real e validação de configuração | Adicionados job MySQL 8, migração, testes DB, auditoria de produção e validação Compose/YAML |
| Manifesto desatualizado e divergências CRLF/LF | Manifesto regenerado; `npm run checksums` verifica texto normalizado para LF e binários em bytes originais, excluindo segredos e temporários |

O tratamento das senhas não altera silenciosamente hashes existentes. Contas antigas que tenham usado mais de 72 bytes precisam de redefinição por procedimento controlado; não se deve continuar permitindo equivalência por truncamento. Tokens anteriores à adoção da versão de sessão exigem novo login.

## Testes e evidências

| Verificação | Resultado |
|---|---|
| Sintaxe e integridade | Sem erros; 38 módulos, 102 imports relativos e 40 tabelas |
| Unitários/HTTP | 142 testes aprovados em 13 suítes |
| Integração real MySQL 8 | 7 testes aprovados em 2 suítes |
| TDD Green / Refactor | 4 aprovados em cada etapa |
| Cobertura de todo `src`, após integrar a main | 90,09% linhas; 87,10% instruções; 83,68% ramificações; 73,18% funções |
| Auditoria das dependências de produção | Zero alertas em `npm audit --omit=dev` |
| API em execução | `/health` 200 com consulta ao banco; `/api-docs/` 200 |
| Smoke HTTP na imagem final | Cadastro, login, perfil, troca de senha, revogação, novo login, payload 413 e paginação aprovados; usuário fictício removido |
| Docker | API e banco de desenvolvimento saudáveis |

Os testes DB incluem uma concorrência controlada real: a criação de pagamento aguarda, o cancelamento termina, e o pagamento é recusado com 409, sem inserir pagamento. Também verificam propriedade das reservas em ocorrências, revogação de JWT com novo login, auditoria persistida e listagem com 100 hotéis inativos mais novos. Os dados criados pelos testes são removidos ao final.

Há **seis alertas baixos em dependências transitivas de desenvolvimento do Jest/deepmerge**. A auditoria não oferece correção compatível e sugere downgrade de Jest; esse downgrade não foi aplicado. Eles permanecem como pendência de manutenção, separados da árvore de produção sem alertas.

Relatório HTML de cobertura: `coverage/index.html`. JSON da auditoria de produção: pasta irmã `../validacao-2026-10-28/npm-audit-producao-apos-correcoes.json`.

O log da execução em Docker foi salvo em `../validacao-2026-10-28/docker-testes-apos-correcoes.txt`. O manifesto pode ser atualizado após alterações intencionais com `npm run checksums:update`.

## Acessos locais

| Serviço | Endereço |
|---|---|
| API / saúde | http://localhost:3000/health |
| Swagger | http://localhost:3000/api-docs/ |
| OpenAPI | http://localhost:3000/openapi.json |
| MySQL de desenvolvimento | `127.0.0.1:3307`, banco `hospedja` |
| MySQL de integração, quando iniciado | `127.0.0.1:3308`, volume separado |

Credenciais e segredos locais ficam no `.env`, ignorado pelo Git. O arquivo foi gerado com valores aleatórios e não é exibido nos relatórios. O Compose de desenvolvimento importa o seed fictício somente na criação inicial do volume. As portas de API e banco foram vinculadas ao loopback local.

## Executar e parar

Na raiz do projeto:

```powershell
node scripts/setup-local-env.js
docker compose up --build -d --wait
docker compose ps
```

O script de preparação preserva `.env` existente. Se houver configuração anterior, ajustar manualmente as variáveis ausentes; o script não substitui segredos já definidos.

Testes no ambiente Docker de referência:

```powershell
npm.cmd run test:docker
docker compose -f compose.integration.yaml stop db_integration
```

O comando usa um estágio de imagem com dependências de teste e um banco independente. Não altera o volume de desenvolvimento. A imagem de execução da API instala somente dependências de produção e usa o usuário `node`.

Para parar a aplicação preservando os dados:

```powershell
docker compose stop
```

Não usar `down -v` para atualizar o projeto: isso apaga os volumes.

## Banco existente e migração

O schema novo inclui `tb_usuario.token_version`. Para atualizar um volume antigo, construir a imagem nova e aplicar a migração **antes de iniciar a API nova**:

```powershell
docker compose build api
docker compose run --rm --no-deps api npm run db:migrate
docker compose up -d --wait
```

O banco precisa estar iniciado. A migração inspeciona a coluna, serializa execuções com `GET_LOCK` e somente adiciona a coluna se ela não existir. Não recria tabelas nem apaga usuários. Um teste sobre banco novo confirmou a execução idempotente. Em ambiente com usuários reais, realizar backup antes de qualquer migração.

## Pendências do produto

As correções tratam os defeitos e a infraestrutura de validação da avaliação anterior. A implementação dos módulos futuros continua no backlog: pesquisa por destino/datas, inventário por período, cotação, confirmação real de reservas, Mercado Pago/webhooks/estorno, regra dos sete dias, SAC/DeepSeek, aplicação manual de penalidades e interface.

Auditoria continua best-effort; garantia transacional/outbox, testes de carga, backup/restauração, contrato completo das respostas OpenAPI e implantação AWS ainda precisam de desenvolvimento e validação. O workflow GitHub Actions foi publicado e as execuções de push e PR passaram; ainda falta revisão/merge da PR #3. O PDF consolidado foi regenerado com documentação, diagramas e evidências atuais; identificação da equipe e conferência acadêmica final permanecem pendentes.
