#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
# Execute na EC2 com IAM role e checkout limpo de um commit revisado:
# sudo env AWS_REGION=us-east-1 CORS_ORIGINS=https://SEU_FRONTEND bash aws/deploy-ec2.sh
AWS_REGION="${AWS_REGION:-us-east-1}"
CORS_ORIGINS="${CORS_ORIGINS:-https://app.example.com}"
SCOPE="/hospedja/prod"
ENV_FILE="/etc/hospedja/api.env"
APP="hospedja-api"
if (( EUID != 0 )); then
  echo 'Execute com sudo na EC2; o acesso AWS deve vir da IAM role da instancia.' >&2; exit 2
fi
for binary in aws docker git curl flock; do
  command -v "$binary" >/dev/null || { echo "Instale $binary antes do deploy." >&2; exit 2; }
done
exec 9>/var/lock/hospedja-deploy.lock
flock -n 9 || { echo 'Outro deploy esta em andamento.' >&2; exit 2; }
if [[ -n "$(git status --porcelain --untracked-files=normal)" ]]; then
  echo 'Checkout possui alteracoes locais. Publique/revise o commit antes do deploy.' >&2; exit 2
fi
REVISION="$(git rev-parse --verify HEAD)"
IMAGE="hospedja:$REVISION"
STAMP="$(date +%Y%m%d%H%M%S)-$$"
CANDIDATE="hospedja-check-$STAMP"
PREVIOUS="hospedja-api-previous-$STAMP"
ENV_TMP="$(mktemp)"
PROMOTING=0
OLD_EXISTS=0
OLD_RUNNING=false
REPLACEMENT_ATTEMPTED=0
rollback() {
  echo 'Restaurando o container anterior, quando existente.' >&2
  if (( REPLACEMENT_ATTEMPTED )); then docker rm -f "$APP" >/dev/null 2>&1 || true; fi
  if docker container inspect "$PREVIOUS" >/dev/null 2>&1; then
    docker rename "$PREVIOUS" "$APP" || return 1
  fi
  if (( OLD_EXISTS )) && [[ "$OLD_RUNNING" == true ]]; then docker start "$APP" >/dev/null; fi
}
cleanup() {
  local result=$?
  trap - EXIT
  rm -f "$ENV_TMP"
  docker rm -f "$CANDIDATE" >/dev/null 2>&1 || true
  if (( PROMOTING )); then rollback || echo 'Rollback falhou; intervencao do operador necessaria.' >&2; fi
  exit "$result"
}
trap cleanup EXIT
wait_ready() {
  local name=$1
  for ((attempt=1;attempt<=20;attempt++)); do
    if docker exec "$name" node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}
install -d -m 0700 /etc/hospedja
install -d -m 0755 /etc/hospedja/certs
curl --fail --silent --show-error --location \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  -o /etc/hospedja/certs/global-bundle.pem
chmod 0644 /etc/hospedja/certs/global-bundle.pem
printf '%s\n' \
  'NODE_ENV=production' 'PORT=3000' 'DB_PORT=3306' 'DB_NAME=hospedja' \
  'DB_SSL_CA_PATH=/etc/hospedja/certs/global-bundle.pem' \
  'JWT_EXPIRES_IN=1h' 'BCRYPT_ROUNDS=12' 'TRUST_PROXY_HOPS=1' \
  "CORS_ORIGINS=$CORS_ORIGINS" 'LOG_LEVEL=info' > "$ENV_TMP"
for KEY in DB_HOST DB_USER DB_PASSWORD JWT_SECRET; do
  VALUE="$(aws ssm get-parameter --name "$SCOPE/$KEY" --with-decryption \
    --region "$AWS_REGION" --query 'Parameter.Value' --output text)"
  if [[ -z "$VALUE" || "$VALUE" == *$'\n'* || "$VALUE" == *$'\r'* ]]; then
    echo "Parametro SSM vazio ou com quebra de linha: $KEY" >&2; exit 1
  fi
  printf '%s=%s\n' "$KEY" "$VALUE" >> "$ENV_TMP"
  unset VALUE
done
install -m 0600 "$ENV_TMP" "$ENV_FILE.new"
mv -f "$ENV_FILE.new" "$ENV_FILE"
docker build --pull --label "org.opencontainers.image.revision=$REVISION" -t "$IMAGE" .
# Nao altera schema com o usuario DML da aplicacao; interrompe antes de parar a API se faltar migracao.
docker run --rm --env-file "$ENV_FILE" \
  -v /etc/hospedja/certs:/etc/hospedja/certs:ro "$IMAGE" node scripts/preflight-deploy.js
docker run --name "$CANDIDATE" -d --env-file "$ENV_FILE" \
  -v /etc/hospedja/certs:/etc/hospedja/certs:ro "$IMAGE" >/dev/null
if ! wait_ready "$CANDIDATE"; then
  docker logs --tail 60 "$CANDIDATE" >&2; echo 'Candidato falhou; API atual preservada.' >&2; exit 1
fi
docker rm -f "$CANDIDATE" >/dev/null
if docker container inspect "$APP" >/dev/null 2>&1; then
  OLD_EXISTS=1
  OLD_RUNNING="$(docker inspect --format '{{.State.Running}}' "$APP")"
fi
PROMOTING=1
if (( OLD_EXISTS )); then
  docker stop --time 20 "$APP" >/dev/null
  docker rename "$APP" "$PREVIOUS"
fi
REPLACEMENT_ATTEMPTED=1
docker run --name "$APP" -d --restart unless-stopped \
  --env-file "$ENV_FILE" -v /etc/hospedja/certs:/etc/hospedja/certs:ro \
  -p 127.0.0.1:3000:3000 "$IMAGE" >/dev/null
if ! wait_ready "$APP"; then
  docker logs --tail 60 "$APP" >&2; echo 'Nova API falhou; acionando rollback.' >&2; exit 1
fi
PROMOTING=0
echo "Deploy local da EC2 validado. Revisao: $REVISION"
if (( OLD_EXISTS )); then echo "Container anterior preservado e parado: $PREVIOUS"; fi
# DNS, Nginx/HTTPS e verificacao publica sao etapas separadas; nao abra a porta 3000 no SG.
