import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidCpf, passwordError, draftError } from '../src/lib/validation.ts';
test('CPF aceita máscara oficial e zero inicial e rejeita caracteres, repetição e dígitos incorretos', () => {
  for (const valid of ['52998224725', '529.982.247-25', '01234567890']) assert.equal(isValidCpf(valid), true, valid);
  for (const invalid of ['', '11111111111', '52998224724', '529a98224725', '529 982 247 25']) assert.equal(isValidCpf(invalid), false, invalid);
});
test('senha corresponde aos limites de caracteres e bytes do backend', () => {
  assert.ok(passwordError('curta'));
  assert.equal(passwordError('abcdefghijkl'), null);
  assert.equal(passwordError('é'.repeat(36)), null);
  assert.ok(passwordError('é'.repeat(37)));
});
test('rascunhos exigem datas reais, check-in futuro, saída posterior e hóspedes válidos', () => {
  assert.equal(draftError('2026-11-19', '2026-11-20', 2, '2026-11-18'), null);
  for (const args of [ ['2026-11-18', '2026-11-20', 1], ['2026-11-20', '2026-11-19', 1], ['2026-02-30', '2026-12-01', 1], ['2026-11-19', '2026-11-20', 0], ['2026-11-19', '2026-11-20', 1.5] ]) assert.ok(draftError(...args, '2026-11-18'));
});
