const request=require('supertest');
const pool=require('../../src/config/database');
const app=require('../../src/app');
const {hashPassword,signToken}=require('../../src/utils/security');
const run=process.env.RUN_DB_TESTS==='1';
const headers=user=>({Authorization:`Bearer ${signToken(user)}`});
const nonce=`regression-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
let owner,other,admin,hotelId,roomId,guideId,guideBookingId;
const userIds=[],hotelIds=[],reservationIds=[];
const draftInput={checkin:'2099-01-01',checkout:'2099-01-03',quantidade_hospedes:2};
async function createDraft(user=owner) {
  const r=await request(app).post('/api/v1/reservas').set(headers(user)).send(draftInput);
  expect(r.status).toBe(201);reservationIds.push(r.body.data.id_reserva);return r.body.data;
}
(run?describe:describe.skip)('Regressoes com MySQL real e transacoes concorrentes',()=>{
  beforeAll(async()=>{
    const hash=await hashPassword('TesteRegressao#2026');
    for(const [suffix,role] of [['owner','CLIENTE'],['other','CLIENTE'],['admin','ADMIN']]) {
      const [r]=await pool.execute('INSERT INTO tb_usuario (nome,email,senha_hash,tipo_usuario) VALUES (?,?,?,?)',
        ['Regressao',`${nonce}-${suffix}@example.test`,hash,role]);
      const user={id_usuario:String(r.insertId),tipo_usuario:role,token_version:0};
      userIds.push(user.id_usuario);
      if(suffix==='owner') owner=user; else if(suffix==='other') other=user; else admin=user;
    }
    const [hotel]=await pool.execute('INSERT INTO tb_hotel (nome) VALUES (?)',[nonce]);
    hotelId=String(hotel.insertId);hotelIds.push(hotelId);
    const [room]=await pool.execute('INSERT INTO tb_tipo_quarto (id_hotel,nome,tipo,capacidade,valor_diaria) VALUES (?,?,?,?,?)',[hotelId,'Regressao','STANDARD',2,100]);
    roomId=String(room.insertId);
    const [guide]=await pool.execute("INSERT INTO tb_guia (nome,tipo_guia,status_aprovacao) VALUES (?,'EXTERNO','APROVADO')",[nonce]);
    guideId=String(guide.insertId);
  });
  afterAll(async()=>{
    // Aguarda apenas gravacoes assincronas destes dados ficticios antes da limpeza.
    await new Promise(resolve=>setTimeout(resolve,200));
    try {
      if(userIds.length) await pool.query('DELETE FROM tb_ocorrencia WHERE id_usuario IN (?)',[userIds]);
      if(reservationIds.length) {
        await pool.query('DELETE h FROM tb_pagamento_status h JOIN tb_pagamento p USING(id_pagamento) WHERE p.id_reserva IN (?)',[reservationIds]);
        await pool.query('DELETE FROM tb_pagamento WHERE id_reserva IN (?)',[reservationIds]);
        await pool.query('DELETE FROM tb_reserva_status WHERE id_reserva IN (?)',[reservationIds]);
        await pool.query('DELETE FROM tb_reserva_guia WHERE id_reserva IN (?)',[reservationIds]);
        await pool.query('DELETE FROM tb_item_reserva WHERE id_reserva IN (?)',[reservationIds]);
        await pool.query('DELETE FROM tb_reserva WHERE id_reserva IN (?)',[reservationIds]);
      }
      if(guideId) await pool.execute('DELETE FROM tb_guia WHERE id_guia=?',[guideId]);
      if(roomId) await pool.execute('DELETE FROM tb_tipo_quarto WHERE id_tipo_quarto=?',[roomId]);
      if(hotelIds.length) await pool.query('DELETE FROM tb_hotel WHERE id_hotel IN (?)',[hotelIds]);
      if(userIds.length) {
        await pool.query('DELETE FROM tb_log WHERE id_usuario IN (?)',[userIds]);
        await pool.query('DELETE FROM tb_usuario WHERE id_usuario IN (?)',[userIds]);
      }
    } finally { await pool.end(); }
  });
  test('cancelamento que termina antes da transacao impede pagamento atrasado',async()=>{
    const draft=await createDraft();
    const original=pool.getConnection.bind(pool);
    let first=true,signal,resume;
    const paused=new Promise(resolve=>{signal=resolve;});
    const gate=new Promise(resolve=>{resume=resolve;});
    let timer;
    pool.getConnection=async()=>{
      if(first) {first=false;signal();await gate;} return original();
    };
    let pending;
    try {
      pending=request(app).post('/api/v1/pagamentos').set(headers(admin)).send({id_reserva:draft.id_reserva,valor:100}).then(r=>r);
      await Promise.race([paused,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Barreira de concorrencia expirou')),5000);})]);
      const cancel=await request(app).delete(`/api/v1/reservas/${draft.id_reserva}`).set(headers(owner));
      expect(cancel.status).toBe(200);resume();
      expect((await pending).status).toBe(409);
      const [[count]]=await pool.execute('SELECT COUNT(*) AS total FROM tb_pagamento WHERE id_reserva=?',[draft.id_reserva]);
      expect(Number(count.total)).toBe(0);
    } finally {
      clearTimeout(timer);resume();pool.getConnection=original;if(pending) await pending;
    }
  });
  test('pagamento existente impede cancelamento e preserva pendente',async()=>{
    const draft=await createDraft();
    expect((await request(app).post('/api/v1/pagamentos').set(headers(admin)).send({id_reserva:draft.id_reserva,valor:100})).status).toBe(201);
    expect((await request(app).delete(`/api/v1/reservas/${draft.id_reserva}`).set(headers(owner))).status).toBe(409);
    const state=await request(app).get(`/api/v1/reservas/${draft.id_reserva}`).set(headers(owner));
    expect(state.body.data.status_codigo).toBe('PENDENTE');
  });
  test('ocorrencia nao associa reserva de outro usuario, inclusive via guia',async()=>{
    const draft=await createDraft();
    await pool.execute('INSERT INTO tb_item_reserva (id_reserva,id_tipo_quarto,quantidade,valor_diaria,valor_total) VALUES (?,?,1,100,200)',[draft.id_reserva,roomId]);
    const [booking]=await pool.execute("INSERT INTO tb_reserva_guia (id_reserva,id_guia,data_servico,valor) VALUES (?,?,'2099-01-02',100)",[draft.id_reserva,guideId]);
    guideBookingId=String(booking.insertId);
    const input={tipo_alvo:'GUIA',id_alvo:guideId,id_reserva_guia:guideBookingId,tipo_ocorrencia:'TESTE',descricao:'Relato de teste'};
    expect((await request(app).post('/api/v1/ocorrencias').set(headers(other)).send(input)).status).toBe(403);
    expect((await request(app).post('/api/v1/ocorrencias').set(headers(owner)).send(input)).status).toBe(201);
    expect((await request(app).post('/api/v1/ocorrencias').set(headers(other)).send({...input,tipo_alvo:'HOTEL',id_alvo:hotelId,id_reserva:draft.id_reserva,id_reserva_guia:null})).status).toBe(403);
  });
  test('troca de senha revoga JWT, persiste auditoria correta e permite novo login',async()=>{
    const oldToken=signToken(owner);
    const r=await request(app).patch('/api/v1/auth/password').set('Authorization',`Bearer ${oldToken}`)
      .send({atual:'TesteRegressao#2026',nova:'NovaSenhaRegressao#2026'});
    expect(r.status).toBe(204);
    expect((await request(app).get('/api/v1/usuarios/me').set('Authorization',`Bearer ${oldToken}`)).status).toBe(401);
    const login=await request(app).post('/api/v1/auth/login').send({email:`${nonce}-owner@example.test`,senha:'NovaSenhaRegressao#2026'});
    expect(login.status).toBe(200);
    expect((await request(app).get('/api/v1/usuarios/me').set('Authorization',`Bearer ${login.body.data.token}`)).status).toBe(200);
    for(let i=0;i<10;i++) {
      const [logs]=await pool.execute("SELECT acao FROM tb_log WHERE id_usuario=? AND acao='ALTERACAO_SENHA'",[owner.id_usuario]);
      if(logs.length) {expect(logs[0].acao).toBe('ALTERACAO_SENHA');return;}
      await new Promise(resolve=>setTimeout(resolve,50));
    }
    throw new Error('Auditoria da troca de senha nao persistiu');
  });
  test('hotel ativo nao desaparece atras de 100 inativos e paginacao respeita limite',async()=>{
    for(let i=0;i<100;i++) {
      const [r]=await pool.execute("INSERT INTO tb_hotel (nome,status) VALUES (?,'INATIVO')",[`${nonce}-${i}`]);
      hotelIds.push(String(r.insertId));
    }
    const r=await request(app).get('/api/v1/hoteis');
    expect(r.status).toBe(200);expect(r.body.data.some(h=>String(h.id_hotel)===hotelId)).toBe(true);
    expect((await request(app).get('/api/v1/hoteis?limit=1')).body.data).toHaveLength(1);
    const q=await request(app).get('/api/v1/quartos?limit=1&offset=0');
    expect(q.status).toBe(200);expect(q.body.data).toHaveLength(1);
  });
});
