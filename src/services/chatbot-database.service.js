
'use strict';

const pool = require('../config/database');

async function buscarHoteis(cidade = null) {
  let sql = `
    SELECT
      h.id_hotel,
      h.nome,
      h.descricao,
      h.categoria,
      e.cidade,
      e.estado
    FROM tb_hotel h
    INNER JOIN tb_endereco e
      ON e.id_hotel = h.id_hotel
    WHERE h.status = 'ATIVO'
  `;

  const parametros = [];

  if (cidade) {
    sql += ' AND e.cidade = ?';
    parametros.push(cidade);
  }

  sql += ' ORDER BY h.nome LIMIT 20';

  const [hoteis] = await pool.execute(sql, parametros);

  return hoteis;
}

module.exports = { buscarHoteis };
