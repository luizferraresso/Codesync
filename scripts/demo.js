'use strict';
// Usa somente o Compose local e o arquivo de credenciais local ja existente.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const compose = ['compose', '--env-file', '.env.docker'];
function run(args, input) {
  const result = spawnSync('docker', [...compose, ...args], {
    cwd: root, encoding: 'utf8',
    stdio: input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit'], input
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}
if (!fs.existsSync(path.join(root, '.env.docker'))) {
  console.error('Falta .env.docker: copie .env.compose.example e configure as credenciais locais.');
  process.exit(1);
}
switch (process.argv[2]) {
  case 'up':
    run(['up', '-d', '--wait', 'db']);
    run(['build', 'api']);
    run(['run', '--rm', '--no-deps', 'api', 'node', 'scripts/migrate.js']);
    run(['up', '-d', '--wait', 'api']);
    console.log('API: http://localhost:3000 | MySQL: 127.0.0.1:3307 / hospedja');
    break;
  case 'sql':
    run(['exec', '-T', 'db', 'sh', '-c',
      'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --default-character-set=utf8mb4 --table -u "$MYSQL_USER" hospedja'],
      fs.readFileSync(path.join(root, 'database/apresentacao.sql'), 'utf8'));
    break;
  case 'mysql':
    run(['exec', 'db', 'sh', '-c',
      'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --default-character-set=utf8mb4 --table -u "$MYSQL_USER" hospedja']);
    break;
  case 'stop': run(['stop']); break;
  default: console.error('Uso: node scripts/demo.js up|sql|mysql|stop'); process.exitCode = 1;
}
