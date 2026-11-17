'use strict';
const { ApiError } = require('../utils/errors');
const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) {
    const documentIssue = parsed.error.issues.find(issue => ['cpf','cnpj'].includes(issue.path[0]));
    if (documentIssue) res.locals.auditInvalidDocument = documentIssue.path[0];
    return next(new ApiError(422, 'DADOS_INVALIDOS',
      parsed.error.issues.map(x => `${x.path.join('.')}: ${x.message}`).join('; ').slice(0,500)));
  }
  req[source] = parsed.data;
  next();
};
module.exports = validate;
