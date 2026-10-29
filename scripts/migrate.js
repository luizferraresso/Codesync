'use strict';
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/database');
(async () => {
  const tx = await pool.getConnection();
  try {
    const [[{locked}]] = await tx.query("SELECT GET_LOCK('hospedja_migrations',30) AS locked");
    if (Number(locked) !== 1) throw new Error('Outro processo esta executando migracoes');
    const [columns] = await tx.execute(`SELECT 1 FROM information_schema.columns
      WHERE table_schema=DATABASE() AND table_name='tb_usuario' AND column_name='token_version'`);
    if (!columns.length) {
      await tx.query(fs.readFileSync(path.join(__dirname,'../database/migrations/001_token_version.sql'),'utf8'));
      console.log('Aplicada migracao 001_token_version');
    } else console.log('Banco atualizado; nenhuma migracao pendente.');
  } finally {
    await tx.query("SELECT RELEASE_LOCK('hospedja_migrations')");
    tx.release();
  }
})().catch(err => { console.error('Migracao falhou:',err.code || err.message); process.exitCode=1; })
  .finally(() => pool.end());
