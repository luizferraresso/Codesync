'use strict';

const router = require('express').Router();
const { z } = require('zod');
const schemas = require('../validators/schemas');
const validate = require('../middlewares/validate');
const { requireAuth, allowRoles } = require('../middlewares/auth');
const controller = require('../controllers/guide-approval.controller');

router.use(requireAuth, allowRoles('ADMIN'));

router.get(
  '/guias/pendentes',
  validate(schemas.pagination, 'query'),
  controller.listPending
);

router.get(
  '/guias/:id',
  validate(z.object({ id: schemas.bigintId }), 'params'),
  controller.get
);

router.patch(
  '/guias/:id/aprovar',
  validate(z.object({ id: schemas.bigintId }), 'params'),
  controller.approve
);

router.patch(
  '/guias/:id/reprovar',
  validate(z.object({ id: schemas.bigintId }), 'params'),
  validate(schemas.guideReject),
  controller.reject
);

module.exports = router;
