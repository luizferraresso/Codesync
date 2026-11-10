jest.mock('../../src/config/database',()=>({execute:jest.fn(),getConnection:jest.fn()}));
jest.mock('../../src/repositories/reservation.repository');
const pool=require('../../src/config/database');
const reservations=require('../../src/repositories/reservation.repository');
const service=require('../../src/services/payment.service');
const admin={id_usuario:'1',tipo_usuario:'ADMIN'},client={id_usuario:'2',tipo_usuario:'CLIENTE'};
let tx;
beforeEach(()=>{
  jest.resetAllMocks();
  tx={beginTransaction:jest.fn(),commit:jest.fn(),rollback:jest.fn(),release:jest.fn(),execute:jest.fn()};
  pool.getConnection.mockResolvedValue(tx);
});
test('pagamento bloqueia e valida reserva dentro da transacao',async()=>{
  reservations.find.mockResolvedValue({status_codigo:'PENDENTE'});
  tx.execute.mockResolvedValueOnce([[{id_status_pagamento:'1'}]]).mockResolvedValueOnce([{insertId:9}]).mockResolvedValueOnce([{}]);
  pool.execute.mockResolvedValue([[{id_pagamento:'9',id_usuario:'2'}]]);
  await expect(service.createInternal(admin,{id_reserva:'3',valor:100})).resolves.toMatchObject({id_pagamento:'9'});
  expect(reservations.find).toHaveBeenCalledWith('3',tx,true);
  expect(tx.beginTransaction.mock.invocationCallOrder[0]).toBeLessThan(reservations.find.mock.invocationCallOrder[0]);
  expect(tx.commit).toHaveBeenCalled(); expect(tx.release).toHaveBeenCalled();
});
test.each([null,{status_codigo:'CANCELADA'}])('reserva invalida nao recebe pagamento %j',async booking=>{
  reservations.find.mockResolvedValue(booking);
  await expect(service.createInternal(admin,{id_reserva:'3',valor:100})).rejects.toMatchObject({status:booking?409:404});
  expect(tx.execute).not.toHaveBeenCalled(); expect(tx.rollback).toHaveBeenCalled(); expect(tx.release).toHaveBeenCalled();
});
test('falha de historico reverte pagamento',async()=>{
  reservations.find.mockResolvedValue({status_codigo:'PENDENTE'});
  tx.execute.mockResolvedValueOnce([[{id_status_pagamento:'1'}]]).mockResolvedValueOnce([{insertId:9}]).mockRejectedValueOnce(new Error('historico'));
  await expect(service.createInternal(admin,{id_reserva:'3',valor:100})).rejects.toThrow('historico');
  expect(tx.commit).not.toHaveBeenCalled(); expect(tx.rollback).toHaveBeenCalled();
});
test('cliente nao cria pagamento',async()=>{
  await expect(service.createInternal(client,{id_reserva:'3',valor:100})).rejects.toMatchObject({status:403});
  expect(pool.getConnection).not.toHaveBeenCalled();
});
test('cliente nao acessa pagamento alheio',async()=>{
  pool.execute.mockResolvedValue([[{id_usuario:'9'}]]);
  await expect(service.get(client,'5')).rejects.toMatchObject({status:403});
});
test('pagamento inexistente retorna 404',async()=>{
  pool.execute.mockResolvedValue([[]]); await expect(service.get(admin,'5')).rejects.toMatchObject({status:404});
});
test('cliente nao recebe identificador externo',async()=>{
  pool.execute.mockResolvedValue([[{id_usuario:'2',transacao_externa_id:'privado'}]]);
  expect(await service.get(client,'5')).not.toHaveProperty('transacao_externa_id');
});
test.each([admin,client])('listagem respeita escopo %j',async user=>{
  pool.execute.mockResolvedValue([[]]); await service.list(user);
  expect(pool.execute.mock.calls[0][1]).toEqual(user===admin?[]:['2']);
});
