'use strict';

// Mesmas regras da API, expressas com funcoes deterministicas permitidas em CHECK no MySQL 8.
function checkDigit(column, weights, position) {
  const sum = weights.map((weight, i) => `(ASCII(SUBSTRING(${column},${i + 1},1))-48)*${weight}`).join('+');
  return `(ASCII(SUBSTRING(${column},${position},1))-48) = MOD(MOD(10*(${sum}),11),10)`;
}
const cpf = `cpf REGEXP '^[0-9]{11}$'
    AND cpf NOT IN (${Array.from({length:10}, (_, i) => `'${String(i).repeat(11)}'`).join(',')})
    AND ${checkDigit('cpf', [10,9,8,7,6,5,4,3,2], 10)}
    AND ${checkDigit('cpf', [11,10,9,8,7,6,5,4,3,2], 11)}`;
const cnpj = `cnpj IS NULL OR (
    REGEXP_LIKE(cnpj, '^[A-Z0-9]{12}[0-9]{2}$', 'c')
    AND cnpj NOT IN (${Array.from({length:10}, (_, i) => `'${String(i).repeat(14)}'`).join(',')})
    AND ${checkDigit('cnpj', [5,4,3,2,9,8,7,6,5,4,3,2], 13)}
    AND ${checkDigit('cnpj', [6,5,4,3,2,9,8,7,6,5,4,3,2], 14)})`;
module.exports = { cpf, cnpj };
