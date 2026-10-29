# Matriz de rastreabilidade - documento técnico do Checkpoint 2

**Origem:** tabela de requisitos do arquivo `referencias/checkpoint2/HospedJa_Documento_Tecnico_Completo (1).docx`.

**Revisão: 28/10/2026.** Testado no escopo = endpoint/regras atuais exercitados localmente, sem certificar todo o requisito em produção; Parcial = parte do requisito disponível; Pendente = implementação insuficiente. A matriz contém 7 itens testados no escopo, 8 parciais e 20 pendentes. Evidências: [verificação](VERIFICACAO_E_LIMITACOES.md).

| ID | Descrição do requisito no CP2 | Estado | Evidência ou lacuna |
|---|---|---|---|
| RF01 | Permitir cadastro de clientes. | Testado no escopo | POST /api/v1/auth/register; validação, bcrypt/UTF-8 e persistência testados |
| RF02 | Permitir login e autenticação de usuários. | Testado no escopo | POST /api/v1/auth/login; JWT sub/sv, conta ativa e revogação após troca de senha; unitário/HTTP e DB |
| RF03 | Permitir pesquisa de hospedagens por destino, datas e quantidade de hóspedes. | Pendente | Pesquisa por destino/datas/hóspedes |
| RF04 | Listar hospedagens compatíveis com os critérios de pesquisa. | Parcial | Listagem de hotéis, sem mecanismo de pesquisa |
| RF05 | Exibir detalhes das hospedagens, incluindo informações, comodidades, localização, fotos e valores. | Parcial | GET /hoteis/:id, sem endereço/fotos agregados |
| RF06 | Permitir consultar quartos disponíveis e seus detalhes. | Parcial | GET /quartos; sem checagem por período |
| RF07 | Verificar disponibilidade do quarto antes da confirmação da reserva. | Pendente | Disponibilidade por datas e controle de inventário |
| RF08 | Permitir selecionar quarto e calcular o valor da reserva. | Pendente | Seleção de quarto e cálculo de valor |
| RF09 | Permitir confirmar reservas antecipadas. | Pendente | Somente rascunho de reserva PENDENTE |
| RF10 | Permitir consultar reservas realizadas. | Testado no escopo | GET /reservas e GET /reservas/:id; propriedade/ADMIN testados, sem confirmação definitiva |
| RF11 | Permitir cancelar reservas conforme as regras definidas. | Parcial | Somente cancelamento de rascunho sem pagamento |
| RF12 | Integrar o pagamento da reserva ao Mercado Pago. | Pendente | Mercado Pago não integrado |
| RF13 | Registrar e consultar o status do pagamento. | Parcial | Persistência e leitura de status; sem confirmação real |
| RF14 | Controlar a regra de pagamento de até 7 dias antes da chegada. | Pendente | Regra de sete dias não aplicada no fluxo definitivo |
| RF15 | Permitir pesquisar guias. | Parcial | Listagem de guias, sem filtros especializados |
| RF16 | Permitir consultar guias internos e externos. | Testado no escopo | GET /guias com visibilidade/paginação e proteção de campos privados; sem fluxo de reserva de guia |
| RF17 | Permitir reservar guia interno. | Pendente | Reserva de guia interno |
| RF18 | Permitir acessar informações e entrar em contato com guia externo. | Parcial | Dados básicos; contato não é exposto pela visão pública atual, política de contato ainda precisa ser concluída |
| RF19 | Permitir avaliar guias após a utilização do serviço. | Pendente | Avaliação de guia por API |
| RF20 | Permitir registrar ocorrências relacionadas aos guias. | Testado no escopo | POST /ocorrencias; propriedade e coerência dos vínculos validadas, com regressões unitárias/DB |
| RF21 | Permitir ao administrador analisar ocorrências. | Testado no escopo | PATCH /ocorrencias/:id/analise, somente ADMIN; revisão humana testada, sem aplicar pena |
| RF22 | Permitir ao administrador aplicar penalidades a guias quando cabível. | Pendente | Sem endpoint de aplicar penalidade |
| RF23 | Disponibilizar SAC/Chatbot ao cliente autenticado. | Pendente | Persistência SAC prevista apenas no banco |
| RF24 | Permitir envio de mensagens ao chatbot. | Pendente | Sem API de mensagens do chatbot |
| RF25 | Enviar as mensagens do chatbot à API DeepSeek para processamento. | Pendente | Sem integração com DeepSeek |
| RF26 | Apresentar respostas automatizadas geradas pelo serviço de IA. | Pendente | Sem respostas geradas por IA |
| RF27 | Permitir encaminhar uma solicitação para atendimento humano quando necessário. | Pendente | Sem encaminhamento a atendimento humano |
| RF28 | Permitir ao operador de SAC/Ouvidoria visualizar e acompanhar solicitações de atendimento. | Pendente | Sem rotas do operador SAC |
| RF29 | Permitir ao operador de SAC/Ouvidoria registrar interações, encaminhamentos, respostas e encerramento de atendimentos. | Pendente | Sem gerenciamento de atendimento |
| RF30 | Permitir ao operador de SAC/Ouvidoria consultar informações da reserva e do atendimento necessárias para tratar a solicitação, respeitando suas permissões. | Pendente | Sem consulta SAC baseada em permissão |
| RF31 | Permitir ao operador de SAC/Ouvidoria sinalizar uma solicitação como escalonada para outro responsável quando necessário. | Pendente | Sem rota de escalonamento |
| RF32 | Registrar logs das ações relevantes realizadas no sistema. | Testado no escopo | Middleware com originalUrl, ALTERACAO_SENHA, tb_log/Winston; persistência e sanitização testadas, best-effort |
| RF33 | Associar os registros de log ao usuário, operação, data e horário correspondentes. | Parcial | Grava usuário/operação/timestamp/IP; persistência de auditoria não é garantida |
| RF34 | Registrar eventos relevantes das interações com o SAC/Chatbot para rastreabilidade. | Pendente | Sem integração ativa de eventos SAC |
| RF35 | Permitir controle do histórico das solicitações de atendimento. | Pendente | Histórico no banco sem API de atendimento |

