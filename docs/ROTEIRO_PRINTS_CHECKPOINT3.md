# Roteiro de prints — Checkpoint 3

Atualização de 16/11/2026. Extraído do documento técnico consolidado.


O roteiro combina três provas: a aplicação responde pela internet; uma gravação feita pela API aparece no RDS; uma falha produz um log com motivo específico. O SELECT 1 de `/health` já verifica conexão com o MySQL, mas a comparação do cadastro com a consulta ao banco demonstra persistência de forma mais completa.

### 14.1. Preparação

1. Separe uma pasta chamada `prints_checkpoint3` e use os nomes sugeridos abaixo. Acesse a API pelo endereço HTTPS da AWS, não por localhost.
2. Use uma conta de demonstração nova e identificável, com e-mail como `evidencia.cp3.20261116@example.test`. Se esse e-mail já existir, altere o sufixo e mantenha o mesmo valor em todas as consultas do seu teste.
3. Para o teste acadêmico, pode utilizar o CPF de exemplo matematicamente válido `390.533.447-05`, desde que ainda não esteja cadastrado. Esse número é dado de demonstração, sem afirmação de titularidade. Use dados reais apenas em uma conta real autorizada.
4. Escolha uma senha exclusiva de demonstração com pelo menos 10 caracteres. Nos prints, mostre a resposta/resultado; recorte campos que exibam senha, token ou o cabeçalho Authorization. Não inclua .env, hashes ou valores do Parameter Store.
5. No Windows, use Win + Shift + S, selecione a região necessária e salve a imagem. Registre data, ambiente e uma legenda curta para cada captura.

### 14.2. Print 01 — API e conexão com o banco na nuvem

1. Abra `https://44.201.28.10/health` no navegador.
2. Confirme a resposta `{"status":"ok","service":"hospedja-api"}` e o endereço HTTPS visível.
3. Capture a tela. Nome: `01_api_health_nuvem.png`.
4. Legenda sugerida: “API hospedada na AWS; o endpoint executa SELECT 1 no RDS antes de retornar status ok”. Esse print não exige login.

Se preferir mostrar também o código HTTP, abra o PowerShell e execute o comando abaixo. Ele consulta somente a saúde pública:

```powershell
$r = Invoke-WebRequest -Uri 'https://44.201.28.10/health' -UseBasicParsing
$r.StatusCode
$r.Content
```

### 14.3. Print 02 — Cadastro gravado pela API

1. Abra o Swagger em `https://44.201.28.10/api-docs/`.
2. Expanda POST `/api/v1/auth/register` e clique em Try it out.
3. Informe nome de teste, seu e-mail de demonstração, o CPF válido e a senha escolhida. Exemplo de estrutura:

```json
{
  "nome": "Evidencia Checkpoint 3",
  "email": "evidencia.cp3.20261116@example.test",
  "cpf": "390.533.447-05",
  "senha": "SUBSTITUA_PELA_SUA_SENHA_DE_TESTE"
}
```

4. Execute uma vez. O resultado esperado é HTTP 201 com id_usuario, nome, e-mail e tipo_usuario CLIENTE.
5. Anote o ID retornado e capture apenas a área de resposta, sem expor a senha do corpo de envio. Nome: `02_cadastro_api_201.png`.

### 14.4. Acesso ao banco privado para os próximos prints

O RDS não é público. Para consultar os resultados sem abrir a porta 3306 na internet, use o console AWS: selecione a região **Norte da Virgínia / us-east-1**, abra EC2, selecione `hospedja-api`, clique em Conectar, escolha Session Manager e conecte.

Na sessão Linux, os comandos abaixo executam Node.js dentro do contêiner e usam a configuração já existente. Eles não exibem o arquivo de ambiente. O usuário que abre essa sessão precisa ter acesso administrativo autorizado à instância. Se já houver um cliente MySQL autorizado por túnel, as mesmas consultas SQL podem ser executadas nele.

### 14.5. Print 03 — Conexão MySQL/TLS e CPF obrigatório

Copie todo o bloco abaixo para a sessão do servidor e pressione Enter. Ele faz apenas consultas:

```bash
sudo docker exec -i hospedja-api node <<'JS'
const pool = require('./src/config/database');
(async () => {
  const c = await pool.getConnection();
  try {
    console.table((await c.query(
      'SELECT DATABASE() AS banco, VERSION() AS versao, 1 AS conexao_ok'
    ))[0]);
    console.table((await c.query(
      "SHOW SESSION STATUS WHERE Variable_name='Ssl_version'"
    ))[0]);
    console.table((await c.query(
      "SELECT COLUMN_NAME,IS_NULLABLE,DATA_TYPE FROM information_schema.columns " +
      "WHERE table_schema=DATABASE() AND table_name='tb_usuario' AND column_name='cpf'"
    ))[0]);
    console.table((await c.query(
      "SHOW INDEX FROM tb_usuario WHERE Column_name='cpf'"
    ))[0].map(r => ({indice:r.Key_name,coluna:r.Column_name,nao_unico:r.Non_unique})));
  } finally { c.release(); }
})().catch(e => {console.error(e.code || 'FALHA_CONSULTA');process.exitCode=1;})
  .finally(() => pool.end());
JS
```

Resultados esperados: banco hospedja; MySQL 8.4.11 nesta implantação; conexao_ok 1; TLSv1.3; CPF com IS_NULLABLE NO; índice de CPF com nao_unico 0, indicando unicidade. Capture as tabelas. Nome: `03_banco_conexao_cpf.png`.

### 14.6. Print 04 — Registro da API encontrado no banco

Na mesma sessão, execute o bloco a seguir. Se mudou o e-mail no cadastro, substitua o e-mail somente na lista de parâmetros:

