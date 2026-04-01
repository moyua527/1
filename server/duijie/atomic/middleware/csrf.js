const crypto = require('crypto');
const logger = require('../../config/logger');

/**
 * CSRF 防护中间件
 * 
 * 策略：Double Submit Cookie + SameSite
 * - 对每个会话生成一个 CSRF token，通过 cookie 下发
 * - 前端在写操作时需要在 X-CSRF-Token header 中携带该 token
 * - 后端对比 cookie 中的 token 和 header 中的 token
 * 
 * 豁免：
 * - GET/HEAD/OPTIONS 请求（安全方法）
 * - 使用 Bearer Token 认证的请求（API 调用，非 cookie 认证）
 * - 合作方开放接口（使用 X-API-Key 认证）
 * - 公开接口（登录/注册/验证码等）
 */

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const TOKEN_LENGTH = 32;

// 不需要 CSRF 保护的路径
const EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/send-code',
  '/api/auth/login-by-code',
  '/api/auth/verify-code',
  '/api/auth/register-config',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/logout',
  '/api/auth/2fa/login/verify',
  '/api/open/',          // 合作方开放接口使用 X-API-Key
  '/api/health',
];

// 安全的 HTTP 方法不需要 CSRF 保护
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function generateToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

function isExempt(req) {
  // 安全方法
  if (SAFE_METHODS.includes(req.method)) return true;

  // 使用 Bearer Token 的请求（非 cookie 认证）
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return true;

  // 使用 API Key 的请求
  if (req.headers['x-api-key']) return true;

  // 豁免路径
  const path = req.originalUrl.split('?')[0];
  return EXEMPT_PATHS.some(p => path === p || path.startsWith(p));
}

/**
 * CSRF Token 下发中间件
 * 每个请求都确保 cookie 中有 CSRF token
 */
function csrfTokenProvider(req, res, next) {
  if (!req.cookies[CSRF_COOKIE]) {
    const token = generateToken();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,     // 前端 JS 需要读取
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,  // 24 小时
    });
    req._csrfToken = token;
  } else {
    req._csrfToken = req.cookies[CSRF_COOKIE];
  }
  next();
}

/**
 * CSRF 验证中间件
 * 对写操作验证 header 中的 token 与 cookie 中的 token 一致
 */
function csrfProtection(req, res, next) {
  if (isExempt(req)) return next();

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken) {
    logger.warn(`CSRF token missing: ${req.method} ${req.originalUrl} ip=${req.ip}`);
    return res.status(403).json({ success: false, message: '安全验证失败，请刷新页面重试' });
  }

  if (cookieToken !== headerToken) {
    logger.warn(`CSRF token mismatch: ${req.method} ${req.originalUrl} ip=${req.ip}`);
    return res.status(403).json({ success: false, message: '安全验证失败，请刷新页面重试' });
  }

  next();
}

module.exports = { csrfTokenProvider, csrfProtection };
