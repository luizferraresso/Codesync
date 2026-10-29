# Documentação do HospedJá

Revisão de 28/10/2026, comparada ao backend integrado no commit `0c4aa05` e às configurações presentes no repositório. Os documentos desta pasta descrevem o escopo efetivo; tabelas modeladas não significam APIs completas.

**Atualização operacional de 29/10/2026:** o [deploy AWS foi executado e verificado](DEPLOY_AWS_2026-10-29.md), com o commit `eb05c89`, HTTPS no IP público e 19 verificações reais aprovadas. As referências a acesso/deploy pendentes nos relatórios datados de 28/10 e no PDF pertencem àquela revisão; o adendo de 29/10 descreve a situação remota atual.

## Situação verificada

| Item | Evidência e limite |
|---|---|
| Backend | Node.js 22, Express, Zod 4.6.7, bcrypt e JWT com versão de sessão |
| Testes | 142 unitários/HTTP e 7 de integração aprovados; MySQL 8.0 e 8.4 testados localmente |
| Cobertura de todo `src` | 90,09% linhas, 87,10% instruções, 83,68% ramificações e 73,18% funções após integrar a main |
| TDD didático | 4 testes Green e 4 Refactor aprovados; Red tem 4 falhas intencionais |
| Banco | 40 tabelas, 68 FKs e migração aditiva `token_version`; disponibilidade por período ainda pendente |
| Docker | API/banco locais validados, imagem com usuário `node`, bancos de testes isolados |
| GitHub | [Issue #2](https://github.com/luizferraresso/Codesync/issues/2) e [PR #3](https://github.com/luizferraresso/Codesync/pull/3), em rascunho na consulta desta revisão; CI de push e PR aprovada |
| AWS | EC2/RDS existentes atualizados em 29/10; TLS público e do banco verificados, migração aplicada, 19 verificações operacionais aprovadas; restauração de backup ainda não ensaiada |
| Diagramas | 6 modelos editáveis, fontes DOT e previews PNG sincronizados com o código |
| Entrega acadêmica | PDF de 28/10 revisado; relatório de deploy de 29/10 disponível como adendo; identificação e consolidação acadêmica final pendentes |

Execuções CI verificadas: [Pull Request](https://github.com/luizferraresso/Codesync/actions/runs/40803522140) e [push](https://github.com/luizferraresso/Codesync/actions/runs/40803466021). Isso comprova as verificações desses commits, não implantação na AWS.

## Guia de leitura

| Documento | Conteúdo |
|---|---|
| [Resumo executivo](RESUMO_EXECUTIVO.md) | Entregas comprovadas e próximos passos |
| [Revisão geral](REVISAO_GERAL.md) | Correções, riscos e critérios do checkpoint |
| [Verificação e limitações](VERIFICACAO_E_LIMITACOES.md) | Resultados executados e o que não foi validado |
| [Arquitetura](arquitetura/ARQUITETURA.md) | Dependências efetivas das camadas e ambientes |
| [Modelagem e decisões](arquitetura/MODELAGEM_E_DECISOES.md) | Relação CP2/schema e regras que exigem serviços |
| [Matriz de requisitos](MATRIZ_REQUISITOS_CP2.md) | RF/RNF e evidências por escopo |
| [Rotas e permissões](ROTAS_E_PERMISSOES.md) | Contrato HTTP, perfis, limites e sessão |
| [Swagger](SWAGGER.md) | Uso e limites do OpenAPI |
| [Testes e evidências](TESTES_E_EVIDENCIAS.md) | Como reproduzir testes e coletar saídas |
| [Evidências consolidadas](EVIDENCIAS_CONSOLIDADAS_2026-10-28.md) | Transcrições reais de testes/Docker/HTTP e links da CI |
| [TDD](TDD_PLANO_E_EVIDENCIAS.md) | Laboratório e testes do backend real |
| [Diagramas](DIAGRAMAS_INTERACAO.md) | Conteúdo dos seis desenhos e regeneração |
| [Backlog e equipe](DIVISAO_EQUIPE_E_BACKLOG.md) | Trabalho concluído e pendências por responsável |
| [Apresentação](ROTEIRO_APRESENTACAO_6_MINUTOS.md) | Roteiro alinhado ao estado comprovado |
| [PDF e entrega](PDF_UNICO_E_ENTREGA.md) | Conteúdo, geração reproduzível e revisão acadêmica final |
| [Correções e Docker](CORRECOES_E_DOCKER_2026-10-28.md) | Detalhes técnicos das correções e execução |
| [Deploy AWS verificado](DEPLOY_AWS_2026-10-29.md) | Evidências de 29/10, HTTPS, migração, backup e renovação |
| [Roteiro AWS](../aws/DEPLOY_AWS.md) | Preflight, migração, rollback e procedimentos operacionais |

## Registros históricos

[Avaliação anterior às correções](AVALIACAO_PROJETO_2026-10-28.md), [consolidação de 24/10](RELATORIO_VALIDACAO_CONSOLIDACAO.md), [revisão do patch AWS](REVISAO_PATCH_AWS_2026-10-28.md) e os arquivos em `historico_partes/` preservam o contexto de suas respectivas versões. Declarações antigas sobre testes não executados ou lockfile ausente não descrevem o estado atual.
