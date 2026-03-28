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
  };
}

async function signAccessToken(user) {
  const secret = await getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ userId: user.id, role: user.role, clientId: user.client_id || null }, secret, { expiresIn: '7d' });
}

module.exports = {
  buildUserPayload,
  signAccessToken,
};
