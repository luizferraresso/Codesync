#!/usr/bin/env bash
set -Eeuo pipefail
# Roda em container efemero, sem credenciais, AWS real ou socket Docker montado.
bash -n /source/deploy-ec2.sh
STUBS="$(mktemp -d)"
export PATH="$STUBS:$PATH"
cat > "$STUBS/aws" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' 'ficticio_apenas_teste_sem_credenciais_reais_32_chars'
STUB
cat > "$STUBS/git" <<'STUB'
#!/usr/bin/env bash
if [[ $1 == status ]]; then
  if [[ $CASE == dirty ]]; then echo ' M arquivo.js'; fi
else echo 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; fi
STUB
cat > "$STUBS/curl" <<'STUB'
#!/usr/bin/env bash
while (( $# )); do
  if [[ $1 == -o ]]; then printf '%s\n' 'CA FICTICIA' > "$2"; exit 0; fi
  shift
done
exit 1
STUB
cat > "$STUBS/sleep" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
cat > "$STUBS/flock" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
cat > "$STUBS/docker" <<'STUB'
#!/usr/bin/env bash
set -eu
printf '%s\n' "$*" >> "$STATE/commands"
case $1 in
  build) [[ $CASE != build ]] ;;
  run)
    if [[ $* == *preflight-deploy.js* ]]; then [[ $CASE != preflight ]]; exit $?; fi
    shift
    while (( $# )); do
      if [[ $1 == --name ]]; then
        name=$2
        if [[ $name == hospedja-api && $CASE == promotion ]]; then exit 1; fi
        echo new > "$STATE/$name"; exit 0
      fi
      shift
    done
    exit 1 ;;
  container) [[ -f "$STATE/$3" ]] ;;
  inspect) echo true ;;
  exec)
    if [[ $CASE == candidate && $2 == hospedja-check-* ]]; then exit 1; fi
    if [[ $CASE == unhealthy && $2 == hospedja-api ]]; then exit 1; fi
    exit 0 ;;
  stop) touch "$STATE/stopped" ;;
  rename) mv "$STATE/$2" "$STATE/$3" ;;
  start) touch "$STATE/restored" ;;
  rm) target="${!#}"; rm -f "$STATE/$target" ;;
  logs) echo 'Log ficticio do cenario de teste' ;;
  *) exit 1 ;;
esac
STUB
chmod 0755 "$STUBS"/*
for CASE in dirty build preflight candidate promotion unhealthy success; do
  export CASE
  STATE="$(mktemp -d)"; export STATE
  echo old > "$STATE/hospedja-api"
  status=0
  bash /source/deploy-ec2.sh > "$STATE/output" 2>&1 || status=$?
  if [[ $CASE == success ]]; then
    [[ $status == 0 && $(cat "$STATE/hospedja-api") == new ]]
    compgen -G "$STATE/hospedja-api-previous-*" >/dev/null
  else
    [[ $status != 0 && $(cat "$STATE/hospedja-api") == old ]]
    if [[ $CASE == promotion || $CASE == unhealthy ]]; then
      [[ -f "$STATE/restored" ]]
    else
      [[ ! -f "$STATE/stopped" ]]
    fi
  fi
  printf 'OK deploy: %s\n' "$CASE"
done
[[ $(stat -c '%a' /etc/hospedja/api.env) == 600 ]]
echo 'OK: 7 cenarios, rollback e permissoes; nenhuma chamada AWS real.'
