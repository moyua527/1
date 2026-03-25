const db = require('../../../config/db');

module.exports = async ({ username, password, nickname, role, client_id, manager_id, personal_invite_code }) => {
  const [result] = await db.query(
    'INSERT INTO voice_users (username, password, nickname, role, client_id, manager_id, personal_invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [username, password, nickname, role, client_id || null, manager_id || null, personal_invite_code]
  );
  return result.insertId;
};
