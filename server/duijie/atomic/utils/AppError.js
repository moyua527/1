class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

AppError.badRequest = (msg) => new AppError(msg, 400);
AppError.notFound = (msg = '资源不存在') => new AppError(msg, 404);
AppError.forbidden = (msg = '无权限') => new AppError(msg, 403);
AppError.unauthorized = (msg = '请先登录') => new AppError(msg, 401);

module.exports = AppError;
