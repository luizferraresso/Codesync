'use strict';
const pool=require('../src/config/database');
const env=require('../src/config/env');
(async()=>{
  if(env.NODE_ENV==='production' && !env.DB_SSL_CA_PATH)
    throw new Error('RDS exige DB_SSL_CA_PATH para validar o certificado TLS');
  await pool.query('SELECT 1');
  const [columns]=await pool.execute(`SELECT 1 FROM information_schema.columns
    WHERE table_schema=DATABASE() AND table_name='tb_usuario' AND column_name='token_version'`);
  if(!columns.length) throw new Error('MIGRACAO_PENDENTE: aplique 001_token_version com o usuario de migracao antes do deploy');
  for(const table of ['tb_status_reserva','tb_status_pagamento']) {
    const [rows]=await pool.query(`SELECT 1 FROM ${table} WHERE codigo='PENDENTE' LIMIT 1`);
    if(!rows.length) throw new Error('STATUS_PENDENTE_AUSENTE: confira aws/02_status_basicos.sql');
  }
  console.log('Preflight OK: conexao TLS/configuracao, coluna de sessao e status basicos.');
})().catch(err=>{console.error('Preflight falhou:',err.code||err.message);process.exitCode=1;})
  .finally(()=>pool.end());
