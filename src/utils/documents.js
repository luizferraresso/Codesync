'use strict';

// Aceita somente o documento sem mascara ou com a mascara oficial completa.
// Nao remover caracteres arbitrarios: isso poderia transformar entrada invalida em valida.
function normalizeCpf(value) {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(text) ? text.replace(/[.-]/g, '') : text;
}

function normalizeCnpj(value) {
  if (typeof value !== 'string') return value;
  const text = value.trim().toUpperCase();
  return /^[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}$/.test(text)
    ? text.replace(/[./-]/g, '') : text;
}

function digit(base, weights) {
  const sum = [...base].reduce((total, character, i) => total + (character.charCodeAt(0) - 48) * weights[i], 0);
  const remainder = sum % 11;
  return remainder < 2 ? '0' : String(11 - remainder);
}

function isValidCpf(value) {
  const cpf = normalizeCpf(value);
  if (typeof cpf !== 'string' || !/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  return cpf[9] === digit(cpf.slice(0, 9), [10,9,8,7,6,5,4,3,2])
    && cpf[10] === digit(cpf.slice(0, 10), [11,10,9,8,7,6,5,4,3,2]);
}

// Receita Federal: CNPJ numerico e alfanumerico usam modulo 11 e ASCII - 48.
function isValidCnpj(value) {
  const cnpj = normalizeCnpj(value);
  if (typeof cnpj !== 'string' || !/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  return cnpj[12] === digit(cnpj.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2])
    && cnpj[13] === digit(cnpj.slice(0, 13), [6,5,4,3,2,9,8,7,6,5,4,3,2]);
}

module.exports = { normalizeCpf, normalizeCnpj, isValidCpf, isValidCnpj };
