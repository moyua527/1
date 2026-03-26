const jwt = require('jsonwebtoken');
const getJwtSecret = require('../repositories/auth/getJwtSecretRepo');

function buildUserPayload(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    role: user.role,
    client_id: user.client_id || null,
    totp_enabled: !!user.totp_enabled,
  };
}

async function signAccessToken(user) {
  const secret = await getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ userId: user.id, role: user.role, clientId: user.client_id || null }, secret, { expiresIn: '7d' });
}

async function signTwoFactorChallenge(user) {
  const secret = await getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(
    { purpose: 'login_2fa', userId: user.id, role: user.role, clientId: user.client_id || null },
    secret,
    { expiresIn: '5m' }
  );
}

async function verifyTwoFactorChallenge(token) {
  const secret = await getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  const decoded = jwt.verify(token, secret);
  if (decoded.purpose !== 'login_2fa') throw new Error('Invalid challenge token');
  return decoded;
}

module.exports = {
  buildUserPayload,
  signAccessToken,
  signTwoFactorChallenge,
  verifyTwoFactorChallenge,
};
