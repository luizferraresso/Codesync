# Avaliação técnica do HospedJá — 28/10/2026

> Registro histórico do estado anterior às correções. Para o estado atual, consulte [correções e execução Docker](CORRECOES_E_DOCKER_2026-10-28.md).

O projeto tem uma boa estrutura inicial e os testes existentes passaram, mas há defeitos reproduzidos e funcionalidades centrais pendentes. **Ainda não está pronto para produção. Minha avaliação técnica é 6/10 como projeto em desenvolvimento**, sem pretensão de substituir a rubrica acadêmica do professor.

## Escopo e ambiente

- Revisados código, configurações, banco, testes, CI, documentação, requisitos e artefatos.
- Ambiente efetivo: Windows, Node.js 24.22.1, npm 11.19.1 e MySQL 9.6.0. O ambiente de referência do projeto é Node.js 22 + MySQL 8; a compatibilidade nessas versões ainda precisa ser executada.
- Dependências instaladas e `package-lock.json` gerado. As versões efetivamente avaliadas estão nesse arquivo.
- Banco iniciado em instância temporária própria, em `127.0.0.1:13308`, com diretório de dados separado. O serviço MySQL já existente na máquina não foi usado.
- Docker indisponível: não houve build ou execução de contêineres. AWS, HTTPS público, carga e restauração de backups não foram validados.
- Nenhum código de aplicação foi corrigido nesta revisão. O relatório descreve o estado encontrado, permitindo planejar as correções.

## Resultados executados

| Verificação | Resultado |
|---|---|
| `npm run check` | 38 arquivos JavaScript; zero erros de sintaxe |
| `npm run integrity` | 38 módulos, 100 imports relativos, 40 tabelas; zero problemas nessa checagem |
| `python scripts/verify-artifacts.py` | Seis diagramas estruturalmente válidos, arquivos obrigatórios presentes, assinatura PDF válida |
| `npm run test:coverage` | 5 suítes; 22 testes unitários/HTTP aprovados |
| `npm run test:db` com `RUN_DB_TESTS=1` | 2 testes aprovados contra MySQL real temporário |
| `npm run test:tdd:red` | 4 falhas intencionais, conforme o laboratório |
| `npm run test:tdd:green` | 4 testes aprovados |
| `npm run test:tdd:refactor` | 4 testes aprovados |
| SQL: schema, seed e verificação | Três scripts executados; 40 tabelas e 68 chaves estrangeiras |
| Verificações adicionais da API real | 33 verificações: 25 comportamentos esperados e 8 achados, incluindo uma melhoria de política de sessões |
| Restrições reais do banco e rate limit | 6 verificações adicionais aprovadas |
| Validação sintática de YAML | Compose principal, OpenAPI e CI válidos; Compose de integração inválido |
| `npm audit --json` | 7 alertas em pacotes: 1 alto e 6 baixos; nenhum crítico |

O modo de cobertura executa a mesma suíte de `npm test`, incluindo os testes de `test:unit` e `test:http`. A medição ampliada abaixo repetiu essa suíte exclusivamente para avaliar o restante do código. Os testes HTTP originais usam mocks; os testes adicionais e a suíte DB utilizaram persistência real.

As verificações adicionais aprovadas incluem saúde, Swagger, OpenAPI, JSON malformado, autenticação, bloqueio de consulta a reservas/pagamentos/ocorrências de terceiros, privacidade dos guias, permissões do gestor, criação e edição de quartos, reserva pendente, cancelamento sem pagamento, bloqueio de cancelamento com pagamento, registro administrativo de pagamento e análise humana de ocorrência. O banco rejeitou email duplicado, FK inexistente, diária negativa, checkout inválido e ocorrência com dois alvos. O limitador retornou HTTP 429 na 16ª tentativa de autenticação.

## Cobertura: o número atual representa uma seleção pequena

`jest.config.cjs` seleciona apenas seis arquivos. Por isso, o percentual padrão não representa a cobertura de toda a API.

| Escopo medido | Instruções | Ramificações | Funções | Linhas |
|---|---:|---:|---:|---:|
| Seis arquivos selecionados no Jest | 90,72% | 80,76% | 84,21% | 97,46% |
| Todo `src/**/*.js` | 50,00% | 23,16% | 27,20% | 55,96% |

Na medição ampliada, serviços de reservas, pagamentos, ocorrências e catálogo têm cobertura de linhas de 11,62%, 14,28%, 21,73% e 13,88%, respectivamente. A cobertura de rotas em 100% indica que as declarações das rotas foram carregadas; não comprova seus fluxos de negócio.

Comando usado para a medição ampliada:

```powershell
npm.cmd run test:coverage -- '--collectCoverageFrom=src/**/*.js' '--coverageDirectory=../validacao-2026-10-28/coverage-completa' '--coverageThreshold={}'
```

