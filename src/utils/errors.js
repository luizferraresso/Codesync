'use strict';
class ApiError extends Error {
  constructor(status, code, message, auditCode = code) {
    super(message);
    this.status = status;
    this.code = code;
    this.auditCode = auditCode;
  }
}
const fail = (status, code, message, auditCode) => { throw new ApiError(status, code, message, auditCode); };
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
module.exports = { ApiError, fail, asyncHandler };
