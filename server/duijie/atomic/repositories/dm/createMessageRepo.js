const db = require('../../../config/db');

module.exports = async (senderId, receiverId, content) => {
  const [result] = await db.query(
    'INSERT INTO duijie_direct_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
    [senderId, receiverId, content]
  );
  return result.insertId;
};
