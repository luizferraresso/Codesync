'use strict';
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/database');
const documents = require('./lib/document-constraints');
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
    }
    // Verificar documentos antes do DDL da etapa 002. MySQL faz commit implicito no ALTER.
    // Somente contagens saem no terminal, nunca CPF/CNPJ de usuarios.
    const [[{ invalidCpf }]] = await tx.query(`SELECT COUNT(*) AS invalidCpf FROM tb_usuario
      WHERE cpf IS NULL OR NOT (${documents.cpf})`);
    const [[{ invalidCnpj }]] = await tx.query(`SELECT COUNT(*) AS invalidCnpj FROM tb_admin_hotel
      WHERE NOT (${documents.cnpj})`);
    const [duplicates] = await tx.query('SELECT 1 FROM tb_usuario WHERE cpf IS NOT NULL GROUP BY cpf HAVING COUNT(*) > 1 LIMIT 1');
    if (Number(invalidCpf) || Number(invalidCnpj) || duplicates.length) {
      throw new Error(`DOCUMENTOS_PENDENTES: ${invalidCpf} CPF(s) ausente(s)/invalido(s), ${invalidCnpj} CNPJ(s) invalido(s), duplicidade CPF: ${duplicates.length ? 'sim' : 'nao'}. Corrija os dados reais antes de repetir a migracao.`);
    }
    const [constraints] = await tx.query(`SELECT CONSTRAINT_NAME AS name FROM information_schema.table_constraints
      WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_TYPE='CHECK'`);
    const present = new Set(constraints.map(row => row.name));
    const [logColumns] = await tx.query(`SELECT 1 FROM information_schema.columns
      WHERE table_schema=DATABASE() AND table_name='tb_log' AND column_name='motivo'`);
    const statements = fs.readFileSync(path.join(__dirname, '../database/migrations/002_documentos_e_motivo_log.sql'), 'utf8')
      .split(/;\s*(?:\r?\n|$)/).filter(sql => sql.trim());
    const pending = [!present.has('ck_usuario_cpf_dv'), !present.has('ck_admin_hotel_cnpj_dv'), !logColumns.length];
    for (let i = 0; i < statements.length; i++) {
      if (pending[i]) {
        await tx.query(statements[i]);
        console.log(`Aplicada migracao 002_documentos_e_motivo_log, etapa ${i + 1}`);
      }
    }
    // O indice UNIQUE ja existe no schema original, mas conferir tambem bancos divergentes.
    const [uniqueCpf] = await tx.query(`SELECT INDEX_NAME FROM information_schema.statistics
      WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_usuario' AND NON_UNIQUE=0
      GROUP BY INDEX_NAME HAVING COUNT(*)=1 AND MAX(COLUMN_NAME)='cpf'`);
    if (!uniqueCpf.length) await tx.query('ALTER TABLE tb_usuario ADD CONSTRAINT uq_usuario_cpf UNIQUE (cpf)');
    const [cpfColumns] = await tx.query(`SELECT IS_NULLABLE FROM information_schema.columns
      WHERE table_schema=DATABASE() AND table_name='tb_usuario' AND column_name='cpf'`);
    if (cpfColumns[0]?.IS_NULLABLE !== 'NO') await tx.query('ALTER TABLE tb_usuario MODIFY cpf CHAR(11) NOT NULL');
    console.log('Banco atualizado: CPF obrigatorio/unico, digitos CPF/CNPJ e motivo do log.');
  } finally {
    await tx.query("SELECT RELEASE_LOCK('hospedja_migrations')");
    tx.release();
  }
})().catch(err => { console.error('Migracao falhou:',err.code || err.message); process.exitCode=1; })
  .finally(() => pool.end());
