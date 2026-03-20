const jwt = require('jsonwebtoken');
const findByUsername = require('../../repositories/auth/findByUsernameRepo');
const getJwtSecret = require('../../repositories/auth/getJwtSecretRepo');

module.exports = async (username, password) => {
  const user = await findByUsername(username);
  if (!user || user.password !== password) return null;
  const secret = await getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  const token = jwt.sign({ userId: user.id, role: user.role, clientId: user.client_id || null }, secret, { expiresIn: '7d' });
  return { token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role, client_id: user.client_id || null } };
};
