# Implantação acadêmica na AWS — HospedJá / Checkpoint 3

**Situação:** roteiro reproduzível; não constitui prova de deploy executado ou URL pública existente. Nenhuma conta ou recurso AWS foi acessado por esta entrega.

**Revisão de 28/10/2026:** o patch enviado por um integrante relata uma implantação, mas não fornece acesso ou endereço para conferência. O código atual foi testado localmente em MySQL 8.4; o procedimento de atualização inclui preflight e rollback. Consulte [revisão do patch](../docs/REVISAO_PATCH_AWS_2026-10-28.md). Não marcar execução AWS como comprovada antes da validação remota.

## Arquitetura escolhida e justificativa

- **EC2 t3.micro** Ubuntu 24.04 (x86_64): instancia pequena, Docker com API Express e Nginx reverso; sem Elastic Beanstalk, balanceador de carga ou NAT Gateway para reduzir custos.
- **RDS MySQL 8.4** `db.t4g.micro` (se disponível na região/conta), Single-AZ e armazenamento gp3 inicial mínimo admitido pelo serviço; banco com endpoint **privado** e backups automáticos. Segundo o [calendário oficial RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/MySQL.Concepts.VersionMgmt.html), o suporte padrão da versão 8.0 terminou em 31/07/2026; avaliar Extended Support se mantiver um banco 8.0 existente.
- **VPC** padrão ou dedicada, EC2 em subnet pública, RDS **não publicamente acessível** em grupo de subnets privadas distribuídas entre ao menos duas AZ. Só SG-EC2 pode acessar SG-RDS TCP 3306.
- **SSM Parameter Store / SecureString** com instance profile IAM restrito para `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`. Arquivos locais `/etc/hospedja/api.env` ficam na EC2 com permissão `0600`, não são commitados. AWS recomenda Secrets Manager para rotação automática em produção; Parameter Store é escolha econômica de laboratório.
- **HTTPS** com Nginx e Certbot/Let's Encrypt, quando a equipe tiver domínio DNS. Sem domínio, um endereço `http://IP_PUBLICO/health` só serve para avaliação temporária e NÃO fornece TLS, portanto não deve receber logins ou credenciais.
- Região da simulação de custos: `us-east-1` (Norte da Virgínia). Para público no Brasil considere `sa-east-1` com preços geralmente diferentes; calcule antes de criar.

## 1. Antes de criar recursos

1. AWS Budgets → defina orçamento com alertas, ex.: USD 10 / USD 20; habilite Cost Explorer. Não suponha que exista Free Tier gratuito irrestrito.
2. Acesse o console AWS com MFA; não use root para operação diária.
3. Escolha uma única região e mantenha EC2/RDS na mesma VPC/região.
4. Registre nome do projeto, tags `Project=HospedJa`, `Environment=Checkpoint3`.
5. Use `npm ci` e o lockfile atual, que inclui Zod 4.6.7. Publique e revise o conjunto das correções antes de atualizar o checkout da EC2; não substituir pelo lockfile antigo do patch recebido.

## 2. Rede e RDS

1. Crie `hospedja-ec2`: entrada TCP 80/443 do público; SSH 22 **apenas do IP da equipe** (preferível Session Manager com IAM), nunca 3000. Saída para atualizações, repositório npm e RDS.
2. Crie `hospedja-rds`: **entrada TCP 3306 apenas da SG EC2**; sem entrada global 0.0.0.0/0. Os nomes não podem começar com `sg-`, conforme [API EC2](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateSecurityGroup.html).
3. Em RDS → Create database → MySQL 8.4 → Standard creation → Single-AZ, classe micro e tamanho de disco mínimo suportado. Desative **Public access**; selecione VPC, subnets privadas e `hospedja-rds`. Habilite backups para prova de conceito. A opção de [senha master gerenciada pelo Secrets Manager](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html) é compatível com essa arquitetura; mantenha o usuário master separado do usuário de aplicação. Se o ambiente do colega já existe, primeiro inspecioná-lo, sem criar recursos duplicados.
4. Crie usuário **separado de aplicação** no MySQL (não use usuário master na API) e dê apenas direitos adequados de DML às tabelas. Admin master é usado **somente** na configuração inicial.
5. Importe `database/01_schema.sql` usando cliente MySQL no EC2 (ou túnel SSM); depois `aws/02_status_basicos.sql`. **Não** execute `database/02_seed.sql` no RDS: ele contém usuários fictícios com senhas conhecidas.
   Para atualizar um banco antigo, aplique a migração idempotente `npm run db:migrate` com um usuário de migração autorizado a `ALTER`, antes de trocar a API. Ela adiciona `tb_usuario.token_version`, necessária à revogação de sessões. Não conceda `ALTER` ao usuário DML da aplicação apenas para realizar o deploy. O preflight interrompe o deploy se faltar a coluna.
