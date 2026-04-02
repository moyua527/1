require('dotenv').config();
const express = require('express');
const logger = require('./config/logger');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const MySQLRateLimitStore = require('./atomic/utils/MySQLRateLimitStore');
const cookieParser = require('cookie-parser');
const path = require('path');
const routes = require('./atomic/routes');

const app = express();
app.set('trust proxy', 1);

// Helmet 安全响应头
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS 白名单（支持 CORS_ORIGINS 环境变量扩展，逗号分隔）
const DEFAULT_ORIGINS = [
  'http://localhost:1300',
  'http://127.0.0.1:1300',
  'http://160.202.253.143:8080',
  'http://160.202.253.143:1800',
];
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).concat(DEFAULT_ORIGINS)
  : DEFAULT_ORIGINS;
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    logger.warn(`CORS blocked origin: ${origin}`);
    cb(new Error('CORS not allowed'), false);
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// CSRF 防护（Double Submit Cookie）
const { csrfTokenProvider, csrfProtection } = require('./atomic/middleware/csrf');
app.use('/api', csrfTokenProvider);
app.use('/api', csrfProtection);

// 全局 API 速率限制：每 IP 每 15 分钟最多 600 次（MySQL 持久化存储）
const rlOpts = { validate: { xForwardedForHeader: false } };
app.use('/api', rateLimit({ ...rlOpts, windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false, store: new MySQLRateLimitStore(15 * 60 * 1000), message: { success: false, message: '请求过于频繁，请稍后再试' } }));

// 登录接口严格限速：每 IP 每 15 分钟最多 10 次
app.use('/api/auth/login', rateLimit({ ...rlOpts, windowMs: 15 * 60 * 1000, max: 10, store: new MySQLRateLimitStore(15 * 60 * 1000), message: { success: false, message: '登录尝试过多，请 15 分钟后再试' } }));
app.use('/api/auth/register', rateLimit({ ...rlOpts, windowMs: 60 * 60 * 1000, max: 5, store: new MySQLRateLimitStore(60 * 60 * 1000), message: { success: false, message: '注册尝试过多，请 1 小时后再试' } }));

// 验证码/找回密码 端点级限速
app.use('/api/auth/send-code', rateLimit({ ...rlOpts, windowMs: 60 * 1000, max: 3, keyGenerator: (req) => req.body?.target || req.ip, store: new MySQLRateLimitStore(60 * 1000), message: { success: false, message: '发送过于频繁，请稍后再试' } }));
app.use('/api/auth/forgot-password', rateLimit({ ...rlOpts, windowMs: 15 * 60 * 1000, max: 5, store: new MySQLRateLimitStore(15 * 60 * 1000), message: { success: false, message: '操作过于频繁，请稍后再试' } }));
app.use('/api/auth/reset-password', rateLimit({ ...rlOpts, windowMs: 15 * 60 * 1000, max: 5, store: new MySQLRateLimitStore(15 * 60 * 1000), message: { success: false, message: '操作过于频繁，请稍后再试' } }));

// Bot/爬虫检测
app.use('/api', require('./atomic/middleware/antiBot'));

// XSS 输入过滤
app.use('/api', require('./atomic/middleware/xssMiddleware'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 请求ID + 响应计时
const crypto = require('crypto');
app.use('/api', (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-Id', req.requestId);
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = ms > 2000 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms [${req.requestId}]`);
  });
  next();
});
app.use('/api', require('./atomic/middleware/auditMiddleware'));
app.use('/api', routes);

app.use(require('./atomic/middleware/errorHandler'));

module.exports = app;
