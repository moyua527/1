require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
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

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', (req, res, next) => {
  console.log(`[duijie] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/api', routes);

server.listen(PORT, () => {
  console.log(`[duijie] 后端服务启动: http://localhost:${PORT}`);
});
