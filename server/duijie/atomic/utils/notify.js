const db = require('../../config/db');

/**
 * 发送通知给指定用户
 * @param {number} userId - 接收通知的用户ID
 * @param {string} type - 通知类型: task_assigned, task_status, ticket_reply, project_member, follow_reminder
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @param {string} [link] - 可选的跳转链接
 */
async function notify(userId, type, title, content, link) {
  if (!userId) return;
  try {
    await db.query(
      'INSERT INTO duijie_notifications (user_id, type, title, content, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, content || '', link || null]
    );
  } catch (e) {
    console.error('[notify] Failed:', e.message);
  }
}

/**
 * 批量发送通知给多个用户
 */
async function notifyMany(userIds, type, title, content, link) {
  for (const uid of userIds) {
    await notify(uid, type, title, content, link);
  }
}

module.exports = { notify, notifyMany };
