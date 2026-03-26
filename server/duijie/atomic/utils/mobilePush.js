const axios = require('axios');
const db = require('../../config/db');
const logger = require('../../config/logger');

async function getConfigValue(key) {
  const [rows] = await db.query('SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1', [key]);
  return rows[0]?.config_value || '';
}

async function deactivateInvalidTokens(tokens = []) {
  if (!tokens.length) return;
  await db.query(`UPDATE duijie_device_tokens SET is_active = 0 WHERE device_token IN (${tokens.map(() => '?').join(',')})`, tokens);
}

async function sendMobilePush(userId, payload = {}) {
  try {
    const serverKey = await getConfigValue('FCM_SERVER_KEY');
    if (!serverKey) return;

    const [tokens] = await db.query(
      "SELECT device_token, platform FROM duijie_device_tokens WHERE user_id = ? AND is_active = 1 AND platform IN ('android', 'ios')",
      [userId]
    );
    if (!tokens.length) return;

    const registrationIds = tokens.map(t => t.device_token).filter(Boolean);
    if (!registrationIds.length) return;

    const response = await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      {
        registration_ids: registrationIds,
        priority: 'high',
        notification: {
          title: payload.title || '新通知',
          body: payload.body || '',
        },
        data: {
          link: payload.link || '',
          type: payload.type || '',
          category: payload.category || '',
        },
      },
      {
        headers: {
          Authorization: `key=${serverKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const invalid = [];
    const results = response.data?.results || [];
    results.forEach((r, idx) => {
      if (r?.error === 'NotRegistered' || r?.error === 'InvalidRegistration') invalid.push(registrationIds[idx]);
    });
    if (invalid.length) await deactivateInvalidTokens(invalid);
  } catch (e) {
    logger.error(`mobile push failed: ${e.message}`);
  }
}

module.exports = { sendMobilePush };
