const db = require('../../config/db');

/**
 * 递归查找用户的所有下属 ID（含自身）
 * sales_manager → 查找所有 manager_id = userId 的用户，递归
 */
module.exports = async function getSubordinateIds(userId) {
  const ids = [userId];
  const queue = [userId];
  while (queue.length > 0) {
    const current = queue.shift();
    const [rows] = await db.query(
      'SELECT id FROM voice_users WHERE manager_id = ? AND is_deleted = 0', [current]
    );
    for (const r of rows) {
      if (!ids.includes(r.id)) {
        ids.push(r.id);
        queue.push(r.id);
      }
    }
  }
  return ids;
};
