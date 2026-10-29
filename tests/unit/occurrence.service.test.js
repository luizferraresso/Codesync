jest.mock('../../src/config/database',()=>({execute:jest.fn()}));
jest.mock('../../src/repositories/sql.repository');
const pool=require('../../src/config/database'),sql=require('../../src/repositories/sql.repository');
const service=require('../../src/services/occurrence.service');
const client={id_usuario:'2',tipo_usuario:'CLIENTE'},admin={id_usuario:'1',tipo_usuario:'ADMIN'};
const input={tipo_alvo:'GUIA',id_alvo:'4',id_reserva:'8',id_reserva_guia:'9',tipo_ocorrencia:'TESTE',descricao:'Relato'};
beforeEach(()=>{
  jest.resetAllMocks();
  sql.findById.mockImplementation(async table=>({
    tb_guia:{id_guia:'4'}, tb_hotel:{id_hotel:'3'}, tb_usuario:{id_usuario:'2'},
    tb_reserva_guia:{id_reserva:'8',id_guia:'4'},tb_reserva:{id_usuario:'2'},tb_ocorrencia:{id_usuario:'2',status:'ABERTA'}
  }[table]));
  sql.create.mockResolvedValue('10');pool.execute.mockResolvedValue([[{ok:1}]]);
});
test.each([admin,client])('lista somente ocorrencias autorizadas %j',async user=>{await service.list(user);expect(pool.execute.mock.calls[0][1]).toEqual(user===admin?[]:['2']);});
test('cria ocorrencia com vinculos coerentes',async()=>{
  await service.create(client,input);expect(sql.create).toHaveBeenCalledWith('tb_ocorrencia',expect.objectContaining({id_reserva:'8',id_guia_alvo:'4'}));
});
test('reserva derivada do agendamento de guia tambem exige propriedade',async()=>{
  const implementation=sql.findById.getMockImplementation();
  sql.findById.mockImplementation(async(...args)=>args[0]==='tb_reserva'?{id_usuario:'77'}:implementation(...args));
  await expect(service.create(client,{...input,id_reserva:null})).rejects.toMatchObject({status:403});expect(sql.create).not.toHaveBeenCalled();
});
test.each([
  ['tb_guia',null,'ALVO_INVALIDO'],['tb_reserva_guia',null,'REFERENCIA_INVALIDA'],
  ['tb_reserva',null,'REFERENCIA_INVALIDA'],['tb_reserva_guia',{id_reserva:'88',id_guia:'4'},'VINCULO_INVALIDO'],
  ['tb_reserva_guia',{id_reserva:'8',id_guia:'99'},'VINCULO_INVALIDO']
])('rejeita vinculo invalido %s %j',async(table,value,code)=>{
  const implementation=sql.findById.getMockImplementation();
  sql.findById.mockImplementation(async(...args)=>args[0]===table?value:implementation(...args));
  await expect(service.create(client,input)).rejects.toMatchObject({status:422,code});expect(sql.create).not.toHaveBeenCalled();
});
test('hotel deve pertencer aos itens da reserva',async()=>{
  pool.execute.mockResolvedValue([[]]);
  await expect(service.create(client,{...input,tipo_alvo:'HOTEL',id_alvo:'3'})).rejects.toMatchObject({code:'VINCULO_INVALIDO'});
});
test('cliente alvo deve corresponder ao dono da reserva',async()=>{
  await expect(service.create(client,{...input,tipo_alvo:'CLIENTE',id_alvo:'77'})).rejects.toMatchObject({code:'VINCULO_INVALIDO'});
});
test('guia deve estar na reserva mesmo sem id_reserva_guia',async()=>{
  pool.execute.mockResolvedValue([[]]);
  await expect(service.create(client,{...input,id_reserva_guia:null})).rejects.toMatchObject({code:'VINCULO_INVALIDO'});
});
test('ocorrencia de terceiro nao pode ser consultada',async()=>{sql.findById.mockResolvedValue({id_usuario:'77'});await expect(service.get(client,'10')).rejects.toMatchObject({status:403});});
test('ocorrencia inexistente retorna 404',async()=>{sql.findById.mockResolvedValue(null);await expect(service.get(client,'10')).rejects.toMatchObject({status:404});});
test('cliente nao revisa ocorrencia',async()=>await expect(service.review(client,'10',{})).rejects.toMatchObject({status:403}));
test('admin revisa ocorrencia aberta',async()=>{await service.review(admin,'10',{status:'EM_ANALISE',analise:'Revisado'});expect(pool.execute).toHaveBeenCalledWith(expect.stringContaining('id_usuario_analista'),['EM_ANALISE','Revisado','1','10']);});
test('ocorrencia encerrada nao pode ser reaberta',async()=>{sql.findById.mockResolvedValue({id_usuario:'2',status:'ENCERRADA'});await expect(service.review(admin,'10',{status:'EM_ANALISE'})).rejects.toMatchObject({status:409});});
