class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 错误码常量 */
AppError.Codes = {
  VALIDATION_ERROR:         40001,
  DUPLICATE_ENTRY:          40002,
  UNAUTHORIZED:             40101,
  TOKEN_EXPIRED:            40102,
  FORBIDDEN:                40301,
  NOT_FOUND:                40401,
  RESOURCE_CONFLICT:        40901,
  VERSION_CONFLICT:         40902,
  INVALID_STATE_TRANSITION: 42201,
  INTERNAL_ERROR:           50001,
};

AppError.badRequest    = (msg = '请求参数有误')             => new AppError(msg, 400, AppError.Codes.VALIDATION_ERROR);
AppError.duplicate     = (msg = '数据已存在')               => new AppError(msg, 400, AppError.Codes.DUPLICATE_ENTRY);
AppError.notFound      = (msg = '资源不存在')               => new AppError(msg, 404, AppError.Codes.NOT_FOUND);
AppError.forbidden     = (msg = '无权限')                   => new AppError(msg, 403, AppError.Codes.FORBIDDEN);
AppError.unauthorized  = (msg = '请先登录')                 => new AppError(msg, 401, AppError.Codes.UNAUTHORIZED);
AppError.conflict      = (msg = '资源冲突')                 => new AppError(msg, 409, AppError.Codes.RESOURCE_CONFLICT);
AppError.versionConflict = (msg = '数据已被修改，请刷新后重试') => new AppError(msg, 409, AppError.Codes.VERSION_CONFLICT);
AppError.invalidTransition = (from, to) => new AppError(`不允许从 ${from} 转移到 ${to}`, 422, AppError.Codes.INVALID_STATE_TRANSITION);

module.exports = AppError;
