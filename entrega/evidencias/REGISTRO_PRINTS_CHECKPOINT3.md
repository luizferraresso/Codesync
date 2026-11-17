# Registro de imagens recebidas — Checkpoint 3

Referência: imagens anexadas pelo usuário nesta conversa durante a execução do roteiro. Este arquivo registra a avaliação e os dados de correlação. As imagens 01 e 02 foram conferidas também nos arquivos locais da pasta `Teste_Checkpoint-3_Imgs` e copiadas, sem edição, para `entrega/evidencias/prints_checkpoint3`. Ainda precisam ser inseridas no PDF final. A terceira imagem recebida, do console AWS, é registrada abaixo como diagnóstico.

## Imagem 01 — Saúde da API

**Avaliação: válida.** O navegador mostra o endereço público `44.201.28.10/health` e a resposta `{"status":"ok","service":"hospedja-api"}`. Serve como evidência de resposta da API na nuvem; o código do endpoint consulta o banco antes de responder. O código HTTP não aparece explicitamente nessa captura.

Destino previsto: espaço da Evidência 01 no documento técnico do Checkpoint 3.

Arquivo preservado: `prints_checkpoint3/01_api_health_nuvem.png`.

## Imagem 02 — Cadastro pela API

**Avaliação: válida.** O Swagger mostra POST para `https://44.201.28.10/api/v1/auth/register`, código HTTP 201 e resposta com os seguintes dados necessários à correlação:

- id_usuario: `5`.
- nome: `Evidencia Checkpoint 3`.
- email: `evidencia.cp3.20261116@example.test`.
- tipo_usuario: `CLIENTE`.
- status: `ATIVO`.

A senha do corpo enviado está coberta na imagem. Não há token ou hash na resposta visível. Esta imagem comprova a resposta de criação pela API; a comparação com a consulta no RDS foi confirmada posteriormente pela Imagem 04.

Destino previsto: espaço da Evidência 02. No passo 04, conferir o mesmo ID `5` e o mesmo e-mail.

Arquivo preservado: `prints_checkpoint3/02_cadastro_api_201.png`.

## Imagem 03 — Diagnóstico de acesso ao console AWS

**Avaliação: captura de diagnóstico, não evidência de conexão ao banco.** O seletor do console está em **Estados Unidos (Ohio)**, região `us-east-2`. A implantação conhecida do projeto está em **Estados Unidos (Norte da Virgínia)**, região `us-east-1`.

A lista vazia nessa região não demonstra ausência da instância do projeto. Para continuar: alterar o seletor para Norte da Virgínia, atualizar a lista de EC2, selecionar `hospedja-api` e conectar pelo Session Manager. Identificador registrado da instância: `i-04224fefd180258c6`.

Não criar outra instância para resolver essa diferença de região.

## Imagem 05 — E-mail duplicado

**Avaliação: válida.** Arquivo local `Teste_Checkpoint-3_Imgs/05_email_duplicado_409.png`: POST no endpoint publicado de cadastro, HTTP 409, código `EMAIL_CADASTRADO` e mensagem `Email ja cadastrado`. A senha está coberta. Cópia preservada em `prints_checkpoint3/05_email_duplicado_409.png`.

## Imagem 06 — CPF duplicado

**Avaliação: válida.** Arquivo local `Teste_Checkpoint-3_Imgs/06_cpf_duplicado_409.png`: utiliza outro e-mail com o mesmo CPF de demonstração, recebe HTTP 409, código `CPF_CADASTRADO` e mensagem `CPF ja cadastrado`. A senha está coberta. Cópia preservada em `prints_checkpoint3/06_cpf_duplicado_409.png`.

## Imagem 07 — Login recebido; substituir para a entrega

