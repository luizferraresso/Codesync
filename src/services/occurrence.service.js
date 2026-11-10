'use strict';
const pool = require('../config/database');
const { fail } = require('../utils/errors');
const sql = require('../repositories/sql.repository');
const references = { CLIENTE:['id_usuario_alvo','tb_usuario','id_usuario'], HOTEL:['id_hotel_alvo','tb_hotel','id_hotel'], GUIA:['id_guia_alvo','tb_guia','id_guia'] };
async function list(user) {
  const admin = user.tipo_usuario === 'ADMIN';
  const [rows] = await pool.execute(`SELECT * FROM tb_ocorrencia
    ${admin ? '' : 'WHERE id_usuario = ?'} ORDER BY id_ocorrencia DESC LIMIT 100`, admin ? [] : [user.id_usuario]);
  return rows;
}
async function get(user,id) {
  const row = await sql.findById('tb_ocorrencia','id_ocorrencia',id);
  if (!row) fail(404,'NAO_ENCONTRADO','Ocorrencia nao encontrada');
  if (user.tipo_usuario !== 'ADMIN' && String(row.id_usuario) !== String(user.id_usuario))
    fail(403,'ACESSO_NEGADO','Ocorrencia de outro usuario');
  return row;
}
async function create(user, data) {
  const [column,table,pk] = references[data.tipo_alvo];
  const target = await sql.findById(table,pk,data.id_alvo);
  if (!target) fail(422,'ALVO_INVALIDO','Alvo da ocorrencia nao encontrado');
  let linkedReservation = null;
  if (data.id_reserva_guia) {
    const guideBooking = await sql.findById('tb_reserva_guia','id_reserva_guia',data.id_reserva_guia);
    if (!guideBooking) fail(422,'REFERENCIA_INVALIDA','Reserva de guia nao encontrada');
    linkedReservation = guideBooking.id_reserva;
    if (data.id_reserva && String(data.id_reserva) !== String(linkedReservation))
      fail(422,'VINCULO_INVALIDO','Reservas informadas nao correspondem');
    if (data.tipo_alvo === 'GUIA' && String(guideBooking.id_guia) !== String(data.id_alvo))
      fail(422,'VINCULO_INVALIDO','Guia nao corresponde a reserva informada');
  }
  const reservationId = data.id_reserva || linkedReservation;
  if (reservationId) {
    const booking = await sql.findById('tb_reserva','id_reserva',reservationId);
    if (!booking) fail(422,'REFERENCIA_INVALIDA','Reserva nao encontrada');
    if (user.tipo_usuario !== 'ADMIN' && String(booking.id_usuario) !== String(user.id_usuario))
      fail(403,'ACESSO_NEGADO','Reserva de outro usuario');
    if (data.tipo_alvo === 'HOTEL') {
      const [items] = await pool.execute(`SELECT 1 FROM tb_item_reserva i
        JOIN tb_tipo_quarto q ON q.id_tipo_quarto=i.id_tipo_quarto
        WHERE i.id_reserva=? AND q.id_hotel=? LIMIT 1`,[reservationId,data.id_alvo]);
      if (!items.length) fail(422,'VINCULO_INVALIDO','Hospedagem nao pertence a reserva informada');
    }
    if (data.tipo_alvo === 'CLIENTE' && String(booking.id_usuario) !== String(data.id_alvo))
      fail(422,'VINCULO_INVALIDO','Cliente nao corresponde a reserva informada');
    if (data.tipo_alvo === 'GUIA' && !data.id_reserva_guia) {
      const [guides] = await pool.execute('SELECT 1 FROM tb_reserva_guia WHERE id_reserva=? AND id_guia=? LIMIT 1',
        [reservationId,data.id_alvo]);
      if (!guides.length) fail(422,'VINCULO_INVALIDO','Guia nao pertence a reserva informada');
    }
  }
  const id = await sql.create('tb_ocorrencia', {
    id_usuario: user.id_usuario,
    id_reserva: reservationId ?? null,
    id_reserva_guia: data.id_reserva_guia ?? null,
    tipo_alvo: data.tipo_alvo,
    [column]: data.id_alvo,
    tipo_ocorrencia: data.tipo_ocorrencia,
    descricao: data.descricao,
    status: 'ABERTA'
  });
  return get(user,id);
}
async function review(user,id,data) {
  if (user.tipo_usuario !== 'ADMIN') fail(403,'ACESSO_NEGADO','Revisao exige administrador');
  const current = await get(user,id);
  if (current.status === 'ENCERRADA') fail(409,'OCORRENCIA_ENCERRADA','Ocorrencia encerrada');
  await pool.execute(`UPDATE tb_ocorrencia SET status = ?, analise = ?, id_usuario_analista = ?, data_analise = CURRENT_TIMESTAMP
    WHERE id_ocorrencia = ?`,[data.status,data.analise,user.id_usuario,id]);
  // Nao gera punicao: analise humana nao equivale a aplicar automaticamente uma pena.
  return get(user,id);
}
module.exports = { list, get, create, review };
