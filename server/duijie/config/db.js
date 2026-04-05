require('dotenv').config();
const mysql = require('mysql2/promise');

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00',
};

// 启用 DB SSL（当 DB_SSL=true 时）
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
}

const pool = mysql.createPool(poolConfig);

pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+08:00'");
});

module.exports = pool;