O último argumento desativa o limiar somente nessa medição diagnóstica. A configuração do projeto permaneceu intacta. Os percentuais ampliados ficariam abaixo dos limiares atuais se estes fossem aplicados a todo o código.

## Correções prioritárias

| Prioridade | Achado e evidência | Correção necessária |
|---|---|---|
| Alta | **Pagamento pode ser criado em reserva já cancelada.** Em concorrência controlada, o pagamento leu PENDENTE, aguardou antes de abrir sua transação, o cancelamento terminou e o pagamento retornou 201. O banco terminou com `CANCELADA` e um pagamento vinculado. | Em `src/services/payment.service.js:28`, mover leitura, validação e bloqueio da reserva para dentro da mesma transação da criação; usar uma ordem de bloqueio comum ao cancelamento. Adicionar regressão concorrente. |
| Alta | **Ocorrência aceita vínculo com reserva alheia.** Um cliente recém-criado enviou `id_reserva=1` e `id_reserva_guia=1`, pertencentes ao cliente do seed, e recebeu 201. Não houve exposição dos detalhes da reserva nesse teste, mas houve associação indevida. | Em `src/services/occurrence.service.js:20`, validar propriedade/permissão das reservas informadas e coerência entre reserva, guia e alvo, antes de persistir. |
| Alta | **Alerta de dependência de produção em Zod 3.25.76.** A auditoria apontou consumo excessivo de memória; a migração indicada ultrapassa a versão principal permitida em `package.json`. | Planejar atualização compatível e executar regressões de validação; não aplicar `audit fix --force` indiscriminadamente. O limite JSON de 100kb reduz a entrada, mas não foi demonstrada a explorabilidade específica do alerta nesta aplicação. |
| Média | **Senhas Unicode distintas podem autenticar como a mesma senha.** O schema aceita 72 caracteres, enquanto o bcrypt considera até 72 bytes. Foram aceitas pelo schema duas entradas formadas por 36 caracteres `é` seguidos de letras diferentes; a comparação contra o mesmo hash retornou verdadeira. | Validar tamanho em bytes UTF-8 no cadastro, troca e bootstrap administrativo. Definir tratamento compatível para senhas já cadastradas antes de alterar o comportamento. Arquivos: `src/validators/schemas.js:15`, `src/utils/security.js:5` e `src/cli/bootstrap-admin.js:37`. |
| Média | **Compose de integração não é YAML válido.** Aspas internas não escapadas no healthcheck provocam erro de parsing. | Corrigir `compose.integration.yaml:17` e validar com `docker compose -f compose.integration.yaml config` antes de subir os serviços. |
| Média | **Validação aceita quantidade que o banco não suporta.** `quantidade_disponivel=100000` passa no Zod, ultrapassa `SMALLINT UNSIGNED` e retorna 500. | Alinhar `src/validators/schemas.js:42` ao máximo 65535 ou alterar o tipo via migração; revisar também limites de IDs e campos monetários. |
| Média | **Corpo JSON acima de 100kb retorna 500.** O limite atua, mas o tratador converte o erro de tamanho para erro interno. | Preservar HTTP 413 e erro padronizado em `src/middlewares/error-handler.js`; testar também outras falhas do parser. |
| Média | **Troca de senha registrada como cadastro.** O evento persistido para `PATCH /auth/password` tem `acao=CADASTRO`. | Corrigir o mapeamento em `src/middlewares/audit.js:10`; registrar ações distintas e revisar os IDs dos registros criados. |
| Média | **Listagem pública pode esconder todos os hotéis ativos.** Com 100 hotéis inativos mais novos, um hotel ativo existente desapareceu da listagem. A filtragem ocorre depois de `LIMIT 100`. O padrão também afeta guias. | Em `src/services/catalog.service.js:35`, aplicar os filtros de visibilidade no SQL antes do limite e implementar paginação. |

As severidades acima são uma avaliação do impacto no projeto. A classificação alta do Zod é a classificação do alerta npm.

Os seis alertas baixos estão na cadeia de desenvolvimento do Jest/deepmerge; são efeitos de dependências transitivas, não seis vulnerabilidades independentes demonstradas na API. A sugestão automática de correção inclui downgrade incompatível do Jest e precisa ser analisada.

Referências consultadas: [alerta Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) e [alerta deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). O JSON integral da auditoria foi salvo nas evidências locais.

## Melhorias de confiabilidade e qualidade

