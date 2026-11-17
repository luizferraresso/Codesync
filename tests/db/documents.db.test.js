const pool = require('../../src/config/database');
const request = require('supertest');
const app = require('../../src/app');
const run = process.env.RUN_DB_TESTS === '1';

(run ? describe : describe.skip)('Integridade de documentos e motivo de auditoria no MySQL', () => {
  let tx;
  beforeEach(async () => { tx = await pool.getConnection(); await tx.beginTransaction(); });
  afterEach(async () => { if (tx) { await tx.rollback(); tx.release(); tx = null; } });
  afterAll(async () => { await pool.end(); });

  async function insertUser(cpf, suffix = '1') {
    const [result] = await tx.execute('INSERT INTO tb_usuario (nome,email,senha_hash,cpf) VALUES (?,?,?,?)',
      ['Documento teste',`document-${Date.now()}-${suffix}@example.test`,'hash-ficticio',cpf]);
    return String(result.insertId);
  }
  test.each([null,'00000000000','11111111111','52998224724','52998224715'])('SQL recusa CPF invalido ou nulo: %s', async cpf => {
    await expect(insertUser(cpf)).rejects.toMatchObject({code: cpf === null ? 'ER_BAD_NULL_ERROR' : 'ER_CHECK_CONSTRAINT_VIOLATED'});
  });
  test('indice UNIQUE impede dois usuarios com o mesmo CPF', async () => {
    await insertUser('39053344705');
    await expect(insertUser('39053344705','2')).rejects.toMatchObject({code:'ER_DUP_ENTRY'});
  });
  test('SQL recusa alteracao para CPF com digitos errados', async () => {
    const id = await insertUser('39053344705');
    await expect(tx.execute('UPDATE tb_usuario SET cpf=? WHERE id_usuario=?',['39053344706',id]))
      .rejects.toMatchObject({code:'ER_CHECK_CONSTRAINT_VIOLATED'});
  });
  test('SQL valida CNPJ numerico e alfanumerico no INSERT e UPDATE', async () => {
    const userId = await insertUser('39053344705');
    const [hotel] = await tx.execute('INSERT INTO tb_hotel (nome) VALUES (?)',['Hotel documentos']);
    const hotelId = String(hotel.insertId);
    await expect(tx.execute('INSERT INTO tb_admin_hotel (id_usuario,id_hotel,cnpj) VALUES (?,?,?)',
      [userId,hotelId,'11222333000182'])).rejects.toMatchObject({code:'ER_CHECK_CONSTRAINT_VIOLATED'});
    await tx.execute('INSERT INTO tb_admin_hotel (id_usuario,id_hotel,cnpj) VALUES (?,?,?)',
      [userId,hotelId,'11222333000181']);
    for (const cnpj of ['00000000000000','00000000E08G13','00000000e08g12']) {
      await expect(tx.execute('UPDATE tb_admin_hotel SET cnpj=? WHERE id_usuario=?',[cnpj,userId]))
        .rejects.toMatchObject({code:'ER_CHECK_CONSTRAINT_VIOLATED'});
    }
    await tx.execute('UPDATE tb_admin_hotel SET cnpj=? WHERE id_usuario=?',['00000000E08G12',userId]);
  });
  test('falha HTTP persiste motivo especifico sem CPF, email ou senha', async () => {
    const [[{start}]] = await pool.query('SELECT COALESCE(MAX(id_log),0) AS start FROM tb_log');
    const input = {nome:'Documento',email:'documento-privado@example.test',cpf:'52998224724',senha:'SegredoPrivado#2026'};
    const r = await request(app).post('/api/v1/auth/register').send(input);
    expect(r.status).toBe(422);
    let rows = [];
    for (let i = 0; i < 20; i++) {
      [rows] = await pool.execute("SELECT id_log,motivo,detalhes FROM tb_log WHERE id_log>? AND acao='CADASTRO' AND motivo=?",
        [start,'Falha no cadastro: CPF invalido ou ausente']);
      if (rows.length) break;
      await new Promise(resolve => setTimeout(resolve,50));
    }
    try {
      expect(rows.length).toBeGreaterThan(0);
      const stored = JSON.stringify(rows);
      for (const value of [input.cpf,input.email,input.senha]) expect(stored).not.toContain(value);
    } finally {
      for (const row of rows) await pool.execute('DELETE FROM tb_log WHERE id_log=?',[row.id_log]);
    }
  });
});
