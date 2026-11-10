const request=require('supertest');
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/services/audit.service',()=>({record:jest.fn(async()=>{})}));
jest.mock('../../src/config/database',()=>({query:jest.fn(),execute:jest.fn()}));
const users=require('../../src/repositories/user.repository');
const audit=require('../../src/services/audit.service');
const pool=require('../../src/config/database');
const {signToken}=require('../../src/utils/security');
const app=require('../../src/app');
const user={id_usuario:'5',tipo_usuario:'CLIENTE',status:'ATIVO',email:'teste@example.test',token_version:1};
beforeEach(()=>{jest.resetAllMocks(); users.byId.mockResolvedValue(user);});
test('payload excessivo recebe 413 sem erro interno',async()=>{
  const r=await request(app).post('/api/v1/auth/register').send({nome:'x'.repeat(110000)});
  expect(r.status).toBe(413); expect(r.body.error.code).toBe('CORPO_MUITO_GRANDE');
});
test('token de versao anterior e revogado',async()=>{
  const r=await request(app).get('/api/v1/usuarios/me').set('Authorization',`Bearer ${signToken({...user,token_version:0})}`);
  expect(r.status).toBe(401); expect(r.body.error.code).toBe('SESSAO_REVOGADA');
});
test('token atual funciona sem expor versao de sessao',async()=>{
  users.byId.mockResolvedValueOnce(user).mockResolvedValueOnce({id_usuario:'5',nome:'Teste'});
  const r=await request(app).get('/api/v1/usuarios/me').set('Authorization',`Bearer ${signToken(user)}`);
  expect(r.status).toBe(200); expect(r.body.data).not.toHaveProperty('token_version');
});
test('troca de senha registra acao especifica',async()=>{
  const {hashPassword}=require('../../src/utils/security');
  users.byEmail.mockResolvedValue({senha_hash:await hashPassword('Anterior#2026')});
  users.changePassword.mockResolvedValue(1);
  const r=await request(app).patch('/api/v1/auth/password').set('Authorization',`Bearer ${signToken(user)}`)
    .send({atual:'Anterior#2026',nova:'NovaSenha#2026'});
  expect(r.status).toBe(204);
  await new Promise(resolve=>setImmediate(resolve));
  expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({action:'ALTERACAO_SENHA',operation:'PATCH'}));
});
test('catalogo limita no SQL depois de filtrar e pagina',async()=>{
  pool.execute.mockResolvedValue([[{id_hotel:'1',status:'ATIVO'}]]);
  const r=await request(app).get('/api/v1/hoteis?limit=5&offset=10');
  expect(r.status).toBe(200);
  expect(pool.execute).toHaveBeenCalledWith(expect.stringMatching(/WHERE `status` = \? ORDER BY 1 DESC LIMIT \? OFFSET \?/),['ATIVO','5','10']);
});
test('erro de intervalo SQL retorna 422',async()=>{
  pool.execute.mockRejectedValue({code:'ER_WARN_DATA_OUT_OF_RANGE'});
  const r=await request(app).get('/api/v1/hoteis');
  expect(r.status).toBe(422);
});
test('health e documentos carregam',async()=>{
  pool.query.mockResolvedValue([[{ok:1}]]);
  expect((await request(app).get('/health')).body.status).toBe('ok');
  expect((await request(app).get('/openapi.json')).body.openapi).toBe('3.0.3');
  expect((await request(app).get('/api-docs/')).status).toBe(200);
});
