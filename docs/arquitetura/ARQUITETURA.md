# Arquitetura atual do HospedJá

**Equipe:** CodeSync, Grupo 3 — UNIUBE. **Revisão: 28/10/2026.** Backend Node.js 22/Express, Zod 4, mysql2, bcrypt/JWT e Docker. MySQL 8.0/8.4 foram testados localmente; EC2/RDS permanecem como destino de implantação ainda não verificado nesta revisão.

## Camadas e dependências reais

```text
Cliente HTTP / Swagger
          |
Express: CORS, Helmet, JSON, auditoria
          |
Rotas: autenticação, autorização e validação Zod
          |
Controllers -> Services
                  |             |
             Repositories    Pool/Connection mysql2
                  |             |
                  +------------> MySQL

res.finish -> AuditMiddleware -> AuditService -> tb_log (best-effort)
                                           +-> Winston -> stdout/arquivo
```

Routes associam método/caminho a middlewares e controllers. Controllers recebem parâmetros e formatam respostas. Services aplicam regras e autorização por propriedade e coordenam transações. Repositories concentram consultas reutilizáveis, com identificadores internos e valores parametrizados.

A separação não é estrita: serviços de catálogo, reservas, pagamentos, ocorrências e gestão também acessam o pool diretamente; a auditoria escreve nele sem passar por um repositório próprio. Os diagramas refletem essas dependências, sem representar todas as classes planejadas no CP2 como já implementadas.

## Segurança e consistência

- JWT contém `sub`, `sv` e claims técnicos. `requireAuth` confere token, conta ativa e versão da sessão no banco; o papel vem do banco. Respostas públicas não expõem hash nem versão de sessão.
- Bcrypt aceita no máximo 72 bytes UTF-8. A troca de senha verifica a anterior e altera hash/versão atomicamente; a atualização condicional também evita sobrescrever uma troca concorrente.
- Catálogo filtra visibilidade antes de paginar e protege campos administrativos. Nem todas as listagens possuem paginação; os parâmetros atuais se aplicam ao catálogo.
- Rascunhos são PENDENTE, sem seleção/cotação/inventário. Criação de lançamento administrativo e cancelamento usam bloqueio da mesma reserva em transação. Isso não resolve disponibilidade por período nem integra gateway.
- Ocorrências validam alvo, propriedade e coerência dos vínculos. A análise é feita por ADMIN, sem aplicar penalidade.
- Auditoria após a resposta é sanitizada e best-effort; ainda não há outbox transacional.

## Estrutura efetiva

```text
src/          app.js, server.js, routes, controllers, services,
              repositories, middlewares, validators, config, utils, docs
database/     schema, seed fictício, verificação e migrations
tests/        unit, http, db e simulação de deploy
tdd/          laboratório Red/Green/Refactor reconstruído
scripts/      checks, migração, preflight, ambiente local e artefatos
diagramas/    modelos.json, drawio, dot e previews
aws/          procedimento EC2/RDS, IAM e Nginx
```

`app.js` exporta o Express sem iniciar porta; `server.js` verifica o banco, inicia o processo e trata desligamento. O Dockerfile tem estágios de teste e produção, instala por lockfile e executa a aplicação com usuário `node`.

## Ambientes e publicação

- Desenvolvimento: `compose.yaml`, API em loopback 3000 e MySQL 8.0 em 3307; seed fictício apenas na criação de volume local.
- Integração: `compose.integration.yaml`, banco/volume separados em 3308 e estágio Node.js 22 de testes; sem contas do seed.
- Compatibilidade AWS: `compose.aws-validation.yaml`, MySQL 8.4 isolado e sem portas publicadas. Esse ambiente local não comprova acesso a RDS.
- AWS: imagem identificada pelo commit, checkout limpo, preflight de TLS/schema/status, candidato e rollback testados por simulação. Atualização remota exige acesso e migração com credencial adequada.
- CI: sintaxe, integridade/YAML, cobertura, auditoria npm de produção e integração MySQL 8.0. A publicação está na PR #3, em revisão.

## Limites e evolução

Pesquisa/inventário, confirmação definitiva, integrações externas, SAC/DeepSeek, avaliação/reserva de guias e penalidades manuais continuam pendentes. A interface também é futura. Nenhuma dessas integrações é chamada pelo código atual.

O TDD didático é posterior à implementação inicial. A afirmação antiga de que o TDD precedeu cada implementação não se aplica ao histórico existente; novos incrementos devem registrar ciclos reais. Fontes e evidências: [índice](../README.md), [modelagem](MODELAGEM_E_DECISOES.md) e [diagramas](../DIAGRAMAS_INTERACAO.md).
