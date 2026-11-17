'use strict';
const pool = require('../config/database');
const {fail} = require('../utils/errors');
const users = require('../repositories/user.repository');
const sql = require('../repositories/sql.repository');
async function attach(hotelId, userId, cnpj) {
  if (cnpj != null) {
    const parsed = require('../validators/schemas').cnpj.safeParse(cnpj);
    if (!parsed.success) fail(422,'CNPJ_INVALIDO','CNPJ invalido');
    cnpj = parsed.data;
  }
  const hotel = await sql.findById('tb_hotel','id_hotel',hotelId);
  if (!hotel) fail(404,'NAO_ENCONTRADO','Hospedagem nao encontrada');
  const user = await users.byId(userId);
  if (!user || user.tipo_usuario !== 'GESTOR_HOSPEDAGEM' || user.status !== 'ATIVO')
    fail(422,'GESTOR_INVALIDO','Usuario informado nao e gestor ativo');
  // Omitir CNPJ preserva um documento existente; null o remove explicitamente.
  if (cnpj === undefined) {
    await pool.execute(`INSERT INTO tb_admin_hotel (id_hotel,id_usuario,ativo)
      VALUES (?,?,1) ON DUPLICATE KEY UPDATE ativo=1, data_desativacao=NULL`, [hotelId,userId]);
  } else {
    await pool.execute(`INSERT INTO tb_admin_hotel (id_hotel,id_usuario,cnpj,ativo)
      VALUES (?,?,?,1) ON DUPLICATE KEY UPDATE ativo=1, data_desativacao=NULL, cnpj=?`, [hotelId,userId,cnpj,cnpj]);
  }
  return {id_hotel:hotelId,id_usuario:userId,ativo:true};
}
async function detach(hotelId,userId) {
  const [result] = await pool.execute(`UPDATE tb_admin_hotel SET ativo=0,data_desativacao=CURRENT_TIMESTAMP
    WHERE id_hotel=? AND id_usuario=? AND ativo=1`,[hotelId,userId]);
  if (!result.affectedRows) fail(404,'VINCULO_NAO_ENCONTRADO','Vinculo ativo nao encontrado');
  return {id_hotel:hotelId,id_usuario:userId,ativo:false};
}
module.exports = {attach,detach};
