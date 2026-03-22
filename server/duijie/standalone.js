require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const routes = require('./atomic/routes');
const { initSocket } = require('./socket');
require('./listeners/projectListener');
require('./listeners/taskListener');
require('./listeners/messageListener');

const PORT = process.env.PORT || 1800;
const app = express();
const server = http.createServer(app);
initSocket(server);

// Helmet 安全响应头
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS 白名单
const ALLOWED_ORIGINS = [
  'http://localhost:1300',
  'http://127.0.0.1:1300',
  'http://160.202.253.143:8080',
  'http://160.202.253.143:1800',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(null, true); // 暂时放行未知来源但记录日志
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// 全局 API 速率限制：每 IP 每 15 分钟最多 300 次
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false, message: { success: false, message: '请求过于频繁，请稍后再试' } }));

// 登录接口严格限速：每 IP 每 15 分钟最多 10 次
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: '登录尝试过多，请 15 分钟后再试' } }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { success: false, message: '注册尝试过多，请 1 小时后再试' } }));

// XSS 输入过滤
app.use('/api', require('./atomic/middleware/xssMiddleware'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', (req, res, next) => {
  console.log(`[duijie] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/api', require('./atomic/middleware/auditMiddleware'));
app.use('/api', routes);

server.listen(PORT, () => {
  console.log(`[duijie] 后端服务启动: http://localhost:${PORT}`);
});
