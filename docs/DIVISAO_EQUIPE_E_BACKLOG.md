# Divisão de trabalho e backlog — CodeSync

**Revisão: 28/10/2026.** Manter Integrante 1…5 até a equipe confirmar a atribuição dos nomes. A [issue #2](https://github.com/luizferraresso/Codesync/issues/2) acompanha a consolidação publicada na [PR #3](https://github.com/luizferraresso/Codesync/pull/3); ainda é necessária revisão de outro integrante.

## Validações já realizadas

| Item original | Estado atual |
|---|---|
| DB-01: executar schema/seed/verificação | Executado localmente; 40 tabelas, 68 FKs e restrições verificadas |
| QA-01: dependências/lockfile/Jest/cobertura | Concluído; 149 testes do backend e 90,09% de linhas em todo src |
| QA-02: Docker e saúde | API e banco locais validados; bancos de integração isolados |
| AUTH-01: cadastro/login/troca/401/403 | Fluxos exercitados; versão de sessão e limite UTF-8 implementados |
| REST-01: rascunho e cancelamento restrito | Testados; bloqueio transacional e rollback cobertos |
| QA-03: pipeline inicial | Workflow publicado e execuções de push/PR aprovadas |
| DOC-01: documentação e fontes dos diagramas | Fontes/previews e PDF atualizados; identificação e revisão acadêmica final pendentes |

Esses resultados não encerram os módulos completos nem substituem testes das funcionalidades futuras.

## Próximas entregas por área

| Responsável | Prioridade e tarefa | Critério de conclusão |
|---|---|---|
| Integrante 1 — banco | P0: migração no ambiente remoto com backup e usuário autorizado; P1: inventário por intervalo, índices e recuperação | Migração comprovada, ausência de conflitos de disponibilidade e restauração ensaiada |
| Integrante 2 — segurança | P0: revisar PR, permissões reais AWS e TLS; P1: ampliar cenários de sessão/privacidade, acompanhar alertas de desenvolvimento | Revisão independente, acessos negativos e controles remotos exercitados |
| Integrante 3 — domínio | P1: pesquisa, seleção/cotação, disponibilidade e confirmação de reserva; integrações e regras definitivas | Fluxo completo testado sem confirmação fictícia nem overbooking |
| Integrante 4 — qualidade/DevOps | P0 AWS-01: obter acesso e inspecionar o ambiente existente; validar EC2/RDS, migração e HTTPS; P1: carga, monitoração e backup | URL HTTPS, configuração restrita e evidências reais; sem criar infraestrutura duplicada |
| Integrante 5 — documentação/SAC | P0 DOC-02: preencher equipe, revisar a submissão do PDF atualizado e ensaiar apresentação; P1 SAC-01/OCO-01: mensagens, DeepSeek, atendimento e penalidades manuais | PDF conferido, histórico de atendimento e decisões humanas rastreáveis |

## Ordem de execução

1. Revisar a PR publicada e integrar as correções à main conforme a política do repositório.
2. Obter acesso à AWS e identificar recursos/revisão/schema existentes antes de alterar o ambiente; conferir backup e migração.
3. Validar implantação remota e HTTPS; acrescentar ao PDF as evidências remotas quando existirem, sem atribuir à simulação resultados da nuvem.
4. Entregar funcionalidades futuras em incrementos com testes reais e manter CI/diagramas sincronizados.

Observabilidade e garantia transacional da auditoria continuam pendentes. Sessão revogável, paginação de catálogo e instalação reproduzível já estão implementadas. Confirmar com o professor a exigência de ProjectLibre e evidência semanal; não inventar commits ou testes históricos.

Branches seguem `feat/`, `fix/`, `test/`, `docs/`, `chore/` e `ci/`; usar commits semânticos e PR revisada conforme [CONTRIBUTING.md](../CONTRIBUTING.md).
