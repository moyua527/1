const path = require('path');
const db = require('../../config/db');
const logger = require('../../config/logger');

let adminApp = null;

function getAdmin() {
  if (adminApp) return adminApp;
  try {
    const admin = require('firebase-admin');
    const keyPath = path.resolve(__dirname, '../../firebase-admin-key.json');
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(keyPath),
    });
    return adminApp;
  } catch (e) {
    logger.error(`Firebase Admin init failed: ${e.message}`);
    return null;
  }
}

async function deactivateInvalidTokens(tokens = []) {
  if (!tokens.length) return;
  await db.query(`UPDATE duijie_device_tokens SET is_active = 0 WHERE device_token IN (${tokens.map(() => '?').join(',')})`, tokens);
}

async function sendMobilePush(userId, payload = {}) {
  try {
    const app = getAdmin();
    if (!app) return;

    const [tokens] = await db.query(
      "SELECT device_token, platform FROM duijie_device_tokens WHERE user_id = ? AND is_active = 1 AND platform IN ('android', 'ios')",
      [userId]
    );
    if (!tokens.length) return;

    const registrationTokens = tokens.map(t => t.device_token).filter(Boolean);
    if (!registrationTokens.length) return;

    const messaging = require('firebase-admin').messaging();
    const message = {
      notification: {
        title: payload.title || '新通知',
        body: payload.body || '',
      },
      data: {
        link: payload.link || '',
        type: payload.type || '',
        category: payload.category || '',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
        },
      },
    };

    const invalidTokens = [];
    const results = await Promise.allSettled(
      registrationTokens.map(token =>
        messaging.send({ ...message, token }).catch(err => {
          if (err.code === 'messaging/registration-token-not-registered' ||
              err.code === 'messaging/invalid-registration-token') {
            invalidTokens.push(token);
          }
          throw err;
        })
      )
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    if (success > 0 || failed > 0) {
      logger.info(`FCM push to user ${userId}: ${success} ok, ${failed} fail`);
    }
    if (invalidTokens.length) await deactivateInvalidTokens(invalidTokens);
  } catch (e) {
    logger.error(`mobile push failed: ${e.message}`);
  }
}

module.exports = { sendMobilePush };
