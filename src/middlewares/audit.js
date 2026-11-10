
'use strict';

const audit = require('../services/audit.service');

function auditMiddleware(req, res, next) {
  const fullPath = req.originalUrl.split('?')[0];
  res.on('finish', () => {
    if (fullPath === '/health') return;
    if (!['POST','PUT','PATCH','DELETE'].includes(req.method)) return;
    const segments = fullPath.split('/').filter(Boolean);
    const resource = segments[2] || 'unknown';

    let action;

    if (resource === 'auth') {
      if (segments[3] === 'login') {
        action = 'AUTENTICACAO';
      } else if (segments[3] === 'register') {
        action = 'CADASTRO';
      } else if (segments[3] === 'password') {
        action = 'ALTERACAO_SENHA';
      } else {
        action = `AUTH_${req.method}`;
      }
    } else {
      action = `${resource.toUpperCase()}_${req.method}`;
    }

    const result = res.statusCode < 400
      ? 'SUCESSO'
      : [401, 403].includes(res.statusCode)
        ? 'NEGADO'
        : 'FALHA';

    void audit.record({
      userId: req.user?.id_usuario ?? null,
      profile: req.user?.tipo_usuario ?? null,
      action,
      operation: req.method,
      entity: resource.toUpperCase(),
      recordId: /^\d+$/.test(segments[3] || '')
        ? segments[3]
        : null,
      result,
      ip: req.ip,
      details: {
        method: req.method,
        route: '/api/v1/' + resource,
        httpStatus: res.statusCode
      }
    });
  });

  next();
}

module.exports = auditMiddleware;
