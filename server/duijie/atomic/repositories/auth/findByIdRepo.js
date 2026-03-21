const db = require('../../../config/db');

module.exports = async (id) => {
  const [rows] = await db.query(
    'SELECT id, username, nickname, email, phone, avatar, role, client_id, display_id, gender, area_code, personal_invite_code, invited_by, created_at FROM voice_users WHERE id = ? AND is_deleted = 0',
    [id]
  );
  return rows[0] || null;
};
