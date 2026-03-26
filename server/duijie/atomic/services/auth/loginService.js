const bcrypt = require('bcryptjs');
const db = require('../../../config/db');
const findByUsername = require('../../repositories/auth/findByUsernameRepo');
const { buildUserPayload, signAccessToken, signTwoFactorChallenge } = require('../../utils/authToken');

module.exports = async (username, password) => {
  const user = await findByUsername(username);
  if (!user) return null;
  const isMatch = user.password.startsWith('$2') ? await bcrypt.compare(password, user.password) : (user.password === password);
  if (!isMatch) return null;
  if (user.is_active === 0) return { disabled: true };
  if (user.totp_enabled === 1 && user.totp_secret) {
    const challengeToken = await signTwoFactorChallenge(user);
    return { require2FA: true, challengeToken, user: buildUserPayload(user) };
  }
  db.query('UPDATE voice_users SET last_login_at = NOW() WHERE id = ?', [user.id]).catch(() => {});
  const token = await signAccessToken(user);
  return { token, user: buildUserPayload(user) };
};