**Avaliação atual: resultado funcional válido; recomendado recorte seguro antes da inclusão no PDF.** A versão local mais recente de `Teste_Checkpoint-3_Imgs/07_perfil_autenticado_200.png` mostra GET `/api/v1/usuarios/me`, HTTP 200 e usuário ID `5`, com dados consistentes com as Imagens 02 e 04. O usuário cobriu o cabeçalho Authorization, mas há fragmentos de texto visíveis no bloco Curl. Para a versão final, manter apenas Request URL, código HTTP e Response body, retirando todo o bloco Curl. O token não foi transcrito neste registro nem copiado para a pasta de imagens aprovadas.

Para substituir: usar o token no Authorize do Swagger, executar GET `/api/v1/usuarios/me` e capturar apenas o status e o corpo de resposta, sem o cabeçalho Authorization. Conferir usuário ID `5`. Após terminar a demonstração, a troca de senha invalida a versão anterior da sessão.

## Nova captura do console AWS — região corrigida

**Avaliação: válida como evidência complementar da infraestrutura.** A nova imagem enviada na conversa mostra Norte da Virgínia (`us-east-1`), instância `hospedja-api`, ID `i-04224fefd180258c6`, estado Executando e 3/3 verificações aprovadas. O IP público coincide com o endereço usado nos testes da API. Esta captura não substitui as consultas de conexão/persistência ao RDS dos passos 03 e 04.

Próxima ação na interface mostrada: com a instância selecionada, Conectar → Session Manager / Gerenciador de sessão → Conectar.

## Imagem 03 — Consulta realizada no Session Manager

**Avaliação: válida.** A imagem mais recente do terminal recebida na conversa mostra banco `hospedja`, MySQL `8.4.11`, `conexao_ok=1`, `Ssl_version=TLSv1.3` e a coluna `cpf` com `IS_NULLABLE=NO` e `COLUMN_KEY=UNI`. A sessão está conectada à instância `hospedja-api` correta.

Serve como Evidência 03 de conexão e restrições do CPF. O arquivo original foi encontrado posteriormente em `Teste_Checkpoint-3_Imgs/03_banco_conexao_cpf.png` e conferido visualmente. Cópia preservada em `prints_checkpoint3/03_banco_conexao_cpf.png`.

## Imagem 04 — Persistência confirmada no RDS

**Avaliação: válida.** Arquivo local `Teste_Checkpoint-3_Imgs/04_persistencia_usuario_rds.png`: consulta a tb_usuario realizada na instância correta, retornando ID `5`, nome `Evidencia Checkpoint 3`, e-mail `evidencia.cp3.20261116@example.test`, perfil CLIENTE e status ATIVO. Os dados correspondem ao cadastro HTTP 201 da Imagem 02. Cópia preservada em `prints_checkpoint3/04_persistencia_usuario_rds.png`.

## Conferência completa da pasta de imagens

A pasta `Teste_Checkpoint-3_Imgs` continha sete imagens na conferência mais recente; todas foram inspecionadas visualmente.

| Evidência | Situação |
|---|---|
| 01 — Saúde da API | Aprovada |
| 02 — Cadastro HTTP 201 | Aprovada |
| 03 — Conexão/TLS/CPF NOT NULL e UNIQUE | Aprovada |
| 04 — Persistência do mesmo usuário no RDS | Aprovada |
| 05 — E-mail duplicado HTTP 409 | Aprovada |
| 06 — CPF duplicado HTTP 409 | Aprovada |
| 07 — Perfil autenticado HTTP 200 | Resultado correto; retirar o bloco Curl do recorte para o PDF |
| 08 — tb_log com motivos específicos | Arquivo ainda ausente; principal evidência restante da exigência do professor |
| 09 — Resumo dos testes e cobertura | Arquivo ainda ausente; necessário para preencher o nono quadro planejado, como evidência complementar |

As seis primeiras imagens estão prontas para inclusão. Para completar os nove quadros planejados: preparar o recorte final da 07 e produzir 08 e 09. Os dados da equipe na capa continuam a cargo dos integrantes. Esta conferência não substitui os quadros do PDF por imagens automaticamente.

## Atualização — captura dos logs recebida e aprovada

