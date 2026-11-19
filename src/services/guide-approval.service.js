'use strict';

const pool = require('../config/database');
const { fail } = require('../utils/errors');

async function listPending(pagination = { limit: 100, offset: 0 }) {
  const [rows] = await pool.execute(
    `SELECT * FROM tb_guia
     WHERE status_aprovacao = 'PENDENTE'
     ORDER BY criado_em ASC, id_guia ASC
     LIMIT ? OFFSET ?`,
    [pagination.limit, pagination.offset]
  );

  return rows;
}

async function get(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM tb_guia WHERE id_guia = ? LIMIT 1',
    [id]
  );

  if (!rows.length) {
    fail(404, 'NAO_ENCONTRADO', 'Guia nao encontrado');
  }

  return rows[0];
}

async function decide(user, id, decision, reason = null) {
  if (!['APROVADO', 'REPROVADO'].includes(decision)) {
    fail(422, 'DADOS_INVALIDOS', 'Decisao administrativa invalida');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT * FROM tb_guia WHERE id_guia = ? FOR UPDATE',
      [id]
    );

    if (!rows.length) {
      fail(404, 'NAO_ENCONTRADO', 'Guia nao encontrado');
    }

    const guide = rows[0];

    if (guide.status_aprovacao !== 'PENDENTE') {
      fail(409, 'STATUS_INVALIDO', 'Este cadastro ja recebeu uma decisao');
    }

    await connection.execute(
      `UPDATE tb_guia
       SET status_aprovacao = ?, motivo_reprovacao = ?
       WHERE id_guia = ?`,
      [decision, decision === 'REPROVADO' ? reason : null, id]
    );

    const [updatedRows] = await connection.execute(
      'SELECT * FROM tb_guia WHERE id_guia = ?',
      [id]
    );

    await connection.commit();

    return updatedRows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function approve(user, id) {
  return decide(user, id, 'APROVADO');
}

async function reject(user, id, reason) {
  return decide(user, id, 'REPROVADO', reason);
}

module.exports = {
  listPending,
  get,
  approve,
  reject
};
