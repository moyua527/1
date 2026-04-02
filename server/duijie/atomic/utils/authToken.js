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
  };
}

async function signAccessToken(user) {
  const secret = await getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  // access token 有效期 2 小时（之前是 7 天）
  return jwt.sign({ userId: user.id, role: user.role, clientId: user.client_id || null }, secret, { expiresIn: '2h' });
}

/**
 * 生成 refresh token 并持久化到数据库
 * 有效期 30 天，支持令牌轮转（每次刷新生成新的）
 */
async function createRefreshToken(userId) {
  const raw = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 天

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );

  return raw; // 返回原始 token 给客户端
}

/**
 * 验证并轮转 refresh token
 * 旧 token 立即作废，生成新 token
 */
async function rotateRefreshToken(rawToken) {
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
  const newRaw = await createRefreshToken(row.user_id);

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
};
