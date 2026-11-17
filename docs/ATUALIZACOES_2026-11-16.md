# CPF/CNPJ, motivo dos logs e hospedagem — 16/11/2026

## Escopo e situação

O projeto continua sendo uma API Express com MySQL. O frontend será desenvolvido em outra etapa. O login permanece por e-mail e senha.

A implantação existente em EC2 + RDS respondeu **HTTP 200** em `https://44.201.28.10/health` nesta revisão, com verificação de certificado habilitada. Esse endpoint executa `SELECT 1` no banco, portanto a conferência também verificou conectividade com o MySQL remoto. Isso confirma a disponibilidade da versão que já estava hospedada, não a publicação destas alterações.

As alterações abaixo foram implementadas, testadas e **implantadas na EC2 e no RDS em 16/11/2026**. A sessão AWS foi renovada pelo operador, a migração foi aplicada e o contrato atualizado foi conferido no Swagger público. Não foi executado seed nem suíte de integração contra o RDS; a validação remota usou verificações pontuais, com dados temporários removidos ou revertidos ao final.

| Item | Resultado |
|---|---|
| Saúde da API + conexão com o banco | [HTTPS /health](https://44.201.28.10/health), HTTP 200 |
| Documentação publicada | [Swagger](https://44.201.28.10/api-docs/), HTTP 200; [OpenAPI](https://44.201.28.10/openapi.json) exige CPF no cadastro e mantém login por e-mail |
| Banco | RDS MySQL 8.4.11 privado, CPF NOT NULL/UNIQUE, CHECKs CPF/CNPJ ativos e coluna motivo |
| API | Contêiner healthy, usuário node e zero reinícios na conferência final |
| Migração | Três etapas de 002_documentos_e_motivo_log aplicadas; preflight aprovado |
| Verificações operacionais | 22 aprovadas na aplicação implantada e no RDS |
| Recuperação | Snapshot hospedja-pre-documentos-20261116 confirmado available antes de qualquer exclusão ou alteração de schema |

## Preservação e release

A única conta sem CPF era `Teste Deploy AWS`, perfil CLIENTE, sem reservas ou vínculos de negócio. **Sua exclusão foi expressamente autorizada pelo operador** após identificação e criação do snapshot. A exclusão foi condicional ao ID/e-mail/perfil esperados e à ausência de vínculos de negócio. Seus dois logs foram preservados, com a FK de usuário ajustada para NULL.

O pacote de código foi transferido sem `.env` ou credenciais, validado por SHA-256 e preparado em um diretório novo. O checkout anterior do servidor e as alterações locais preexistentes não foram substituídos.

- Release: `/opt/hospedja-releases/documentos-ceea52080b55a7bc`.
- SHA-256 do pacote: `ceea52080b55a7bc28b76cb2c7aee0106bba02f6a1fb9762e337c121c3a1e304`.
- Revisão da imagem: `5fa7f2ebc6aa18ac695539feb12045a8956730b5`. Esse commit identifica o snapshot de código na release da EC2; não representa push ou merge no GitHub.
- Contêiner anterior preservado e parado: `hospedja-api-previous-20261116201840-1529178`.
- A API antiga foi suspensa durante a migração para impedir cadastros sem CPF nesse intervalo.
- O segredo administrativo foi usado somente em memória pelo processo de migração. A autorização IAM temporária foi restrita ao segredo deste RDS, teve expiração e foi removida após sucesso. A role da EC2 voltou à política inline preexistente `hospedja-secrets-read`.

O smoke test criou uma conta CLIENTE temporária com credenciais aleatórias apenas em memória, conferiu cadastro/login e logs e removeu essa conta ao terminar. As operações SQL de CNPJ foram executadas em transação revertida. Os logs dessas verificações foram preservados sem CPF, e-mail ou senha.

## Documentos

- `tb_usuario.cpf` passa a ser `CHAR(11) NOT NULL`, mantendo o índice `UNIQUE` e acrescentando `CHECK` dos dois dígitos verificadores. Inserções e alterações diretas por SQL também ficam protegidas.
- Cadastro público, criação de equipe e bootstrap de administrador exigem CPF válido. A API aceita CPF sem máscara ou com a máscara completa, preserva zeros iniciais e armazena somente os 11 dígitos. Sequências repetidas e caracteres indevidos são recusados.
- A API consulta duplicidade por CPF e retorna `409 CPF_CADASTRADO`. O índice do banco também protege contra cadastros concorrentes.
- O CPF permanece fora das respostas públicas de usuário.
- O CNPJ pertence a `tb_admin_hotel`. `POST /api/v1/hoteis/{id}/gestores`, exclusivo de ADMIN, recebe o campo opcional `cnpj`, valida e grava o documento no vínculo. Omitir preserva o CNPJ já gravado; `null` o remove. Seu preenchimento não se tornou obrigatório.
- CNPJ numérico e alfanumérico passam pelas regras de formato e dos dois dígitos verificadores, na API e no banco. Máscara completa e letras minúsculas são normalizadas na API. O banco armazena sem máscara, com letras maiúsculas.

O cálculo do CNPJ alfanumérico usa módulo 11 e o valor ASCII de cada caractere menos 48, conforme o [manual técnico da Receita Federal](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf). A validação matemática não consulta existência, titularidade ou situação cadastral na Receita.

Exemplo de cadastro, com documento de teste:

```json
{"nome":"Pessoa de teste","email":"pessoa@example.test","cpf":"390.533.447-05","senha":"SenhaTeste#2026"}
```

## Motivo da auditoria

Nova coluna: `tb_log.motivo VARCHAR(500) NOT NULL`. Os registros antigos recebem o valor neutro `Evento sem motivo informado`, sem inventar causas históricas.

As requisições novas registram causas controladas pelo servidor, por exemplo:

| Situação | Motivo |
|---|---|
| CPF recusado no cadastro | `Falha no cadastro: CPF invalido ou ausente` |
| CPF já usado | `Falha no cadastro: CPF ja cadastrado` |
| Senha incorreta | `Falha no login: Senha incorreta` |
| Usuário inexistente | `Falha no login: Usuario nao encontrado` |
| Conta indisponível | `Falha no login: Conta indisponivel` |
| CNPJ recusado no vínculo | `Falha no vinculo de gestor: CNPJ invalido` |
| Login válido | `Sucesso no login` |

A resposta pública para falhas de credenciais continua genérica. O motivo interno distingue a causa sem copiar CPF, CNPJ, e-mail, senha, token ou mensagem arbitrária de exceção. O middleware de auditoria passa a acompanhar também JSON inválido e corpos excessivos, antes da leitura do corpo. A gravação continua best-effort, conforme o comportamento existente.

## Bancos existentes e implantação

1. Renovar o acesso AWS e inspecionar a EC2/RDS existentes, sem criar outra infraestrutura. O acesso administrativo deve continuar por SSM e o MySQL deve continuar privado.
2. Conferir contas existentes sem CPF ou com CPF/CNPJ inválido. Corrigir com documentos reais pelo canal administrativo do banco; não atribuir valores fictícios a usuários reais.
3. Preparar a versão e confirmar um snapshot de recuperação do RDS antes de qualquer alteração de schema.
4. Em uma janela de atualização, suspender temporariamente cadastros e alterações de vínculos enquanto a versão antiga ainda não exige CPF. Usar credenciais de migração, sem conceder DDL permanentemente ao usuário da aplicação.
5. Executar `npm run db:migrate` com as variáveis do banco de destino. O comando aplica `001_token_version`, quando necessário, e as etapas pendentes de `002_documentos_e_motivo_log`.
6. Se aparecer `DOCUMENTOS_PENDENTES`, corrigir os documentos apontados pelas contagens e repetir o comando. A etapa 002 não altera as tabelas enquanto houver documentos inválidos. O comando não imprime documentos nem corrige registros automaticamente.
7. A migração usa lock de execução e reconhece as etapas já aplicadas, permitindo retomada após interrupção de DDL. Como MySQL faz commit implícito em `ALTER TABLE`, não há promessa de rollback transacional de toda a migração.
8. Executar o deploy da nova imagem. O preflight exige CPF `NOT NULL` e `UNIQUE`, os dois novos `CHECK` ativos e a coluna `motivo`, antes de promover o contêiner. A imagem inclui os arquivos necessários à migração.
9. Conferir HTTPS `/health`, `/api-docs/`, cadastro validado, login por e-mail e persistência de `tb_log.motivo`. Não executar as suítes de integração contra o RDS.

Para banco novo, `database/01_schema.sql` já inclui as restrições. O seed de desenvolvimento foi ajustado com CPFs de teste distintos e matematicamente válidos; continua exclusivo de ambiente local/homologação. Reexecutar `CREATE TABLE IF NOT EXISTS` não migra tabelas existentes.

## Verificações realizadas

- `npm test -- --coverage`: **195 testes unitários/HTTP**, 15 suítes, aprovados; cobertura de linhas de **90,08%**.
- `npm run check` e `npm run integrity`: sintaxe, imports, tabelas e YAML sem problemas.
- Integração em instância MySQL **9.6.0** local e isolada: **16 testes**, 3 suítes, aprovados. A instância temporária foi encerrada ao final; o serviço MySQL preexistente não foi alterado.
- Schema e seed completos executados em banco isolado.
- Banco com schema anterior: migração bloqueou CPF ausente e CNPJ inválido; após correção de dados de teste, retomou uma execução interrompida e preservou usuário, hash, vínculo e log antigo. Nova execução não repetiu as alterações.
- A CI existente permanece configurada para MySQL 8.0; ela não foi executada nesta revisão.
- No RDS MySQL 8.4.11 foram aprovadas **22 verificações operacionais**: metadados NOT NULL/UNIQUE/CHECK, exclusão autorizada da conta antiga, CPF obrigatório, rejeição de repetição e dígito incorreto, cadastro com máscara, normalização, CPF duplicado, login por e-mail, falhas genéricas ao público, rejeições por SQL direto, CNPJ alfanumérico, motivos persistidos sem documentos/credenciais e TLS ativo na conexão do banco.
- HTTPS público `/health`, `/api-docs/` e `/openapi.json` conferidos após a promoção. O contêiner terminou healthy, com zero reinícios.

O histórico da hospedagem anterior está em [DEPLOY_AWS_2026-10-29.md](DEPLOY_AWS_2026-10-29.md).
