# TDD, testes automatizados e evidências

## Distinção metodológica

A implementação inicial antecedeu a criação do laboratório `tdd/`. O laboratório demonstra Red → Green → Refactor e não comprova test-first histórico da aplicação. Para novas funcionalidades, manter testes e commits reais nessa sequência, sem reescrever o passado.

```bash
npm ci
npm run test:tdd:red       # 4 falhas intencionais; saída 1
npm run test:tdd:green     # 4 aprovados
npm run test:tdd:refactor  # 4 aprovados
```

Os quatro cenários didáticos cobrem hash bcrypt, cadastro, login JWT e log sanitizado. Green e Refactor foram executados com sucesso; Red apresentou as falhas previstas.

## Testes do backend real

`npm test`, `npm run test:unit` e `npm run test:http` executam os grupos da configuração Jest. A suíte completa contém 142 testes aprovados em 13 suítes, incluindo autorização, validação, bloqueios e rollback com mocks, senhas UTF-8, sessão, paginação e auditoria. Supertest utiliza o Express real, com repositórios ou serviços simulados conforme a suíte; isso não é persistência real.

`npm run test:coverage` mede **todo `src/**/*.js`**, inclusive arquivos não exercitados. Limiares: 80% linhas/instruções, 70% ramificações e 65% funções. Após a integração da main, foram medidos 90,09% linhas, 87,10% instruções, 83,68% ramificações e 73,18% funções. Relatório HTML: `coverage/index.html`.

## Integração MySQL real e ambientes isolados

```bash
node scripts/setup-local-env.js
npm run test:docker
docker compose -f compose.integration.yaml stop db_integration
```

Esse comando executa sintaxe, integridade, cobertura, migração, sete testes DB e TDD Green/Refactor em Node.js 22/MySQL 8.0 isolados. O banco recebe schema e status básicos, sem usuários do seed. Não apontar os testes para o banco de desenvolvimento nem para produção.

Compatibilidade com a versão indicada para RDS:

```bash
docker compose -f compose.aws-validation.yaml run --build --rm tests
docker compose -f compose.aws-validation.yaml stop db
```

Os sete testes DB passaram em MySQL 8.0 e 8.4. Exercitam cadastro/login/hash/auditoria, cancelamento e concorrência real controlada, rejeição de vínculo alheio em ocorrências, revogação com novo login e filtros/paginação. Criam e limpam seus dados fictícios.

`npm run test:deploy` cobre sete cenários simulados de pré-verificação, promoção e rollback; não acessa AWS nem comprova configuração real do RDS. Comandos de host e coleta de evidências: [TESTES_E_EVIDENCIAS.md](TESTES_E_EVIDENCIAS.md).

## Histórico e próximas evoluções

Registrar teste que falha → implementação mínima → refatoração → evidência de validação. Os testes desta revisão protegem o comportamento atual; pesquisa, inventário, regras definitivas e integrações futuras precisarão de cenários próprios. Consultar [resultados e limites](VERIFICACAO_E_LIMITACOES.md).
