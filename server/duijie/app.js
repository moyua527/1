require('dotenv').config();
require('./config/sentry');
const express = require('express');
const logger = require('./config/logger');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const RedisRateLimitStore = require('./atomic/utils/RedisRateLimitStore');
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
  'http://localhost',
  'capacitor://localhost',
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

// 全局 API 速率限制：每 IP 每 15 分钟最多 600 次（Redis 持久化存储）
const rlOpts = { validate: { xForwardedForHeader: false } };
app.use('/api', rateLimit({ ...rlOpts, windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false, store: new RedisRateLimitStore(15 * 60 * 1000), message: { success: false, message: '请求过于频繁，请稍后再试' } }));


// Bot/爬虫检测
app.use('/api', require('./atomic/middleware/antiBot'));

// XSS 输入过滤
app.use('/api', require('./atomic/middleware/xssMiddleware'));

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

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