6. Verifique: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='hospedja';` e códigos de status PENDENTE nas tabelas respectivas.
7. **Primeiro ADMIN sem seed insegura:** depois de iniciar a API, execute `sudo docker exec -it hospedja-api node src/cli/bootstrap-admin.js`. O comando pergunta email, nome e senha sem eco e persiste bcrypt. Exige acesso SSH/SSM ao servidor; **não expõe rota de bootstrap**. Use conta administrativa apenas para demonstração e guarde credenciais fora do repositório.

Exemplo de importação com mysql-client instalado na EC2 (senha solicitada no terminal e NÃO passada por argumento visível no histórico):

```bash
mysql --ssl-mode=VERIFY_IDENTITY --ssl-ca=/etc/hospedja/certs/global-bundle.pem \
  --host='SEU_RDS_ENDPOINT' --user='USUARIO_MIGRACAO' --password \
  < database/01_schema.sql
mysql --ssl-mode=VERIFY_IDENTITY --ssl-ca=/etc/hospedja/certs/global-bundle.pem \
  --host='SEU_RDS_ENDPOINT' --user='USUARIO_MIGRACAO' --password \
  < aws/02_status_basicos.sql
```

Use DNS privado do endpoint RDS sem IP fixo. Na versão entregue, a API aceita certificado de CA via `DB_SSL_CA_PATH` e `rejectUnauthorized=true`. A política de verificação do hostname/TLS deve ser conferida na configuração MySQL2 usada na versão final.

## 3. EC2 e permissões

1. Inicie Ubuntu 24.04 na EC2 micro; marque Security Group e IAM Role com permissão mínima SSM. Evite IP elástico ocioso.
2. Instale Git, Docker Engine + plugin Compose, AWS CLI v2, Nginx, Certbot/`python3-certbot-nginx`, MySQL client. Consulte instruções oficiais vigentes do sistema operacional e do Docker antes da instalação.
3. Clonar código do repositório PRIVADO da equipe. **Nunca copie arquivo `.env` local, seed fictícia, tokens, senhas ou arquivos de cobertura para repositório público.**
   Se arquivos do clone tiverem modo restrito, não aplicar `chmod -R a+rX` no repositório todo: esse comando também pode expor arquivos privados. O Dockerfile atribui os arquivos da aplicação ao usuário `node` dentro da imagem e define leitura do manifesto de pacotes, sem alterar os segredos do host.
4. No Systems Manager → Parameter Store (região correta), crie: `/hospedja/prod/DB_HOST` (RDS endpoint), `/hospedja/prod/DB_USER`, `/hospedja/prod/DB_PASSWORD`, `/hospedja/prod/JWT_SECRET`. Use `SecureString` em secrets; para JWT: gere 32+ bytes aleatórios por `openssl rand -hex 32` e cole de maneira segura no console, sem commit.
5. Anexe à **IAM Role da EC2** uma política `ssm:GetParameter` apenas para o prefixo `/hospedja/prod/*` e `kms:Decrypt` se necessário para a chave KMS escolhida. O arquivo `aws/IAM-LEAST-PRIVILEGE.example.json` contém ARN **fictício**: substitua conta e região e restrinja ao mínimo.

## 4. Deploy e validação local na EC2

```bash
# dentro da raiz do repositorio clonado na EC2, com role IAM e AWS CLI v2:
sudo env AWS_REGION=us-east-1 CORS_ORIGINS='https://SEU_FRONTEND_DOMINIO' bash aws/deploy-ec2.sh
sudo docker logs --tail 80 hospedja-api
curl -i http://127.0.0.1:3000/health
```

O script carrega segredos do SSM e inicia Docker em `127.0.0.1:3000`: a porta da API não deve estar aberta ao mundo. Quando falhar o `health`, confira credenciais, firewall SG, valores SSM, status RDS, certificados CA e tabelas.

O procedimento exige checkout limpo e cria imagem identificada pelo commit. Antes de parar a API existente, verifica banco/migração e inicializa um candidato sem porta pública. Falhas na promoção ou no health da nova API restauram o contêiner anterior. O contêiner anterior saudável fica preservado e parado após sucesso; existe uma breve interrupção durante a troca. Isso não substitui snapshot do RDS nem representa validação pública de HTTPS.

Validação sem AWS: `npm run test:deploy` executa sete cenários com comandos simulados em contêiner isolado; `docker compose -f compose.aws-validation.yaml run --build --rm tests` executa a suíte em MySQL 8.4 sem publicar portas. Ao terminar, use `docker compose -f compose.aws-validation.yaml stop db` para parar somente esse banco de validação.

## 5. Nginx / domínio / HTTPS

1. Registre ou use um domínio sob controle da equipe, crie registro DNS A para IP público da EC2 (IP pode mudar se instância for reiniciada sem IP elástico).
2. Substitua `api.example.com` por seu domínio em `aws/nginx-hospedja.conf` e copie para `/etc/nginx/sites-available/hospedja`, ative em `sites-enabled` e rode `sudo nginx -t && sudo systemctl reload nginx`.
3. Abra 80/443 no SG da EC2; emita certificado com `sudo certbot --nginx -d api.SEU_DOMINIO` e confira renovação. Se o domínio não for seu, não solicite certificado.
4. `curl -i https://api.SEU_DOMINIO/health` deve retornar HTTP 200 e JSON `status: ok`.
5. `https://api.SEU_DOMINIO/api-docs/` mostra Swagger; `https://api.SEU_DOMINIO/openapi.json` fornece a especificação.
6. Ajuste `CORS_ORIGINS` para **origem do frontend**, não para o backend; se não existir frontend público, mantenha origem restrita e não use `*`.

## 6. Checklist com prova para o professor

- [ ] Captura do health HTTP 200 via URL **pública**/HTTPS (sem expor segredo)
- [ ] Print do Swagger via URL pública
- [ ] Print do RDS `Available` e conexão do banco, ocultando endpoints e dados sensíveis conforme necessário
- [ ] `npm run test:coverage` com resultados reais anexados
- [ ] `SELECT ... FROM tb_log ORDER BY id_log DESC` após login de teste criado por cadastro público (sem usuários seed)
- [ ] RDS sem `Public access`; SG MySQL restrita exclusivamente à EC2
- [ ] Certificado HTTPS válido e porta 3000 fechada no SG
- [ ] `DB_PASSWORD`/`JWT_SECRET` apenas no SSM e no arquivo protegido da EC2, nunca no Git
- [ ] Sem contas fictícias da `02_seed.sql` em RDS
- [ ] AWS Budgets configurado; anotação dos gastos reais no PDF
- [ ] Backup/snapshot do banco e procedimento para desligar recursos após apresentação

