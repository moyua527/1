const db = require('../../../config/db');

module.exports = async (id) => {
  const [rows] = await db.query(
    `SELECT c.*, a.nickname as assigned_name, a.username as assigned_username
     FROM duijie_clients c LEFT JOIN voice_users a ON a.id = c.assigned_to
     WHERE c.id = ? AND c.is_deleted = 0`, [id]);
  return rows[0] || null;
};
