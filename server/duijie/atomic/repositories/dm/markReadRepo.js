const db = require('../../../config/db');

module.exports = async (senderId, receiverId) => {
  await db.query(
    'UPDATE duijie_direct_messages SET read_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL',
    [senderId, receiverId]
  );
};
