'use strict';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { fail } = require('./errors');
const hashPassword = password => {
  if (Buffer.byteLength(password,'utf8') > 72) fail(422,'SENHA_INVALIDA','Senha deve ter no maximo 72 bytes UTF-8');
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
};
// Nao aceitar variantes de uma senha antiga que era truncada pelo bcrypt.
const verifyPassword = async (password, hash) => Buffer.byteLength(password,'utf8') <= 72 && bcrypt.compare(password, hash);
const signToken = user => jwt.sign(
  { sub: String(user.id_usuario), sv: Number(user.token_version || 0) }, env.JWT_SECRET,
  { algorithm: 'HS256', expiresIn: env.JWT_EXPIRES_IN, issuer: 'hospedja', audience: 'hospedja-api' }
);
const verifyToken = token => jwt.verify(token, env.JWT_SECRET, {
  algorithms: ['HS256'], issuer: 'hospedja', audience: 'hospedja-api'
});
module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
