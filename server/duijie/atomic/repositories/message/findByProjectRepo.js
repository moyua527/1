const db = require('../../../config/db');

module.exports = async (project_id, { before_id, limit = 30 } = {}) => {
  // 支持游标分页：传入 before_id 加载更早的消息
  let sql, params;
  if (before_id) {
    sql = 'SELECT m.*, u.nickname as sender_name FROM duijie_messages m LEFT JOIN voice_users u ON m.sender_id = u.id WHERE m.project_id = ? AND m.is_deleted = 0 AND m.id < ? ORDER BY m.id DESC LIMIT ?';
    params = [project_id, Number(before_id), Number(limit)];
  } else {
    // 初始加载：取最新的 N 条
    sql = 'SELECT m.*, u.nickname as sender_name FROM duijie_messages m LEFT JOIN voice_users u ON m.sender_id = u.id WHERE m.project_id = ? AND m.is_deleted = 0 ORDER BY m.id DESC LIMIT ?';
    params = [project_id, Number(limit)];
  }
  const [rows] = await db.query(sql, params);
  // 反转为时间正序，方便前端渲染
  return rows.reverse();
};
