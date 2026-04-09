const db = require('../../config/db');
const logger = require('../../config/logger');
const { parseDeviceName } = require('./authToken');

async function recordLogin(userId, { loginType = 'password', ip, userAgent, status = 'success', failReason = null } = {}) {
  try {
    const deviceName = userAgent ? parseDeviceName(userAgent) : null;
    await db.query(
      'INSERT INTO duijie_login_logs (user_id, login_type, ip, user_agent, device_name, status, fail_reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, loginType, ip || null, (userAgent || '').slice(0, 500), deviceName, status, failReason]
    );
  } catch (e) {
    logger.error(`[loginLog] ${e.message}`);
  }
}

module.exports = { recordLogin };
