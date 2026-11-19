
const request = require('supertest');

jest.mock('express-rate-limit', () => {
  const real = jest.requireActual('express-rate-limit');
  const limiters = [];

  const factory = options => {
    const limiter = real(options);
    limiters.push(limiter);
    return limiter;
  };

  factory.resetTestCounters = () => {
    limiters.forEach(limiter => limiter.resetKey('127.0.0.1'));
  };

  return factory;
});

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/sql.repository', () => ({
  create: jest.fn()
}));
jest.mock('../../src/config/database', () => ({
  getConnection: jest.fn()
}));
jest.mock('../../src/services/audit.service', () => ({
  record: jest.fn(async () => {})
}));

const users = require('../../src/repositories/user.repository');
const sql = require('../../src/repositories/sql.repository');
const pool = require('../../src/config/database');
const app = require('../../src/app');

const payload = {
  nome: 'Guia Exemplo',
  email: 'guia.tdd@example.com',
  cpf: '529.982.247-25',
  senha: 'Guia#Senha2026',
  telefone: '34999999999',
  descricao: 'Guia turístico de teste',
  especialidade: 'Turismo histórico',
  area_atuacao: 'Uberlândia',
  servicos_oferecidos: 'Passeios guiados'
};

let connection;

beforeEach(() => {
  require('express-rate-limit').resetTestCounters();
  jest.clearAllMocks();

  connection = {
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn()
  };

  pool.getConnection.mockResolvedValue(connection);

  users.byEmail.mockResolvedValue(null);
  users.byCpf.mockResolvedValue(null);

  users.byId.mockImplementation(async id => ({
    id_usuario: String(id),
    nome: payload.nome,
    email: payload.email,
    telefone: payload.telefone,
    tipo_usuario: 'GUIA',
    status: 'ATIVO'
  }));

  sql.create.mockImplementation(async (table) => {
    if (table === 'tb_usuario') return '501';
    if (table === 'tb_guia') return '801';
    throw new Error(`Tabela inesperada: ${table}`);
  });
});

describe('Cadastro de guia pela API HTTP', () => {
  test('cadastra guia e cria usuário com aprovação pendente', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register/guide')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data.user.tipo_usuario).toBe('GUIA');
    expect(response.body.data.status_aprovacao).toBe('PENDENTE');

    expect(sql.create).toHaveBeenCalledWith(
      'tb_usuario',
      expect.objectContaining({
        email: payload.email,
        tipo_usuario: 'GUIA'
      }),
      connection
    );

    expect(sql.create).toHaveBeenCalledWith(
      'tb_guia',
      expect.objectContaining({
        id_usuario: '501',
        tipo_guia: 'INTERNO',
        status_aprovacao: 'PENDENTE',
        status: 'ATIVO'
      }),
      connection
    );

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();

    expect(JSON.stringify(response.body))
      .not.toMatch(/senha_hash|Guia#Senha2026/);
  });

  test('recusa e-mail já cadastrado', async () => {
    users.byEmail.mockResolvedValue({
      id_usuario: '10',
      email: payload.email
    });

    const response = await request(app)
      .post('/api/v1/auth/register/guide')
      .send(payload);

    expect(response.status).toBe(409);
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test('recusa CPF já cadastrado', async () => {
    users.byCpf.mockResolvedValue({
      id_usuario: '10'
    });

    const response = await request(app)
      .post('/api/v1/auth/register/guide')
      .send(payload);

    expect(response.status).toBe(409);
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test.each([
    ['tipo_usuario', 'ADMIN'],
    ['status', 'INATIVO'],
    ['status_aprovacao', 'APROVADO'],
    ['id_usuario', '10'],
    ['id_hotel', '10'],
    ['tipo_guia', 'EXTERNO'],
    ['valor_diaria', 500]
  ])('não permite que o usuário defina %s', async (field, value) => {
    const response = await request(app)
      .post('/api/v1/auth/register/guide')
      .send({
        ...payload,
        [field]: value
      });

    expect(response.status).toBe(422);
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test('executa rollback quando ocorre falha na criação do guia', async () => {
    sql.create.mockImplementation(async table => {
      if (table === 'tb_usuario') return '501';
      throw new Error('Falha simulada na criação do guia');
    });

    const response = await request(app)
      .post('/api/v1/auth/register/guide')
      .send(payload);

    expect(response.status).toBe(500);
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
});
