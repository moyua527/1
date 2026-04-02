const bcrypt = require('bcryptjs');
const db = require('../../../config/db');
const findByUsername = require('../../repositories/auth/findByUsernameRepo');
const { buildUserPayload, signAccessToken, createRefreshToken } = require('../../utils/authToken');

module.exports = async (username, password) => {
  const user = await findByUsername(username);
  if (!user) return null;
  const isMatch = user.password.startsWith('$2') ? await bcrypt.compare(password, user.password) : (user.password === password);
  if (!isMatch) return null;
  if (user.is_active === 0) return { disabled: true };
  db.query('UPDATE voice_users SET last_login_at = NOW() WHERE id = ?', [user.id]).catch(() => {});
  const token = await signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  return { token, refreshToken, user: buildUserPayload(user) };
};