## Requisitos não funcionais identificados no CP2

A conformidade com RNF depende de medição, inspeção e testes; a simples existência de código não é prova.

| ID | Descrição original |
|---|---|
| RNF01 | Usabilidade: a interface deverá ser clara, intuitiva e consistente. |
| RNF02 | Responsividade: as telas deverão se adaptar a diferentes tamanhos de tela. |
| RNF03 | Desempenho: as principais operações deverão apresentar tempo de resposta adequado. |
| RNF04 | Segurança: funcionalidades restritas deverão exigir autenticação e autorização adequadas. |
| RNF05 | Proteção de dados: dados pessoais e credenciais deverão ser armazenados de forma segura. |
| RNF06 | Integridade: reservas e disponibilidade de quartos deverão manter consistência e evitar conflitos. |
| RNF07 | Integrações seguras: comunicação com Mercado Pago e DeepSeek deverá utilizar mecanismos seguros de transporte e autenticação. |
| RNF08 | Rastreabilidade: ações relevantes deverão ser registradas em logs. |
| RNF09 | Manutenibilidade: o software deverá ser organizado de forma modular e documentada. |
| RNF10 | Confiabilidade: falhas de integrações externas deverão ser tratadas sem comprometer a consistência dos dados internos. |
| RNF11 | Disponibilidade: o sistema deverá permanecer acessível durante as janelas previstas de operação. |
| RNF12 | Mensagens de erro: o sistema deverá fornecer mensagens claras sem expor informações sensíveis. |
| RNF13 | Privacidade: o sistema deverá coletar e armazenar somente dados necessários às finalidades previstas. |
| RNF14 | Auditoria: registros de logs deverão possuir informações suficientes para investigação de operações e incidentes. |

## Evidência atual dos requisitos não funcionais

| RNF | Situação verificada e limite |
|---|---|
| RNF01–RNF02 | Interface e ensaios de usabilidade/responsividade pendentes |
| RNF03 | Carga e metas de desempenho ainda não medidas; duração de Jest não é benchmark da aplicação |
| RNF04–RNF05 | Controles de autenticação/autorização, hash, limite UTF-8 e sessão testados localmente; configuração remota e proteção completa de dados ainda precisam de validação |
| RNF06 | Cancelamento/lançamento interno protegidos por transação e bloqueio; inventário de quartos por período ainda não implementado |
| RNF07 | Integrações externas não estão ativas; transporte/autenticação dessas integrações não comprovados |
| RNF08 | Eventos e sanitização exercitados; persistência é best-effort |
| RNF09 | Separação de responsabilidades, documentação, lockfile, testes e CI presentes; isso não substitui manutenção contínua |
| RNF10 | Rollback local de transações e procedimento de deploy exercitados; falhas de integrações futuras não testadas |
| RNF11 | Saúde local verificada; disponibilidade e recuperação do ambiente remoto ainda não medidas |
| RNF12 | Erros de entrada, autenticação e tamanho de corpo padronizados/testados; contrato completo de respostas segue pendente |
| RNF13 | Campos privados de guias e segredos de logs protegidos nos cenários testados; retenção e política completa de privacidade precisam de definição |
| RNF14 | Usuário, ação, resultado, IP e data/hora registrados nos testes; garantia transacional e política de investigação/retenção ainda pendentes |

## Regras principais do CP2

RN01: limite de sete dias para pagamento; RN02: autenticação obrigatória; RN03: disponibilidade; RN04: análise humana antes de punições; RN05: API DeepSeek; RN06: logs. Verificar implementação antes de declarar qualquer regra atendida.
