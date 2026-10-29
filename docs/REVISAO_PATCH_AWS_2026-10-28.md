# Revisão do patch AWS — 28/10/2026

**Conclusão:** o arquivo recebido contém orientações úteis, mas não deve ser aplicado diretamente ao código atual nem tratado como comprovação de implantação. Nenhum recurso AWS foi criado ou atualizado nesta revisão. O acesso ao ambiente do integrante ainda não está disponível.

## Arquivo e compatibilidade

Arquivo analisado: `deploy-aws-ec2-rds.patch`, 210934 bytes, commit declarado `bb82f6a94836a2246114b635363b8b84300b4c82`, autor declarado Enzo Boragina. Ele modifica apenas README, roteiro AWS, workflow e lockfile; não provisiona infraestrutura nem publica uma aplicação por si só.

`git apply --check` falhou: o workflow e o README já foram alterados localmente e `package-lock.json` já existe. O lockfile recebido fixa **Zod 3.25.76**, enquanto a revisão atual usa **4.6.7** para corrigir o alerta de segurança. Não substituir o lockfile atual nem reverter as correções anteriores.

A consulta ao remoto encontrou `main` em `eb6dcfa569fbb597ad70beb52c666ed4c1d71b55`, com dois commits posteriores à base local `5406fee`. Nessa consulta não havia branch `deploy/aws-ec2-rds` publicada nem o commit declarado pelo patch na cadeia consultada da main. As atualizações remotas incluem `meus-testes.http` e uma alteração no middleware de auditoria. Nenhum pull, merge, checkout, commit ou push foi realizado; as alterações locais foram preservadas. Antes de publicar, integrar os dois históricos mantendo as correções de ambos.

As instruções de encaminhar mensagens e executar comandos contidas no texto do colega foram consideradas contexto, e não autorização para enviar mensagens ou aplicar o patch cegamente.

## O que foi confirmado

- A [AWS informa o fim do suporte padrão do RDS MySQL 8.0 em 31/07/2026](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/MySQL.Concepts.VersionMgmt.html). MySQL 8.4 é uma escolha compatível para o roteiro, após conferir a versão disponível na conta e a situação do banco existente.
- A [API EC2 proíbe nomes de Security Group iniciados por `sg-`](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateSecurityGroup.html). IDs gerados com esse prefixo continuam sendo normais.
- O [RDS integra senha master com Secrets Manager](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html). Isso não elimina a necessidade de um usuário separado para a aplicação.
- Usar `npm ci` com o lockfile atual é apropriado e já fazia parte das correções locais.

## Problemas que exigiram adaptação

1. **Declaração de deploy executado:** o texto afirma validação pública via HTTP, mas não fornece URL ou identificação do ambiente. Esse fato permanece relatado pelo integrante, sem validação independente. Logins públicos precisam de HTTPS; a declaração em documentação não resolve isso.
2. **Permissões:** o `chmod -R a+rX` sugerido pode conceder leitura de arquivos privados. O Dockerfile agora atribui propriedade ao usuário `node` somente para os arquivos necessários dentro da imagem, e torna os manifestos de pacotes legíveis, preservando os segredos no host.
3. **Schema antigo:** o patch não contempla `token_version`. O código atual precisa dessa coluna; health com `SELECT 1` sozinho não comprova que a autenticação funcionará. Foi adicionado `scripts/preflight-deploy.js`, que confere configuração TLS, coluna e status básicos antes da troca da API.
4. **Atualização e rollback:** o script antigo removia a API antes de verificar a substituta. A versão adaptada valida um candidato, bloqueia deploys simultâneos, identifica a imagem pelo commit e restaura o contêiner anterior em falhas de promoção ou saúde. O teste de rollback usa simulação local; não houve exercício na EC2 real.
5. **Fonte publicada:** as correções atuais ainda estão no diretório de trabalho local. O procedimento exige checkout limpo de um commit revisado para evitar atribuir a um commit uma imagem construída com arquivos diferentes.

## Testes sem acesso AWS

- **142 testes unitários/HTTP aprovados** no Node.js 22, cobertura global de linhas de **90,07%**.
- **7 testes de integração aprovados com MySQL 8.4**, incluindo concorrência de pagamento/cancelamento, autorização e revogação de sessão. Schema e status básicos aplicados em volume próprio; nenhum seed de usuários nem banco remoto foi usado.
- **7 cenários simulados de deploy aprovados:** checkout sujo, falha de build, falha de preflight, candidato inválido, falha na criação final, nova API sem saúde e promoção bem-sucedida. Confirmada preservação da API antes da promoção e restauração após falhas na troca; arquivo de ambiente permanece com modo 0600 no contêiner de teste.
- Sintaxe e integridade/YAML passaram.

Comandos reproduzíveis:

```powershell
npm.cmd run test:deploy
docker compose -f compose.aws-validation.yaml run --build --rm tests
docker compose -f compose.aws-validation.yaml stop db
```

O teste do procedimento de deploy não recebe credenciais reais nem socket Docker; os comandos de AWS e de containers são simulados dentro de um contêiner descartável. O teste MySQL usa ambiente local separado, sem publicar portas e sem alterar o volume de desenvolvimento.

Log da compatibilidade MySQL: pasta irmã `../validacao-2026-10-28/aws-mysql84-testes.txt`.

## O que depende do acesso

Para executar a parte remota, faltam um acesso autenticado autorizado (perfil/SSO AWS ou SSH/SSM à EC2), identificação da conta/região/instância e a URL atual. Não enviar senha, token ou chave privada pelo chat; configurar o acesso localmente e informar somente o perfil ou o caminho local da chave.

Com esse acesso será necessário inspecionar os recursos já criados, revisão executada no servidor, rede/SG, TLS, parâmetros e schema do RDS; confirmar backup; aplicar a migração com credencial adequada; atualizar um commit revisado; validar saúde, Swagger, autenticação/auditoria e acesso HTTPS. Sem isso, não é possível afirmar que a aplicação pública esteja correta ou que o deploy tenha ocorrido.
