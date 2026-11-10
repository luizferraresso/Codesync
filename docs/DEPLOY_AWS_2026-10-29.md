# Deploy AWS verificado — 29/10/2026

**Resultado:** backend atualizado na EC2 existente, conectado ao RDS privado e acessível por HTTPS. As verificações públicas foram executadas às **15h08 de 29/10/2026, horário de Brasília**. Este registro atualiza o estado operacional descrito na revisão de 28/10; não declara concluídas as funcionalidades futuras do produto.

| Acesso | URL |
|---|---|
| Saúde da API | https://44.201.28.10/health |
| Swagger | https://44.201.28.10/api-docs/ |
| OpenAPI | https://44.201.28.10/openapi.json |
| Prefixo REST | `https://44.201.28.10/api/v1` |

## Versão e infraestrutura

- Backend implantado: commit **`eb05c89eee83c8f5747b8533bdff9b2f31de9290`**, da branch `fix/seguranca-testes-docker-aws`. A [PR #3](https://github.com/luizferraresso/Codesync/pull/3) continua em rascunho para revisão independente; deploy não equivale a merge na main.
- Região: `us-east-1`. Foram reutilizados a EC2 `hospedja-api` e o RDS `hospedja-db`; não foi criado outro servidor nem outro banco.
- EC2 Ubuntu 24.04, Docker com Buildx instalado nesta operação, Nginx e acesso administrativo pelo Systems Manager.
- Contêiner `hospedja-api`: usuário `node`, revisão gravada no rótulo da imagem, estado `healthy`, zero reinícios na conferência final. Porta da aplicação somente em `127.0.0.1:3000`.
- RDS MySQL **8.4.11**, privado e criptografado; 40 tabelas e 68 chaves estrangeiras conferidas. Conexão real da aplicação em **TLSv1.3**, cifra `TLS_AES_256_GCM_SHA384`.
- Security Group público libera 80/443. Porta 3306 aceita exclusivamente a Security Group da EC2; portas 22/3000 não foram abertas publicamente.
- Segredos continuam no Parameter Store e em `/etc/hospedja/api.env`, com modo `0600`, proprietário `root:root`. Nenhuma senha ou token acompanha este relatório.

## Preservação e migração

1. Snapshot manual **`hospedja-predeploy-eb05c89-20261029`**, confirmado `available` antes da migração. Os backups automáticos existentes têm retenção de um dia.
2. Alteração local do colega em `/opt/hospedja/aws/deploy-ec2.sh` preservada. O código novo foi preparado em um worktree limpo: `/opt/hospedja-releases/eb05c89eee83c8f5747b8533bdff9b2f31de9290`.
3. Configuração anterior e diff preservados em `/var/backups/hospedja/deploy-eb05c89/`, diretório privado da EC2. Essa cópia inclui configuração sensível e não deve ser exportada ao Git.
4. Migração aditiva `001_token_version` aplicada ao RDS. O acesso ao segredo administrativo foi concedido temporariamente à role da EC2, restrito ao segredo desse banco e com expiração; a política foi removida ao terminar.
5. Usuário `hospedja_app` permanece com SELECT/INSERT/UPDATE/DELETE, sem ALTER. Preflight verificou conexão, coluna de sessão e status básicos antes da promoção.
6. Candidato validado antes de parar a API anterior. Contêiner anterior preservado, parado: `hospedja-api-previous-20261029180519-80479`.

Não foram executados seed de demonstração nem suítes de integração destrutivas contra o RDS. Tokens antigos sem a versão de sessão exigem novo login após essa atualização.

## HTTPS sem domínio

O certificado Let's Encrypt contém o IP `44.201.28.10` como SAN; a validação pública passou sem desabilitar a verificação TLS. Certbot **5.4.0** foi executado em contêiner, usando webroot e o perfil `shortlived`. Emissão de teste e emissão confiável foram realizadas separadamente.

- Certificado emitido nesta operação: validade até **05/11/2026 às 06h05, horário de Brasília**. A data muda após cada renovação.
- Nginx redireciona HTTP para HTTPS com 308; o caminho `/.well-known/acme-challenge/` permanece disponível para renovação.
- Timer `hospedja-cert-renew.timer`: habilitado e ativo, com verificações a cada seis horas e atraso aleatório de até dez minutos.
- Serviço `hospedja-cert-renew.service` executa `/usr/local/sbin/hospedja-renew-cert`, renova pelo Certbot e recarrega o Nginx após sucesso.
- `certbot renew --dry-run` passou; a execução normal do serviço terminou com `Result=success` e `ExecMainStatus=0`.

Comandos de acompanhamento na EC2:

```bash
systemctl list-timers hospedja-cert-renew.timer --no-pager
systemctl show hospedja-cert-renew.service --property=Result,ExecMainStatus
journalctl -u hospedja-cert-renew.service --since '7 days ago' --no-pager
openssl x509 -in /etc/letsencrypt/live/hospedja-ip/fullchain.pem -noout -dates -ext subjectAltName
curl --fail https://44.201.28.10/health
```

O IP público atual não foi convertido em Elastic IP nesta operação. Se mudar após parar/iniciar a EC2, será necessário ajustar o endereço, CORS, Nginx e emitir certificado para o novo IP. Para estabilidade de longo prazo, planejar domínio e endereço estável. Não assumir que um certificado IP dispensa a renovação frequente.

Referência oficial: [certificados IP e configuração de renovação no Certbot](https://letsencrypt.org/2026/03/11/shorter-certs-certbot/).

## Evidências de funcionamento

**19 verificações públicas aprovadas**, em chamadas reais HTTPS:

| Grupo | Evidência |
|---|---|
| Disponibilidade | Certificado válido, health 200, Swagger 200, OpenAPI 200 e redirecionamento HTTP 308 |
| Acesso | Rota privada sem token retorna 401; cliente recebe 403 em rota ADMIN |
| Cadastro/login | Usuário fictício persistido como CLIENTE; respostas sem hash/versão de sessão; login e perfil corretos |
| Revogação | Troca de senha 204; JWT e senha anteriores recusados; novo login e perfil funcionais |
| Validação | Paginação válida e limite respeitado; paginação inválida 422; senha acima de 72 bytes UTF-8 422; payload excessivo 413 |
| Auditoria/limpeza | Eventos CADASTRO, AUTENTICACAO e ALTERACAO_SENHA persistidos; detalhes limitados aos campos permitidos; usuário temporário removido automaticamente |

A limpeza integrou o bloco de finalização do smoke test e preservou quatro registros de auditoria. A FK `ON DELETE SET NULL` removeu o vínculo com o usuário fictício sem apagar os eventos. Senhas aleatórias e JWTs do teste ficaram apenas em memória.

As 19 verificações operacionais são distintas dos **142 testes unitários/HTTP e 7 de integração** da CI/local; não representam cobertura completa de todas as regras em produção. CI do commit implantado: [push](https://github.com/luizferraresso/Codesync/actions/runs/40807299504) e [PR](https://github.com/luizferraresso/Codesync/actions/runs/40807305675), ambos aprovados.

Os registros brutos da operação foram guardados fora do repositório na pasta local `operacao-aws-2026-10-29/`; ela contém também a sessão privada e não deve ser publicada. Este documento é o resumo sem credenciais para compartilhamento.

## Recuperação e limites

O snapshot foi criado e sua disponibilidade conferida; restauração completa não foi ensaiada. O contêiner anterior foi preservado, mas não houve falha real na promoção que exigisse exercitar o rollback remoto. As sete simulações anteriores continuam como evidência específica dos caminhos de falha.

Em uma recuperação autorizada, conferir primeiro o contêiner anterior e o backup privado, parar/renomear a versão nova sem descartá-la, recolocar o contêiner anterior como `hospedja-api` e validar o health. A coluna aditiva pode permanecer; não executar DROP nem restaurar o RDS automaticamente. Reverter para código antigo também reintroduz as limitações de segurança dessa versão.

Continuam pendentes revisão/merge da PR, funcionalidades do backlog, carga/resiliência, observabilidade e ensaio de restauração. O acesso compartilhado por imagens exige que os responsáveis troquem as senhas expostas; nenhuma senha de IAM/root foi alterada automaticamente nesta operação.

O PDF de 28/10 registra a revisão anterior ao acesso AWS. Para a entrega acadêmica, este relatório é o adendo operacional; o PDF não foi regenerado nesta operação de deploy.
