'use strict';
const express = require('express');
const request = require('supertest');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const frontend = require('../../src/middlewares/frontend');
let directory;
beforeAll(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hospedja-frontend-'));
  fs.mkdirSync(path.join(directory,'assets'));
  fs.writeFileSync(path.join(directory,'index.html'), '<!doctype html><title>HospedJá</title>');
  fs.writeFileSync(path.join(directory,'assets','app-test.js'), 'export const ok = true;');
});
afterAll(() => fs.rmSync(directory, {recursive:true,force:true}));
function app(dir = directory) {
  const server = express();
  server.use(frontend(dir));
  server.use((_req,res) => res.status(404).json({error:{code:'ROTA_NAO_ENCONTRADA'}}));
  return server;
}
test('serve HTML sem cache e mantém CSP sem script inline e acesso ao backend na mesma origem', async () => {
  const response = await request(app()).get('/').expect(200).expect('Content-Type', /html/);
  expect(response.text).toContain('HospedJá');
  expect(response.headers['cache-control']).toBe('no-store');
  expect(response.headers['content-security-policy']).toContain("script-src 'self'");
  expect(response.headers['content-security-policy']).toContain("connect-src 'self'");
  expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
});
test('assets possuem cache e URLs inexistentes de API e assets continuam 404 JSON', async () => {
  const server = app();
  const asset = await request(server).get('/assets/app-test.js').expect(200);
  expect(asset.headers['cache-control']).toContain('immutable');
  for (const url of ['/api/v1/inexistente','/assets/inexistente.js','/src/app.js','/.env']) {
    const result = await request(server).get(url).expect(404);
    expect(result.body.error.code).toBe('ROTA_NAO_ENCONTRADA');
  }
});
test('API pode executar sem build do frontend e POST nunca devolve a página', async () => {
  await request(app(path.join(directory,'ausente'))).get('/').expect(404);
  await request(app()).post('/').expect(404);
});
