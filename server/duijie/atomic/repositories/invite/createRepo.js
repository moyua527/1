const db = require('../../../config/db');

module.exports = async ({ token, preset_role, created_by, expires_at, note }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_invite_links (token, preset_role, created_by, expires_at, note) VALUES (?, ?, ?, ?, ?)',
    [token, preset_role, created_by, expires_at, note]
  );
  return result.insertId;
};
