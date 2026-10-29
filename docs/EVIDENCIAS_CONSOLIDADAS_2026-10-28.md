# Evidências da consolidação — 28/10/2026

Este registro reúne trechos reais das execuções locais e referências públicas da CI. Os blocos são transcrições de saída, não capturas de tela. Não há evidência de execução na AWS. O backend de referência é o commit `0c4aa05efc104d59288c25d2fbb971bf760a9a7c`.

## Testes e cobertura no ambiente isolado

Comando executado: `docker compose -f compose.aws-validation.yaml run --build --rm tests`. Ambiente: Node.js 22 e MySQL 8.4 local, isolado do banco de desenvolvimento. Origem: log `github-validacao-integrada.txt` guardado fora do repositório na sessão de validação. Trechos selecionados, sem linhas intermediárias:

```text
All files | % Stmts: 87.1 | % Branch: 83.68 | % Funcs: 73.18 | % Lines: 90.09

Test Suites: 13 passed, 13 total
Tests:       142 passed, 142 total
Snapshots:   0 total
Time:        8.817 s

Banco atualizado; nenhuma migracao pendente.

PASS tests/db/regressions.db.test.js
PASS tests/db/real-mysql.test.js
Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        4.583 s
```

A primeira linha reorganiza as colunas do relatório para facilitar a leitura; os valores são os medidos. As durações são daquela execução e não constituem benchmark. Os 149 testes não incluem os oito casos Green/Refactor do laboratório nem os sete cenários simulados do deploy. Cobertura mede todo `src`, incluindo arquivos não exercitados.

## Estado local consultado durante a atualização do PDF

Consulta Docker: `docker ps --format '{{.Names}} {{.Status}}'`.

```text
codesync-api-1 Up 57 minutes (healthy)
codesync-db-1 Up 58 minutes (healthy)
```

Consultas HTTP reais em `http://localhost:3000`, feitas novamente nesta consolidação:

```text
/health 200 {"status":"ok","service":"hospedja-api"}
/openapi.json 200 OpenAPI 3.0.3 paths 24
/api-docs/ 200 text/html; charset=utf-8
```

O endpoint de saúde executa uma consulta ao banco. O retorno HTML do Swagger e a leitura do OpenAPI comprovam disponibilidade desses recursos; não certificam todos os schemas de resposta nem constituem inspeção visual do navegador.

## Publicação e CI verificadas

Consulta à API do GitHub durante a atualização: PR aberta, em rascunho, branch `fix/seguranca-testes-docker-aws`, destino `main`, head `0c4aa05`. Execuções desse commit:

| Evento | Execução | Estado | Resultado |
|---|---|---|---|
| Pull request | [40803522140](https://github.com/luizferraresso/Codesync/actions/runs/40803522140) | completed | success |
| Push | [40803466021](https://github.com/luizferraresso/Codesync/actions/runs/40803466021) | completed | success |

Os links fixam a evidência no commit testado. Atualizações documentais posteriores geram outras execuções, disponíveis na [PR #3](https://github.com/luizferraresso/Codesync/pull/3). Não antecipar o resultado dessas execuções. O workflow publica o artefato `cobertura-jest`; disponibilidade de logs e artefatos está sujeita à retenção do GitHub.

## Limite da evidência

Os resultados comprovam o escopo exercitado localmente e na CI. Permanecem pendentes implantação remota, HTTPS público, restauração de backup, carga, regras de negócio futuras e revisão independente. Para reprodução, consulte [testes](TESTES_E_EVIDENCIAS.md) e [verificações e limitações](VERIFICACAO_E_LIMITACOES.md).