- **Sessões:** um JWT emitido antes da troca de senha continuou acessando `/usuarios/me` com 200. Isso corresponde ao comportamento atual de tokens sem revogação; definir a política de segurança e, se necessário, implementar versão de sessão ou revogação. Não há requisito explícito de revogação imediata no código revisado.
- **Auditoria:** a persistência é best-effort e ocorre após a resposta. Definir garantias para operações críticas, observabilidade das falhas e eventual uso de outbox transacional.
- **CI:** adotar `npm ci` agora que existe lockfile, testar MySQL real em serviço isolado, validar os YAMLs e incluir regressões dos defeitos encontrados. O workflow atual não executa integração DB nem auditoria de dependências.
- **Cobertura:** medir todo o código pertinente e aumentar gradualmente testes de domínio, autorização, rollback e concorrência. Não usar a cobertura seletiva como indicador global.
- **OpenAPI:** o YAML carrega, mas várias respostas são genéricas e não validam o contrato real. Completar schemas de respostas e incluir testes de contrato. Carregar o Swagger não comprova conformidade integral.
- **Entrega:** o verificador de PDF valida somente a assinatura `%PDF-`; não revisa conteúdo visual, paginação ou atendimento à rubrica acadêmica. Atualizar documentação e PDF com evidências reais desta execução.
- **Checksums:** dos 124 arquivos listados no manifesto, 27 diferem byte a byte. Em 26 a diferença se explica por CRLF/LF; `src/middlewares/audit.js` também difere após normalização. Nenhum arquivo está ausente. Revisar a origem dessa divergência e regenerar o manifesto na consolidação final. Isso não é, por si só, evidência de corrupção ou adulteração.

## O que ainda falta implementar

A matriz existente contém **7 requisitos funcionais em implementação inicial, 8 parciais e 20 pendentes**, de 35. Esses estados não significam que os sete iniciais estejam integralmente concluídos ou certificados.

1. **Fluxo principal de hospedagem:** pesquisa por destino, datas e hóspedes; disponibilidade por período; seleção de quarto; cotação no servidor; confirmação transacional sem conflito de inventário.
2. **Pagamentos completos:** integração Mercado Pago, confirmação via webhook autenticado, idempotência, estornos e regra dos sete dias, com histórico consistente.
3. **Guias:** reserva de guia interno, elegibilidade de avaliações e contato com guias externos conforme as regras de privacidade do produto.
4. **SAC e IA:** API de atendimentos, mensagens, integração DeepSeek, encaminhamento humano, permissões do operador e histórico.
5. **Ocorrências e penalidades:** validar os vínculos e implementar aplicação manual de penalidades após análise humana, com rastreabilidade.
6. **Interface e operação:** cliente web/mobile previsto, testes de usabilidade, implantação de homologação com HTTPS, monitoração, backups e ensaio de restauração.

## Ordem sugerida para a equipe

1. Corrigir concorrência de pagamentos, associação de ocorrências e limite de senhas; tratar o alerta Zod com migração e regressões.
2. Corrigir Compose, limites numéricos, erros HTTP, classificação de auditoria e filtros SQL; adicionar testes para cada defeito.
3. Usar o lockfile na CI e reproduzir os testes em Node.js 22 + MySQL 8 e Docker. Incluir banco real e cobertura ampla como verificações contínuas.
4. Entregar um fluxo completo e testado de pesquisa → quarto → cotação → reserva → pagamento → cancelamento antes de ampliar SAC e IA.
5. Atualizar requisitos, documentação e PDF; preparar homologação, observabilidade e interface.

## Avaliação e arquivos gerados

Os pontos fortes são a separação em camadas, SQL parametrizado, validação de entrada, uso de bcrypt/JWT, consulta do perfil atual no banco, controles de propriedade já existentes e documentação extensa. Os limites principais são a baixa cobertura dos serviços de domínio, os defeitos reproduzidos e a ausência do fluxo central de uma reserva real.

A nota técnica de **6/10** reflete uma base organizada que ainda exige desenvolvimento e validação significativa. Ela não mede apenas a aprovação dos testes e não representa uma nota oficial da disciplina.

Foram gerados este relatório e `package-lock.json`; as dependências estão em `node_modules/`. A exclusão de `teste.java` já constava no estado inicial do Git e foi preservada. Não houve commit nem alteração dos arquivos de aplicação.

Evidências locais, fora do repositório, na pasta irmã `../validacao-2026-10-28/`:

- `runtime-review.json`: resultados individuais das 33 verificações adicionais.
- `runtime-review.cjs`: roteiro reproduzível dos fluxos e da concorrência controlada.
- `constraints-review.cjs`: testes de restrições e rate limit.
- `structural-review.txt` e `structural-review.cjs`: YAMLs e comparação do manifesto.
- `npm-audit.json`: auditoria integral das dependências.
- `jest-coverage.txt`: saída da cobertura padrão.
- `coverage-completa/index.html`: relatório ampliado de cobertura.

O relatório padrão está em `coverage/index.html`. A instância temporária foi encerrada e suas credenciais descartadas ao final; os scripts adicionais dependem de nova preparação de um banco isolado, com schema e seed fictício. Não executar esses roteiros contra banco com dados reais: eles alteram registros de teste.
