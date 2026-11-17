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
  const [cpfColumns]=await pool.query(`SELECT IS_NULLABLE FROM information_schema.columns
    WHERE table_schema=DATABASE() AND table_name='tb_usuario' AND column_name='cpf'`);
  const [logColumns]=await pool.query(`SELECT 1 FROM information_schema.columns
    WHERE table_schema=DATABASE() AND table_name='tb_log' AND column_name='motivo'`);
  const [checks]=await pool.query(`SELECT CONSTRAINT_NAME FROM information_schema.table_constraints
    WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_TYPE='CHECK'
      AND ENFORCED='YES' AND CONSTRAINT_NAME IN ('ck_usuario_cpf_dv','ck_admin_hotel_cnpj_dv')`);
  const [uniqueCpf]=await pool.query(`SELECT INDEX_NAME FROM information_schema.statistics
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_usuario' AND NON_UNIQUE=0
    GROUP BY INDEX_NAME HAVING COUNT(*)=1 AND MAX(COLUMN_NAME)='cpf'`);
  if(cpfColumns[0]?.IS_NULLABLE!=='NO' || !logColumns.length || checks.length!==2 || !uniqueCpf.length)
    throw new Error('MIGRACAO_PENDENTE: aplique 002_documentos_e_motivo_log antes do deploy');
  for(const table of ['tb_status_reserva','tb_status_pagamento']) {
    const [rows]=await pool.query(`SELECT 1 FROM ${table} WHERE codigo='PENDENTE' LIMIT 1`);
    if(!rows.length) throw new Error('STATUS_PENDENTE_AUSENTE: confira aws/02_status_basicos.sql');
  }
  console.log('Preflight OK: conexao TLS/configuracao, sessao, CPF/CNPJ, motivo dos logs e status basicos.');
})().catch(err=>{console.error('Preflight falhou:',err.code||err.message);process.exitCode=1;})
  .finally(()=>pool.end());
