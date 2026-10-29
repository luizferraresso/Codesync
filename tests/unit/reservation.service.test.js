jest.mock('../../src/config/database',()=>({execute:jest.fn(),getConnection:jest.fn()}));
jest.mock('../../src/repositories/reservation.repository');
const pool=require('../../src/config/database');
const repo=require('../../src/repositories/reservation.repository');
const service=require('../../src/services/reservation.service');
const client={id_usuario:'2',tipo_usuario:'CLIENTE'},admin={id_usuario:'1',tipo_usuario:'ADMIN'};
let tx;
beforeEach(()=>{
  jest.resetAllMocks();
  tx={beginTransaction:jest.fn(),execute:jest.fn().mockResolvedValue([{insertId:5}]),commit:jest.fn(),rollback:jest.fn(),release:jest.fn()};
  pool.getConnection.mockResolvedValue(tx); repo.statusId.mockResolvedValue('1');
  repo.find.mockResolvedValue({id_usuario:'2',status_codigo:'PENDENTE'});repo.anyPayment.mockResolvedValue(false);
});
test('listagem delega escopo do usuario',async()=>{repo.listFor.mockResolvedValue([]);expect(await service.list(client)).toEqual([]);expect(repo.listFor).toHaveBeenCalledWith(client);});
test('leitura recusa reserva de outro cliente',async()=>{repo.find.mockResolvedValue({id_usuario:'9'});await expect(service.get(client,'5')).rejects.toMatchObject({status:403});});
test('reserva inexistente retorna 404',async()=>{repo.find.mockResolvedValue(null);await expect(service.get(client,'5')).rejects.toMatchObject({status:404});});
test('admin consulta reserva de outro cliente',async()=>expect(await service.get(admin,'5')).toMatchObject({id_usuario:'2'}));
test('cria rascunho e historico atomicamente',async()=>{
  await service.create(client,{checkin:'2099-01-01',checkout:'2099-01-02',quantidade_hospedes:2});
  expect(tx.execute).toHaveBeenCalledTimes(2);expect(tx.commit).toHaveBeenCalled();expect(tx.release).toHaveBeenCalled();
});
test('data passada nao abre transacao',async()=>{
  await expect(service.create(client,{checkin:'2000-01-01'})).rejects.toMatchObject({status:422});expect(pool.getConnection).not.toHaveBeenCalled();
});
test('falha ao criar historico reverte rascunho',async()=>{
  tx.execute.mockResolvedValueOnce([{insertId:5}]).mockRejectedValueOnce(new Error('historico'));
  await expect(service.create(client,{checkin:'2099-01-01',checkout:'2099-01-02',quantidade_hospedes:2})).rejects.toThrow('historico');
  expect(tx.rollback).toHaveBeenCalled();expect(tx.commit).not.toHaveBeenCalled();
});
test('edita observacao de rascunho',async()=>{await service.patch(client,'5',{observacoes:'Teste'});expect(pool.execute).toHaveBeenCalledWith(expect.any(String),['Teste','5']);});
test.each([{}, {observacoes:'Teste'}])('recusa edicao invalida %j',async data=>{
  if(Object.keys(data).length) repo.find.mockResolvedValue({id_usuario:'2',status_codigo:'CONFIRMADA'});
  await expect(service.patch(client,'5',data)).rejects.toMatchObject({status:Object.keys(data).length?409:422});
});
test('cancela com bloqueio e historico',async()=>{
  expect(await service.cancelPendingDraft(client,'5')).toEqual({id:'5',status:'CANCELADA'});
  expect(repo.find).toHaveBeenCalledWith('5',tx,true);expect(tx.commit).toHaveBeenCalled();
});
test.each([
  [null,false,404], [{id_usuario:'9',status_codigo:'PENDENTE'},false,403],
  [{id_usuario:'2',status_codigo:'CONFIRMADA'},false,409], [{id_usuario:'2',status_codigo:'PENDENTE'},true,409]
])('cancelamento protegido %#',async(booking,paid,status)=>{
  repo.find.mockResolvedValue(booking);repo.anyPayment.mockResolvedValue(paid);
  await expect(service.cancelPendingDraft(client,'5')).rejects.toMatchObject({status});
  expect(tx.rollback).toHaveBeenCalled();expect(tx.release).toHaveBeenCalled();expect(tx.commit).not.toHaveBeenCalled();
});
