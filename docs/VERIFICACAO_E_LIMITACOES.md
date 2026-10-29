# Verificações executadas e limitações

**Referência: 28/10/2026, backend integrado em `0c4aa05`.** Os resultados abaixo são execuções registradas; as atualizações documentais e dos diagramas não implementam novas funcionalidades.

| Verificação | Resultado confirmado |
|---|---|
| `npm run check` | 38 arquivos de `src`, zero erros de sintaxe |
| `npm run integrity` | 38 módulos, 102 imports relativos, 40 tabelas e configurações YAML válidas |
| Jest unitário/HTTP | 142 testes, 13 suítes aprovadas; repositórios/serviços substituídos por mocks conforme cada suíte |
| Integração MySQL real | 7 testes, 2 suítes aprovadas; isolamento, transações, autorização, hash e auditoria |
| Cobertura de todo `src` | 90,09% linhas, 87,10% instruções, 83,68% ramificações, 73,18% funções |
| MySQL local | Versões 8.0 e 8.4 exercitadas; 40 tabelas e 68 FKs verificadas |
| Docker | Imagem de produção construída, usuário `node`, arquivos legíveis, API e banco locais saudáveis na execução registrada |
| Smoke HTTP | Health, Swagger, cadastro/login/perfil, troca de senha, revogação, novo login, paginação e 413 aprovados |
| TDD didático | Green/Refactor: 4 testes aprovados em cada; Red: 4 falhas intencionais |
| Deploy/rollback | 7 cenários simulados aprovados, sem credencial AWS real ou socket Docker no contêiner de simulação |
| Auditoria npm | Zero alertas de produção; seis baixos na cadeia de desenvolvimento na consulta registrada |
| GitHub Actions | [Execução da PR](https://github.com/luizferraresso/Codesync/actions/runs/40803522140) e [do push](https://github.com/luizferraresso/Codesync/actions/runs/40803466021) aprovadas |

O comando de cobertura executa as mesmas suítes de `npm test`; os números não devem ser somados como execuções independentes de cenários diferentes. A cobertura não é garantia de ausência de falhas. Servidor de inicialização e CLI interativa ainda têm pouca ou nenhuma cobertura automatizada.

## Ainda não comprovado

- Acesso ao ambiente AWS do integrante, configuração efetiva de EC2/RDS/SG, implantação remota, HTTPS público e custos observados.
- Carga, disponibilidade/SLA, falhas de rede, restauração de backups e política completa de retenção/privacidade.
- Conformidade integral entre todas as respostas HTTP e OpenAPI; há schemas de resposta genéricos.
- Funcionalidades futuras da matriz de requisitos e conformidade completa dos RNFs.
- Aprovação acadêmica final: PDF regenerado com fontes atuais, validado por extração de texto/imagens e conferência das páginas renderizadas. Identificação da equipe, exigências de capturas adicionais e rubrica ainda precisam de confirmação pelo grupo.

## Reprodução e evidências

Use [TESTES_E_EVIDENCIAS.md](TESTES_E_EVIDENCIAS.md). `coverage/` e logs locais são gerados na execução e não fazem parte do Git. As saídas desta sessão ficaram na pasta irmã `../validacao-2026-10-28/`, incluindo `github-validacao-integrada.txt`, `aws-mysql84-testes.txt` e auditoria npm; essa pasta não acompanha um clone do repositório. Na CI, consulte os logs e o artefato de cobertura das execuções vinculadas acima.

O diagnóstico de 24/10, quando faltavam dependências e Docker, permanece em [RELATORIO_VALIDACAO_CONSOLIDACAO.md](RELATORIO_VALIDACAO_CONSOLIDACAO.md). Ele é histórico, não a situação corrente. Capturas para o professor devem ser reais e sem segredos.
