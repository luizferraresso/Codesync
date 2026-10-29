const schemas = require('../../src/validators/schemas');
const {hashPassword,verifyPassword} = require('../../src/utils/security');
describe('Limites de entrada e senhas UTF-8',()=>{
  test.each(['é'.repeat(36)+'A','😀'.repeat(19)])('rejeita senha acima de 72 bytes: %s',async senha=>{
    expect(schemas.password.safeParse(senha).success).toBe(false);
    expect(()=>hashPassword(senha)).toThrow(expect.objectContaining({status:422}));
    const valid='é'.repeat(36);
    expect(await verifyPassword(senha,await hashPassword(valid))).toBe(false);
  });
  test('aceita limite UTF-8 de 72 bytes',()=>expect(schemas.password.safeParse('é'.repeat(36)).success).toBe(true));
  test.each(['18446744073709551616','0','abc','-1'])('rejeita ID fora de BIGINT: %s',id=>expect(schemas.bigintId.safeParse(id).success).toBe(false));
  test('aceita maior BIGINT UNSIGNED',()=>expect(schemas.bigintId.safeParse('18446744073709551615').success).toBe(true));
  test('rejeita valores fora dos tipos SQL',()=>{
    expect(schemas.quartoCreate.safeParse({id_hotel:'1',nome:'Q',tipo:'Q',capacidade:2,valor_diaria:100,quantidade_disponivel:65536}).success).toBe(false);
    expect(schemas.pagamentoCreate.safeParse({id_reserva:'1',valor:10000000000}).success).toBe(false);
  });
  test.each([{limit:0},{limit:101},{offset:-1},{offset:'1 OR 1=1'}])('rejeita paginacao invalida %j',input=>expect(schemas.pagination.safeParse(input).success).toBe(false));
  test('normaliza paginacao HTTP',()=>expect(schemas.pagination.parse({limit:'5',offset:'10'})).toEqual({limit:5,offset:10}));
});
