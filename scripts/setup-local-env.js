'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes}=require('node:crypto');
const file=path.join(__dirname,'../.env');
if(fs.existsSync(file)) {
  console.log('.env existente preservado.');
} else {
  const secret=()=>randomBytes(32).toString('hex');
  const text=`# Desenvolvimento local. Nao versionar.
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=hospedja
DB_USER=hospedja_app
DB_PASSWORD=${secret()}
MYSQL_ROOT_PASSWORD=${secret()}
JWT_SECRET=${secret()}
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=12
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
TRUST_PROXY_HOPS=0
LOG_LEVEL=info
TEST_MYSQL_ROOT_PASSWORD=${secret()}
TEST_DB_PASSWORD=${secret()}
`;
  fs.writeFileSync(file,text,{flag:'wx',mode:0o600});
  console.log('.env local criado com segredos aleatorios.');
}
