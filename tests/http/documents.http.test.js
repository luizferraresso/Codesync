const request = require('supertest');
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/services/audit.service', () => ({record:jest.fn(async () => {})}));
jest.mock('../../src/services/manager.service', () => ({attach:jest.fn(),detach:jest.fn()}));
const users = require('../../src/repositories/user.repository');
const manager = require('../../src/services/manager.service');
const audit = require('../../src/services/audit.service');
const { signToken } = require('../../src/utils/security');
const app = require('../../src/app');
const admin = {id_usuario:'1',tipo_usuario:'ADMIN',status:'ATIVO',token_version:0};
const authorization = `Bearer ${signToken(admin)}`;

beforeEach(() => {
  jest.resetAllMocks();
  users.byId.mockResolvedValue(admin);
  manager.attach.mockResolvedValue({id_hotel:'1',id_usuario:'2',ativo:true});
});
test.each(['11222333000182','00000000000000','texto',''])('HTTP recusa CNPJ invalido e detalha log: %s', async cnpj => {
  const r = await request(app).post('/api/v1/hoteis/1/gestores').set('Authorization',authorization)
    .send({id_usuario:'2',cnpj});
  expect(r.status).toBe(422);
  expect(manager.attach).not.toHaveBeenCalled();
  expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({action:'VINCULO_GESTOR',reason:'Falha no vinculo de gestor: CNPJ invalido'}));
});
test('HTTP encaminha CNPJ normalizado para a persistencia', async () => {
  const r = await request(app).post('/api/v1/hoteis/1/gestores').set('Authorization',authorization)
    .send({id_usuario:'2',cnpj:'11.222.333/0001-81'});
  expect(r.status).toBe(201);
  expect(manager.attach).toHaveBeenCalledWith('1','2','11222333000181');
});
test('HTTP continua aceitando vinculo sem CNPJ', async () => {
  const r = await request(app).post('/api/v1/hoteis/1/gestores').set('Authorization',authorization).send({id_usuario:'2'});
  expect(r.status).toBe(201);
  expect(manager.attach).toHaveBeenCalledWith('1','2',undefined);
});
