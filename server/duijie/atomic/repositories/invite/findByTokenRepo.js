const db = require('../../../config/db');

module.exports = async (token) => {
  const [rows] = await db.query(
    `SELECT il.id, il.preset_role, il.expires_at, il.created_at,
            u.nickname AS inviter_name, u.avatar AS inviter_avatar
     FROM duijie_invite_links il
     LEFT JOIN voice_users u ON u.id = il.created_by
     WHERE il.token = ? AND il.used_by IS NULL AND (il.expires_at IS NULL OR il.expires_at > NOW())`,
    [token]
  );
  return rows.length > 0 ? rows[0] : null;
};