## 7. Estimativa de custo (referencial, NÃO cotação)

Região de referência `us-east-1`, um ambiente ligado ~730 horas/mês, On-Demand sem desconto e antes de créditos:

| Recurso | Estimativa orientativa / mês |
|---|---:|
| EC2 t3.micro, ~730 h × US$ 0,0104/h | US$ 7,59 |
| IPv4 público da EC2, ~730 h × US$ 0,005/h | US$ 3,65 |
| EBS gp3 para EC2, ~20 GiB | US$ 1,60 a 2,50 |
| RDS MySQL Single-AZ micro + armazenamento + backups adicionais | **US$ 15 a 35+** |
| Total aproximado | **US$ 28 a 49+**, fora tráfego, impostos, suporte e extras |

Não é garantia de preço: classe, região, uso de CPU, storage, snapshots, tráfego, backups, IPv4, créditos e período real mudam o custo. Use a [AWS Pricing Calculator](https://calculator.aws/) antes de provisionar. Evite NAT Gateway, ALB, Multi-AZ e Elastic Beanstalk nesta demonstração econômica (seriam custos/complexidade extras). Se precisar de alta disponibilidade, a arquitetura e o custo mudam.

**Free Tier atualizado:** para contas novas elegíveis criadas após 15/07/2025, a AWS passou a fornecer US$ 100 em créditos iniciais e possibilidade de até mais US$ 100, plano gratuito por até 6 meses ou até os créditos acabarem. Não assuma elegibilidade para conta antiga; confira o console e as regras específicas do plano antes de consumir.

**Fontes oficiais consultadas em 24/10/2026:**
- https://aws.amazon.com/pt/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/
- https://docs.aws.amazon.com/pt_br/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html
- https://aws.amazon.com/ec2/instance-types/t3/
- https://aws.amazon.com/pt/vpc/pricing/
- https://aws.amazon.com/rds/mysql/pricing/
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/tutorial-connect-ec2-instance-to-rds-database.html
- https://docs.aws.amazon.com/pt_br/systems-manager/latest/userguide/systems-manager-parameter-store.html

## 8. Desligamento para evitar cobranças

1. Gere snapshot final se necessário, exporte comprovações e faça backup privado.
2. Apague RDS (decida sobre snapshot final), EC2, volumes EBS ociosos, IPv4 elásticos não usados, snapshots desnecessários e outros recursos. Excluir apenas a EC2 **não** exclui RDS/armazenamento.
3. Verifique AWS Billing e Budgets no dia seguinte para identificar cobranças remanescentes.
