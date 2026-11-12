# Apresentação: REST Client + MySQL real

O ambiente configurado usa **http://localhost:3000**, conectado ao MySQL Docker **hospedja**, porta **3307** no computador. Os dados são reais e persistem no volume local. São distintos do RDS/AWS; esta demonstração não escreve na AWS.

## Preparar e apresentar

1. Abra Docker Desktop. No terminal do VS Code, na raiz do projeto, execute `npm run demo:up`. O comando usa `.env.docker`, preserva o banco, constrói a API e aplica a migração aditiva necessária antes de iniciar a aplicação.
2. Abra `meus-testes.http`. A extensão **REST Client (humao.rest-client)** já está instalada. Clique em **Send Request** acima de cada chamada, na ordem numerada. Se o link não aparecer, confirme a extensão habilitada e o modo de linguagem **HTTP** no canto inferior direito.
3. Abra `database/apresentacao.sql` ao lado para mostrar as consultas. Execute `npm run demo:sql` no terminal para obter tabelas com os dados atuais, antes e depois das chamadas HTTP.
4. Também há atalhos em **Terminal > Run Task > Apresentacao: ...** para subir, consultar e parar o ambiente.

**REST Client envia HTTP, não SQL.** A API grava no banco e o cliente MySQL no terminal executa as consultas. Não foi criado endpoint para executar SQL arbitrário.

| Passos HTTP | Resultado esperado | Evidência SQL |
|---|---|---|
| 1 | 200/status ok | Consulta 1: banco e versão |
| 2 e 3 | 201, depois 409 | Consulta 2: usuário único e bcrypt |
| 4 e 5 | 401, depois 200 | Consultas 7/8: autenticação auditada |
| 6 a 9 | 200, 401, 403, 422 | Usuário permanece CLIENTE |
| 10 e 11 | 201 e 200, mesmo ID | Consultas 3/4/5: reserva e histórico |
| 12 e 13 | 200 e 201 | Consulta 6: ocorrência ABERTA |
| 14 a 16 | 200, 200, 200 | Consulta 6: decisão IMPROCEDENTE e analista |

