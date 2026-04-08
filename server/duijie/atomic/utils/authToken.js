const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../config/db');
const getJwtSecret = require('../repositories/auth/getJwtSecretRepo');

function buildUserPayload(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    role: user.role,
    client_id: user.client_id || null,
    guide_done: user.guide_done || 0,
  };
}

async function signAccessToken(user) {
  const secret = await getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  // access token 有效期 2 小时（之前是 7 天）
  return jwt.sign({ userId: user.id, role: user.role, clientId: user.client_id || null }, secret, { expiresIn: '2h' });
}

/**
 * 从 User-Agent 解析设备名称
 */
function parseDeviceName(ua) {
  if (!ua) return '未知设备';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android[^;]*;\s*([^)]+)\)/);
    return m ? m[1].trim().split(' Build')[0] : 'Android 设备';
  }
  if (/Windows/i.test(ua)) return 'Windows 电脑';
  if (/Macintosh/i.test(ua)) return 'Mac 电脑';
  if (/Linux/i.test(ua)) return 'Linux 设备';
  return '未知设备';
}

/**
 * 生成 refresh token 并持久化到数据库
 * 有效期 30 天，支持令牌轮转（每次刷新生成新的）
 * @param {number} userId
 * @param {object} [deviceInfo] - { userAgent, ip }
 */
async function createRefreshToken(userId, deviceInfo) {
  const raw = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 天
  const ua = deviceInfo?.userAgent || null;
  const ip = deviceInfo?.ip || null;
  const deviceName = parseDeviceName(ua);

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address, device_name) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, tokenHash, expiresAt, ua ? ua.substring(0, 500) : null, ip, deviceName]
  );

  return raw; // 返回原始 token 给客户端
}

/**
 * 验证并轮转 refresh token
 * 旧 token 立即作废，生成新 token
 */
async function rotateRefreshToken(rawToken, deviceInfo) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const [[row]] = await db.query(
    'SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ? LIMIT 1',
    [tokenHash]
  );

  if (!row) return null;
  if (row.revoked_at) return null; // 已被撤销
  if (new Date(row.expires_at) < new Date()) return null; // 已过期

  // 立即作废旧 token（令牌轮转）
  await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?', [row.id]);

  // 生成新的 refresh token
  const newRaw = await createRefreshToken(row.user_id, deviceInfo);

  return { userId: row.user_id, newRefreshToken: newRaw };
}

/**
 * 撤销用户所有 refresh token（用于登出、密码修改等）
 */
async function revokeAllUserTokens(userId) {
  await db.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
    [userId]
  );
}

module.exports = {
  buildUserPayload,
  signAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeAllUserTokens,
  parseDeviceName,
};
