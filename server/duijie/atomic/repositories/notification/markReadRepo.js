const db = require('../../../config/db');

module.exports = async (id, userId) => {
  if (id === 'all') {
    await db.query('UPDATE duijie_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
  } else {
    await db.query('UPDATE duijie_notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
  }
};
