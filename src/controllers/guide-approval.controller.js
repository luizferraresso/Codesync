'use strict';

const service = require('../services/guide-approval.service');
const { asyncHandler } = require('../utils/errors');

module.exports = {
  listPending: asyncHandler(async (req, res) => {
    const data = await service.listPending(req.query);
    res.json({ data });
  }),

  get: asyncHandler(async (req, res) => {
    const data = await service.get(req.params.id);
    res.json({ data });
  }),

  approve: asyncHandler(async (req, res) => {
    const data = await service.approve(req.user, req.params.id);

    res.locals.auditReasonOverride = 'Cadastro de guia aprovado por administrador';

    res.json({ data });
  }),

  reject: asyncHandler(async (req, res) => {
    const data = await service.reject(
      req.user,
      req.params.id,
      req.body.motivo_reprovacao
    );

    res.locals.auditReasonOverride = req.body.motivo_reprovacao;

    res.json({ data });
  })
};