```bash
sudo docker exec -i hospedja-api node <<'JS'
const pool = require('./src/config/database');
pool.execute(
  'SELECT id_usuario,nome,email,tipo_usuario,status,data_cadastro ' +
  'FROM tb_usuario WHERE email=?',
  ['evidencia.cp3.20261116@example.test']
).then(([rows]) => console.table(rows))
 .catch(e => {console.error(e.code || 'FALHA_CONSULTA');process.exitCode=1;})
 .finally(() => pool.end());
JS
```

Compare o id_usuario/e-mail com a resposta HTTP 201 do Print 02. O mesmo ID demonstra que o cadastro HTTP foi persistido no banco usado pela aplicação. A consulta não seleciona senha_hash nem o CPF. Se a tabela vier vazia, confira se o cadastro retornou 201 e se o e-mail consultado é exatamente o mesmo. Capture o comando e a linha retornada. Nome: `04_persistencia_usuario_rds.png`.

### 14.7. Print 05 — Erros de CPF/e-mail repetidos

1. No Swagger, reenvie o cadastro com o mesmo e-mail e CPF do Print 02. Esperado: HTTP 409 e código EMAIL_CADASTRADO, porque a checagem de e-mail ocorre primeiro.
2. Troque apenas o e-mail por um endereço novo, mantendo o mesmo CPF. Esperado: HTTP 409 e código CPF_CADASTRADO. Como o cadastro falha, esse segundo e-mail não é inserido.
3. Para demonstrar CPF inválido, use e-mail de teste novo e CPF `111.111.111-11`. Esperado: HTTP 422 DADOS_INVALIDOS.
4. Capture os resultados, mantendo visíveis status/código/mensagem e ocultando a senha do corpo. Salve `05a_email_duplicado_409.png`, `05b_cpf_duplicado_409.png` e, se desejar, `05c_cpf_invalido_422.png`.
5. Cadastro e login compartilham 15 tentativas por IP em 15 minutos. Se aparecer 429, aguarde a janela para continuar; não altere a proteção apenas para produzir os prints.

### 14.8. Print 06 — Login e leitura autenticada

1. Execute POST `/api/v1/auth/login` com o e-mail do Print 02 e a senha correta. Espere HTTP 200.
2. Copie o token somente para o botão Authorize do Swagger e conclua a autorização Bearer. Na interface HTTP Bearer padrão, cole o token sem repetir a palavra Bearer.
3. Execute GET `/api/v1/usuarios/me`. Espere HTTP 200 com o mesmo usuário.
4. Capture apenas a resposta de `/usuarios/me`, sem token ou cabeçalho Authorization visível. Nome: `06_perfil_autenticado_200.png`.
5. Opcionalmente, faça um login com senha errada para gerar “Falha no login: Senha incorreta” no log. A resposta pública será 401 Credenciais invalidas.

### 14.9. Print 07 — Motivos específicos persistidos em tb_log

Após executar os testes, aguarde alguns segundos, pois a auditoria é assíncrona. Rode esta consulta somente de leitura na sessão do servidor:

```bash
sudo docker exec -i hospedja-api node <<'JS'
const pool = require('./src/config/database');
pool.query(
  'SELECT id_log,acao,resultado,motivo,data_hora ' +
  'FROM tb_log ORDER BY id_log DESC LIMIT 12'
).then(([rows]) => console.table(rows))
 .catch(e => {console.error(e.code || 'FALHA_CONSULTA');process.exitCode=1;})
 .finally(() => pool.end());
JS
```

Devem aparecer os eventos recentes de cadastro/login, inclusive “Falha no cadastro: Email ja cadastrado”, “Falha no cadastro: CPF ja cadastrado” e os testes que você realizou. A consulta não mostra IP, documento, senha nem token. Capture a tabela legível com as colunas motivo e data/hora. Nome: `07_logs_motivos.png`.

Se um evento não aparecer imediatamente, repita somente a consulta depois de alguns segundos. Eventos históricos com “Evento sem motivo informado” não são evidência de um erro novo: são registros anteriores à inclusão da coluna.

### 14.10. Print 08 — Resultado dos testes automatizados

Na raiz do repositório local, execute `npm run test:coverage`. Capture o resumo com suítes/testes aprovados e a linha total de cobertura. Esse print demonstra a suíte local e deve ser identificado como local, diferente das evidências de conexão com a nuvem. Nome: `08_testes_cobertura.png`.

Opcionalmente, capture EC2 em execução, RDS disponível/privado e snapshot available no console AWS, ocultando informações desnecessárias da conta. Não são necessários para provar persistência se os Prints 01 a 07 estiverem claros, mas complementam a demonstração da hospedagem.

### 14.11. Como inserir e finalizar a entrega

Abra a versão DOCX deste documento no Word. Na seção 15, substitua os quadros correspondentes pelos prints, mantendo legenda e identificação de ambiente. Use Inserir → Imagens, mantenha proporção e ajuste à largura da página. Os pares 02/04 e 05/07 devem permitir conferir respectivamente persistência e auditoria.

Preencha os integrantes, turma e professor; revise os recortes; salve o DOCX e exporte como PDF. Se o professor exigir continuidade no arquivo anterior do Checkpoint 3, acrescente este relatório como atualização/complemento e mantenha a seção de evidências no final do documento final. O PDF antigo de outubro não foi sobrescrito por esta geração.

Checklist antes do envio: prints reais inseridos; texto legível; respostas 200/201/409/422 identificadas conforme o cenário; mesmo usuário nos Prints 02 e 04; motivos recentes no Print 07; sem credenciais expostas; arquivo final aberto e conferido página a página. A conta de demonstração criada por você permanece no banco até uma limpeza autorizada; não execute exclusão de usuários reais para reproduzir a atividade.