O usuário reorganizou os nomes dos arquivos na pasta original: e-mail duplicado em `05a_email_duplicado_409.png`, CPF duplicado em `05b_cpf_duplicado_409.png`, perfil em `06_perfil_autenticado_200.png` e logs em `07_logs_motivos.png`. A numeração dos espaços do PDF permanece independente desses nomes.

**Evidência de logs: aprovada.** `Teste_Checkpoint-3_Imgs/07_logs_motivos.png` mostra ID, ação, resultado, motivo e data/hora. Contém os motivos de CPF e e-mail já cadastrados e eventos de autenticação. Cópia preservada para o espaço 08 em `prints_checkpoint3/08_logs_motivos.png`.

O salto aparente de id_log 164 para 191 foi verificado por consulta somente leitura ao RDS. Todos os 26 IDs do intervalo 165 a 190 existem: 24 eventos UNKNOWN_POST e 2 VALIDATE_POST. Eles não aparecem no print porque a consulta filtra apenas CADASTRO e AUTENTICACAO. Não há IDs ausentes nesse intervalo. Referência da conferência SSM: `8142d3e8-2e04-4c9a-93d1-0bfb5be54762`.

Pendências atualizadas para os nove quadros: recorte seguro do perfil autenticado e captura do resumo de testes/cobertura. A captura dos logs não precisa ser refeita por causa do salto mostrado.

## Atualização — testes automatizados e cobertura recebidos

**As duas capturas foram aprovadas e se complementam.** Ambas foram inspecionadas visualmente nos arquivos originais:

- `Teste_Checkpoint-3_Imgs/08a_testes_cobertura.png`: comando `npm.cmd run test:coverage`, execução de Jest com cobertura, arquivos de teste com PASS e métricas globais na linha All files.
- `Teste_Checkpoint-3_Imgs/08b_testes_cobertura.png`: continuação da cobertura e resumo final com 15 suítes aprovadas de 15, 195 testes aprovados de 195, zero snapshots e duração registrada de 6,673 segundos.

| Métrica global | Valor observado |
|---|---|
| Instruções / Statements | 87,05% |
| Ramificações / Branches | 83,40% |
| Funções / Functions | 75,00% |
| Linhas / Lines | 90,08% |

As capturas evidenciam a execução local dos testes unitários/HTTP, com valores consistentes com o documento técnico. Não devem ser identificadas como testes executados diretamente contra o RDS. A tabela mostra cobertura parcial em alguns componentes, incluindo inicialização e bootstrap; isso é oportunidade de ampliar os testes.

Cópias preservadas para o espaço 09: `prints_checkpoint3/09a_testes_cobertura.png` e `prints_checkpoint3/09b_testes_cobertura.png`. Utilizar ambas no documento final para apresentar métricas e resumo da mesma execução.

**Situação após esta rodada:** evidências de saúde, cadastro, banco, persistência, e-mail/CPF duplicados, logs e testes disponíveis. Restam o recorte seguro do perfil autenticado para o PDF, a inserção das imagens no documento e o preenchimento dos dados acadêmicos da capa.

## Edição final com imagens e identificação acadêmica

O usuário forneceu a versão final do perfil em `Teste_Checkpoint-3_Imgs/06_perfil_autenticado_200.png`, com o conteúdo de Curl coberto de forma suficiente. A imagem foi conferida visualmente e preservada em `prints_checkpoint3/07_perfil_autenticado_200.png`.

A edição final do documento incorpora dez capturas reais na seção 14, substituindo o passo a passo e os quadros vazios. Inclui nomes dos cinco integrantes, matéria Projeto de Software 2, turma 11 e professor MARCUS ARTIAGA COLANTONI. Cada figura possui legenda, data 16/11/2026 e responsável Luiz Felipe Ferraressso, com a grafia expressamente fornecida pelo usuário. As datas UTC visíveis nos resultados são explicadas na abertura da seção de evidências.

As pendências de captura e identificação descritas nas rodadas anteriores foram concluídas nesta edição. Os originais enviados pelo usuário foram incorporados sem alteração dos pixels.
