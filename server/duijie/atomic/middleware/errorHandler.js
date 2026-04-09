const logger = require('../../config/logger');
const Sentry = require('../../config/sentry');

module.exports = (err, req, res, _next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code && { code: err.code }),
    });
  }

  Sentry.captureException(err, { extra: { path: req.originalUrl, method: req.method, userId: req.userId } });
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack, path: req.originalUrl, method: req.method });

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
  res.status(statusCode).json({ success: false, message, code: 50001 });
};
