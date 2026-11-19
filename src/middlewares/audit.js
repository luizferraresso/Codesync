'use strict';

const audit = require('../services/audit.service');
const auditReason = require('../utils/audit-reason');

function auditMiddleware(req, res, next) {
  // req.originalUrl preserva o caminho completo, inclusive em sub-roteadores.
  const fullPath = req.originalUrl.split('?')[0];

  res.on('finish', () => {
    if (fullPath === '/health') return;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return;
    }

    const segments = fullPath.split('/').filter(Boolean);
    const isAdminGuideRoute =
      segments[2] === 'admin' && segments[3] === 'guias';

    const resource = isAdminGuideRoute
      ? 'guias'
      : (segments[2] || 'unknown');

    let action;
    let entity;
    let recordId;

    if (isAdminGuideRoute) {
      const operation = segments[5];

      action = operation === 'aprovar'
        ? 'GUIA_APROVACAO'
        : operation === 'reprovar'
          ? 'GUIA_REPROVACAO'
          : 'GUIA_ADMINISTRACAO';

      entity = 'GUIA';
      recordId = /^\d+$/.test(segments[4] || '')
        ? segments[4]
        : null;
    } else {
      action = resource === 'hoteis' && segments[4] === 'gestores'
        ? (req.method === 'DELETE'
          ? 'DESVINCULO_GESTOR'
          : 'VINCULO_GESTOR')
        : resource === 'auth'
          ? ({
            login: 'AUTENTICACAO',
            register: 'CADASTRO',
            password: 'ALTERACAO_SENHA'
          }[segments[3]] || 'AUTH_' + req.method)
          : `${resource.toUpperCase()}_${req.method}`;

      entity = resource.toUpperCase();
      recordId = /^\d+$/.test(segments[3] || '')
        ? segments[3]
        : null;
    }

    const result = res.statusCode < 400
      ? 'SUCESSO'
      : (res.statusCode === 401 || res.statusCode === 403
        ? 'NEGADO'
        : 'FALHA');

    const reason = res.locals.auditReasonOverride ||
      auditReason(action, res.statusCode, {
        code: res.locals.auditErrorCode,
        invalidDocument: res.locals.auditInvalidDocument
      });

    void audit.record({
      userId: req.user?.id_usuario || null,
      profile: req.user?.tipo_usuario || null,
      action,
      operation: req.method,
      entity,
      recordId,
      result,
      reason,
      ip: req.ip,
      details: {
        method: req.method,
        route: isAdminGuideRoute
          ? '/api/v1/admin/guias'
          : '/api/v1/' + resource,
        httpStatus: res.statusCode
      }
    });
  });

  next();
}

module.exports = auditMiddleware;