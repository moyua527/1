const db = require('../../../config/db');

module.exports = async (msgId) => {
  await db.query(
    'UPDATE duijie_direct_messages SET content = ?, is_recalled = 1 WHERE id = ?',
    ['[消息已撤回]', msgId]
  );
};
