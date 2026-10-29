# Revisão técnica consolidada do projeto

**Atualização: 28/10/2026.** Esta revisão substitui o diagnóstico estático de 24/10 como orientação atual. Consulte [resultados e limitações](VERIFICACAO_E_LIMITACOES.md) e [índice da documentação](README.md).

## Estado das entregas

| Parte | Material | Situação |
|---|---|---|
| Banco | Schema, seed fictício, status básicos, verificação e migração | 40 tabelas e 68 FKs; SQL e restrições exercitados; MySQL 8.0/8.4 locais testados |
| Backend | API REST, autenticação, catálogo, rascunhos, ocorrências e auditoria | Código executado e regressões aprovadas; módulos de negócio ainda incompletos |
| Qualidade | Jest/Supertest, integração real, laboratório TDD, OpenAPI e CI | 149 testes do backend aprovados; 90,09% linhas de todo `src`; CI aprovada |
| Operação | Docker e procedimento EC2/RDS | Docker local validado; preflight e rollback simulados; AWS real não verificada |
| Documentação | Fontes editáveis, previews e documentos | Documentos, diagramas e PDF regenerados; identificação e revisão acadêmica final pendentes |

## Correções verificadas

- Senhas limitadas a 72 bytes UTF-8; troca de senha incrementa `token_version` no mesmo UPDATE do hash e revoga JWTs anteriores.
- Ocorrências validam propriedade e coerência de reservas, guias e alvos antes de gravar.
- Criação de pagamento interno e cancelamento de rascunho bloqueiam a mesma reserva dentro da transação; o fluxo não processa cobrança externa.
- Listagens públicas filtram visibilidade antes do limite e aceitam paginação; campos numéricos respeitam tipos SQL.
- Payload excessivo retorna 413; erros de restrição/intervalo retornam 422; troca de senha tem evento próprio de auditoria.
- Zod atualizado, lockfile publicado, `npm ci` no Docker/CI e cobertura aplicada a todo `src`.
- Alterações remotas da equipe foram integradas, preservando o uso de `originalUrl` na auditoria.

## Pendências que continuam relevantes

1. Obter acesso ao ambiente AWS relatado pelo integrante, inspecionar os recursos existentes, conferir backup, executar a migração com usuário autorizado e validar HTTPS, SGs, parâmetros e RDS. Não criar recursos duplicados sem conferir o ambiente.
2. Implementar pesquisa, disponibilidade por datas, seleção de quarto, cotação e confirmação transacional. Rascunho PENDENTE não bloqueia inventário.
3. Implementar integrações e regras definitivas, SAC/DeepSeek, reserva/avaliação de guia e aplicação manual de penalidades após análise humana.
4. Definir garantia de auditoria para operações críticas. Hoje a inserção em `tb_log` é best-effort e ocorre após a resposta; falha de gravação é logada, sem reverter a operação.
5. Ampliar observabilidade, retenção, testes de carga/resiliência, backup/restauração e testes de contrato das respostas OpenAPI.
6. Acompanhar seis alertas baixos em dependências de desenvolvimento Jest/deepmerge; a auditoria de produção registrada não apontou alertas.
7. Concluir revisão e merge da PR #3, preencher dados da equipe e revisar a submissão acadêmica do PDF atualizado. Confirmar exigência acadêmica de ProjectLibre/cronograma; não fabricar histórico semanal nem histórico test-first.

## Critério de validação do checkpoint

- [x] Schema e restrições executados; seed fictício somente no ambiente local.
- [x] Instalação reproduzível, sintaxe, integridade, cobertura e integração MySQL aprovadas.
- [x] Saúde, Swagger, autenticação, autorização e auditoria exercitados localmente.
- [x] CI de push e PR aprovada nos commits publicados.
- [x] Seis diagramas e documentação operacional alinhados ao backend desta revisão.
- [ ] Deploy público HTTPS e configuração real de EC2/RDS comprovados.
- [ ] Revisão de outro integrante e merge da PR concluídos.
- [x] PDF regenerado com diagramas e transcrições reais, com conferência de conteúdo e renderização.
- [ ] Identificação da equipe, capturas adicionais exigidas pelo professor e apresentação finais conferidas.

RF32–RF34 tratam de logs; RF26 trata de resposta do chatbot. A existência das tabelas de um domínio não equivale a requisito implementado. O laboratório TDD foi reconstruído depois da implementação inicial e não comprova que ela nasceu de test-first.
