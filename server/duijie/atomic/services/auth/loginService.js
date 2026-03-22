const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../../config/db');
const findByUsername = require('../../repositories/auth/findByUsernameRepo');
const getJwtSecret = require('../../repositories/auth/getJwtSecretRepo');

module.exports = async (username, password) => {
  const user = await findByUsername(username);
  if (!user) return null;
  const isMatch = user.password.startsWith('$2') ? await bcrypt.compare(password, user.password) : (user.password === password);
  if (!isMatch) return null;
  if (user.is_active === 0) return { disabled: true };
  const secret = await getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  db.query('UPDATE voice_users SET last_login_at = NOW() WHERE id = ?', [user.id]).catch(() => {});
  const token = jwt.sign({ userId: user.id, role: user.role, clientId: user.client_id || null }, secret, { expiresIn: '7d' });
  return { token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role, client_id: user.client_id || null } };
};
