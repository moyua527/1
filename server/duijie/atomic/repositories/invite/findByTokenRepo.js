const db = require('../../../config/db');

module.exports = async (token) => {
  const [rows] = await db.query(
    'SELECT id, preset_role, expires_at FROM duijie_invite_links WHERE token = ? AND used_by IS NULL AND (expires_at IS NULL OR expires_at > NOW())',
    [token]
  );
  return rows.length > 0 ? rows[0] : null;
};
