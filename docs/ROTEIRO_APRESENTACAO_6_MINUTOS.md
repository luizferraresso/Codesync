# Roteiro de apresentação — seis minutos

**Revisão: 28/10/2026.** Substituir Integrante 1…5 pelos nomes confirmados. Apresentar evidências já existentes e deixar claros os limites, sem atribuir testes locais à AWS.

| Tempo | Pessoa | Tela e fala sugerida |
|---|---|---|
| 0:00–0:45 | Integrante 1 | Identificar CodeSync/HospedJá e objetivo da API REST; distinguir backend atual de produto completo |
| 0:45–1:50 | Integrantes 1 e 2 | Diagramas 01/02: módulos, acessos ao pool, bcrypt/UTF-8, JWT com versão de sessão e papel vindo do banco |
| 1:50–2:55 | Integrantes 2 e 3 | Banco com 40 tabelas; diagrama 04: rascunho, autorização e transação compartilhada; disponibilidade/confirmação ainda pendentes |
| 2:55–4:00 | Integrantes 3 e 4 | Exibir Jest/CI: 142 testes unitários/HTTP, 7 DB, 90,09% linhas; explicar que o laboratório TDD é reconstruído |
| 4:00–4:55 | Integrante 4 | Swagger e Docker locais; MySQL 8.0/8.4 testados. Mostrar preflight/rollback como preparação e simulação, sem alegar deploy AWS comprovado |
| 4:55–5:40 | Integrante 5 | Diagramas 03/05/06: auditoria best-effort, vínculos de ocorrências e análise humana; sem aplicação automática de penalidades |
| 5:40–6:00 | Integrante 5 | PR #3 publicada com CI aprovada, revisão/merge pendentes; próximos incrementos e revisão acadêmica do PDF atualizado |

## Perguntas prováveis

- **O código foi todo criado com TDD?** Não. O laboratório Red/Green/Refactor foi construído depois da implementação inicial; novos incrementos devem registrar ciclos reais.
- **Os testes usam banco real?** As suítes unitárias/HTTP usam mocks; sete testes de integração usam MySQL isolado. Informar os dois grupos separadamente.
- **Por que a cobertura mudou?** A configuração antiga selecionava seis arquivos; agora mede todo `src`, com limiares globais e resultado registrado de 90,09% de linhas.
- **A troca de senha invalida tokens antigos?** Sim; a versão da sessão é incrementada junto com o hash e conferida em cada autenticação.
- **A reserva está pronta para uso comercial?** Não; são rascunhos, sem inventário por período, cotação e confirmação definitiva. Integrações externas permanecem no backlog.
- **Onde está a AWS?** Existe relato de um integrante, mas o acesso e a URL não foram disponibilizados para validação. Foram concluídos compatibilidade local e testes simulados do procedimento.
- **As ocorrências aplicam punição?** Não. ADMIN analisa o registro; a API de aplicação manual ainda não foi implementada.
- **A auditoria é garantida na mesma transação?** Não. Ela é sanitizada e exercitada, mas best-effort após a resposta; uma garantia transacional é evolução pendente.

Links e evidências: [documentação](README.md), [verificação](VERIFICACAO_E_LIMITACOES.md), [matriz](MATRIZ_REQUISITOS_CP2.md) e [guia do PDF](PDF_UNICO_E_ENTREGA.md).
