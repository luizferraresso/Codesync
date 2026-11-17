const { isValidCpf, isValidCnpj } = require('../../src/utils/documents');
const s = require('../../src/validators/schemas');

test.each(['52998224725','529.982.247-25','01234567890','11144477735'])('aceita CPF com digitos validos: %s', cpf => {
  expect(isValidCpf(cpf)).toBe(true);
  expect(s.cpf.parse(cpf)).toMatch(/^\d{11}$/);
});
test.each([null,undefined,52998224725,'','00000000000','11111111111','99999999999',
  '52998224724','52998224715','5299822472','529982247250','abc52998224725','529.982247-25'])('recusa CPF invalido: %s', cpf => {
  expect(isValidCpf(cpf)).toBe(false);
  expect(s.cpf.safeParse(cpf).success).toBe(false);
});
test.each(['11222333000181','11.222.333/0001-81','04252011000110','00.000.000/E08G-12'])('aceita CNPJ: %s', cnpj => {
  expect(isValidCnpj(cnpj)).toBe(true);
  expect(s.cnpj.parse(cnpj)).toMatch(/^[A-Z0-9]{12}\d{2}$/);
});
test('normaliza letras minusculas e mascara do CNPJ', () => expect(s.cnpj.parse('00.000.000/e08g-12')).toBe('00000000E08G12'));
test.each([null,undefined,11222333000181,'','00000000000000','11111111111111',
  '11222333000182','11222333000191','00.000.000/E08G-13','1122233300018','112223330001811','11.222333/0001-81'])('recusa CNPJ invalido: %s', cnpj => {
  expect(isValidCnpj(cnpj)).toBe(false);
  expect(s.cnpj.safeParse(cnpj).success).toBe(false);
});
test('CPF e obrigatorio para clientes e equipe', () => {
  const input = {nome:'Teste',email:'teste@example.test',senha:'TesteSenha#2026'};
  expect(s.registration.safeParse(input).success).toBe(false);
  expect(s.staffCreate.safeParse({...input,tipo_usuario:'GUIA'}).success).toBe(false);
  expect(s.registration.safeParse({...input,cpf:'52998224725'}).success).toBe(true);
});
test('CNPJ continua opcional, mas quando fornecido precisa ser valido', () => {
  expect(s.managerAttach.parse({id_usuario:'1'})).toEqual({id_usuario:'1'});
  expect(s.managerAttach.parse({id_usuario:'1',cnpj:null}).cnpj).toBeNull();
  expect(s.managerAttach.safeParse({id_usuario:'1',cnpj:'12345678901234'}).success).toBe(false);
});
