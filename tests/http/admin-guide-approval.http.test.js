
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
jest.mock('../../src/config/database', () => ({
  execute: jest.fn(),
  getConnection: jest.fn()
}));
jest.mock('../../src/services/audit.service', () => ({
  record: jest.fn(async () => {})
}));

const users = require('../../src/repositories/user.repository');
const pool = require('../../src/config/database');
const { signToken } = require('../../src/utils/security');
const app = require('../../src/app');

const roles = {
  '1': 'ADMIN',
  '2': 'CLIENTE',
  '3': 'GUIA'
};

const tokenFor = id => signToken({
  id_usuario: String(id),
  token_version: 0
});

const auth = id => ({
  Authorization: `Bearer ${tokenFor(id)}`
});

let connection;
let guideRecord;
let guideExists;
let failUpdate;

beforeEach(() => {
  require('express-rate-limit').resetTestCounters();
  jest.clearAllMocks();

  guideRecord = {
    id_guia: 801,
    id_usuario: 501,
    nome: 'Guia de Teste',
    email: 'guia.teste@example.com',
    tipo_guia: 'INTERNO',
    descricao: 'Guia turístico para testes',
    especialidade: 'Turismo histórico',
    area_atuacao: 'Uberlândia',
    servicos_oferecidos: 'Passeios guiados',
    status_aprovacao: 'PENDENTE',
    motivo_reprovacao: null,
    status: 'ATIVO'
  };

  guideExists = true;
  failUpdate = false;

  users.byId.mockImplementation(async id => ({
    id_usuario: String(id),
    nome: 'Usuário de Teste',
    email: 'usuario@example.com',
    tipo_usuario: roles[String(id)] || 'CLIENTE',
    status: 'ATIVO',
    token_version: 0
  }));

  connection = {
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),

    execute: jest.fn(async (query, params = []) => {
      if (query.includes('FOR UPDATE')) {
        return [
          guideExists ? [{ ...guideRecord }] : [],
          []
        ];
      }

      if (query.includes('UPDATE tb_guia')) {
        if (failUpdate) {
          throw new Error('Falha simulada na atualização');
        }

        guideRecord.status_aprovacao = params[0];
        guideRecord.motivo_reprovacao = params[1];

        return [{ affectedRows: 1 }, []];
      }

      if (query.includes('SELECT * FROM tb_guia WHERE id_guia = ?')) {
        return [[{ ...guideRecord }], []];
      }

      throw new Error(`SQL inesperado: ${query}`);
    })
  };

  pool.getConnection.mockResolvedValue(connection);

  pool.execute.mockImplementation(async query => {
    if (query.includes("WHERE status_aprovacao = 'PENDENTE'")) {
      return [[{ ...guideRecord }], []];
    }

    if (query.includes('WHERE id_guia = ? LIMIT 1')) {
      return [
        guideExists ? [{ ...guideRecord }] : [],
        []
      ];
    }

    throw new Error(`SQL inesperado: ${query}`);
  });
});

describe('Administração de aprovação de guias', () => {
  test('bloqueia acesso sem autenticação', async () => {
    const response = await request(app)
      .get('/api/v1/admin/guias/pendentes');

    expect(response.status).toBe(401);
  });

  test.each([
    ['2', 'CLIENTE'],
    ['3', 'GUIA']
  ])('bloqueia usuário com perfil %s (%s)', async id => {
    const response = await request(app)
      .get('/api/v1/admin/guias/pendentes')
      .set(auth(id));

    expect(response.status).toBe(403);
    expect(pool.execute).not.toHaveBeenCalled();
  });

  test('ADMIN consegue listar guias pendentes', async () => {
    const response = await request(app)
      .get('/api/v1/admin/guias/pendentes')
      .set(auth('1'));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].status_aprovacao).toBe('PENDENTE');
  });

  test('ADMIN consegue consultar os detalhes de um guia', async () => {
    const response = await request(app)
      .get('/api/v1/admin/guias/801')
      .set(auth('1'));

    expect(response.status).toBe(200);
    expect(response.body.data.id_guia).toBe(801);
    expect(response.body.data.nome).toBe('Guia de Teste');
  });

  test('retorna 404 quando o guia não existe', async () => {
    guideExists = false;

    const response = await request(app)
      .get('/api/v1/admin/guias/999')
      .set(auth('1'));

    expect(response.status).toBe(404);
  });

  test('ADMIN consegue aprovar um guia pendente', async () => {
    const response = await request(app)
      .patch('/api/v1/admin/guias/801/aprovar')
      .set(auth('1'));

    expect(response.status).toBe(200);
    expect(response.body.data.status_aprovacao).toBe('APROVADO');
    expect(response.body.data.motivo_reprovacao).toBeNull();

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });

  test('ADMIN consegue reprovar um guia com justificativa', async () => {
    const motivo = 'Documentação profissional incompleta.';

    const response = await request(app)
      .patch('/api/v1/admin/guias/801/reprovar')
      .set(auth('1'))
      .send({ motivo_reprovacao: motivo });

    expect(response.status).toBe(200);
    expect(response.body.data.status_aprovacao).toBe('REPROVADO');
    expect(response.body.data.motivo_reprovacao).toBe(motivo);

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });

  test('não permite reprovação sem justificativa válida', async () => {
    const response = await request(app)
      .patch('/api/v1/admin/guias/801/reprovar')
      .set(auth('1'))
      .send({ motivo_reprovacao: 'curto' });

    expect(response.status).toBe(422);
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test('não permite decidir novamente um guia já aprovado', async () => {
    guideRecord.status_aprovacao = 'APROVADO';

    const response = await request(app)
      .patch('/api/v1/admin/guias/801/aprovar')
      .set(auth('1'));

    expect(response.status).toBe(409);
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });

  test('executa rollback quando ocorre falha na atualização', async () => {
    failUpdate = true;

    const response = await request(app)
      .patch('/api/v1/admin/guias/801/aprovar')
      .set(auth('1'));

    expect(response.status).toBe(500);
    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
});