Execute primeiro as chamadas nomeadas `login`, `reserva`, `guias`, `ocorrencia` e `admin` antes das chamadas que usam suas respostas. Token e IDs são reaproveitados automaticamente conforme a [documentação do REST Client](https://github.com/Huachao/vscode-restclient#request-variables). Evite projetar o token completo.

## Repetir a apresentação

Validação realizada em 10/11/2026: as 16 chamadas foram executadas contra a API local e todas retornaram os status previstos. As nove consultas SQL também executaram com sucesso no MySQL 8.0.46. A rodada `apresentacao-01` já contém usuário **9**, reserva **3** (PENDENTE) e ocorrência **2** (IMPROCEDENTE). Bcrypt com 60 caracteres, histórico da reserva e eventos de auditoria foram conferidos. O contador de senhas fictícias nos detalhes dos logs retornou zero. API e banco foram deixados ligados para uso.

No topo do HTTP, altere `@rodada = apresentacao-01` para `@rodada = apresentacao-02`. No SQL, altere o `SET @email` para `apresentacao-02@example.test`. Mantenha a rodada fixa durante toda a sequência. As datas da reserva são relativas a hoje (+30/+32 dias).

Se o primeiro cadastro retornar 409, aquela rodada já existe: use outra rodada para mostrar 201 ou prossiga ao login. Reexecutar os POSTs de reserva/ocorrência cria novos registros; eles não são idempotentes.

## Consultas SQL individuais

### Demonstrar INSERT, SELECT, UPDATE e DELETE ao vivo

Execute `npm run demo:mysql` no terminal integrado para abrir o prompt `mysql>` usando as credenciais locais, sem precisar exibir ou copiar a senha. O ambiente deve estar ligado (`npm run demo:up`).

Abra `database/demonstracao_crud.sql` e copie **um bloco por vez** para esse prompt. Não execute o arquivo inteiro: há uma pausa para reconectar e substituir o ID anotado.

1. **SELECT:** mostre o banco, a conexão e os hotéis existentes.
2. **INSERT + COMMIT:** crie o hotel fictício e anote o ID retornado. Consulte a linha criada.
3. **Reconexão:** digite `exit;`, execute novamente `npm run demo:mysql` e substitua o zero em `SET @demo_id = 0` pelo ID anotado. A variável desaparece com a sessão; o registro permanece no banco. O SELECT em uma nova conexão comprova a persistência após COMMIT.
4. **UPDATE + COMMIT:** altere o nome e a classificação do hotel; mostre o resultado.
5. **DELETE + ROLLBACK:** dentro da transação a contagem será zero; após desfazer, volta a um.
6. **DELETE + COMMIT:** confirme a remoção e mostre contagem zero. A condição usa o ID e o marcador exclusivo da demonstração.

Fala sugerida: “O INSERT gravou um registro. O COMMIT confirmou a transação. Fechei a conexão e consultei por outra sessão: o registro continua salvo. ROLLBACK desfaz uma alteração ainda não confirmada; DELETE seguido de COMMIT confirma a remoção.”

Validação em 11/11/2026: os blocos foram executados no MySQL local. O hotel de ensaio recebeu ID 3, foi encontrado após reconexão, atualizado para classificação 4, preservado após ROLLBACK e removido após DELETE + COMMIT. Na apresentação, anote o novo ID gerado; não reutilize o ID do ensaio. O banco foi deixado ligado.

Esse roteiro usa um hotel fictício sem quartos ou reservas. Não exclui os registros gerados pelo REST Client. SQL direto não passa pelas validações, RBAC ou middleware de auditoria da API; permissões, restrições e chaves estrangeiras do MySQL continuam valendo. Não é esperado um evento do middleware em `tb_log` para essas operações diretas. Não vincule reservas/quartos ao hotel durante essa demonstração.

O arquivo `SELECTs para o Banco.txt` contém o comando para abrir o MySQL interativo no terminal. Informe a `DB_PASSWORD` de `.env.docker` quando solicitado; ela não aparece durante a digitação. Cole primeiro o `SET @email` e depois cada SELECT completo, incluindo o ponto e vírgula.

Para outro cliente SQL: host `127.0.0.1`, porta `3307`, banco `hospedja`, usuário/senha de `.env.docker`. A porta 3306 é interna ao container; 3308 pertence ao banco isolado dos testes, não a esta demonstração.

## Como explicar os resultados

- A reserva é um **rascunho PENDENTE**, com total zero e sem itens, pagamento ou bloqueio de estoque. `LEFT JOIN` mantém visível a reserva sem itens. Não apresentá-la como reserva confirmada.
- O prefixo bcrypt e o tamanho do hash mostram o formato armazenado sem revelar o hash inteiro.
- Zero no contador de senhas verifica apenas as senhas fictícias e o campo `detalhes` indicados; não prova segurança total.
- Falhas anônimas de login podem ter `id_usuario` nulo; por isso há uma consulta de logs recentes além do filtro por usuário.
- A análise exige ADMIN e não aplica penalidade automaticamente. Não é necessário promover usuários manualmente via SQL para mostrar RBAC.
- Auditoria é assíncrona: se o evento ainda não apareceu, aguarde um instante e consulte novamente.

## Problemas comuns

- Conexão recusada: confira Docker Desktop e execute `npm run demo:up`.
- 401 em chamada protegida: execute novamente o login, depois a chamada dependente.
- Variável não resolvida: execute antes a chamada nomeada correspondente.
- 429: aguarde a janela do limite de autenticação (15 chamadas/15 minutos). Evite clicar repetidamente.
- Admin do seed não autentica ou lista de guias vazia: confira o ambiente existente. Não reaplique seed nem sobrescreva contas para corrigir isso. O bloco cadastro/reserva é independente.
- SQL sem linhas: confira o mesmo e-mail nos dois arquivos e execute primeiro os POSTs.

As senhas presentes no HTTP são fictícias, exclusivamente locais. Não executar seed nem este roteiro de escrita no RDS de produção.

Ao terminar, `npm run demo:stop` desliga os serviços e preserva os dados. Não use `down -v`.
