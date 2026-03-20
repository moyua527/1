const mysql = require('mysql2/promise');

async function loadConfig() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'voice_room_db',
    waitForConnections: true,
    connectionLimit: 2,
  });

  try {
    const [rows] = await pool.query(
      "SELECT config_key, config_value FROM system_config WHERE config_key LIKE 'DUIJIE_%'"
    );
    const config = {};
    for (const row of rows) {
      config[row.config_key] = row.config_value;
    }
    return config;
  } finally {
    await pool.end();
  }
}

module.exports = { loadConfig };
