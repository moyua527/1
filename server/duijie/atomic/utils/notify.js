const db = require('../../config/db');
const { getIO } = require('../../socket');
const logger = require('../../config/logger');
const { sendMobilePush } = require('./mobilePush');

const TYPE_TO_CATEGORY = {
  project_member: 'project', project_update: 'project',
  task_assigned: 'task', task_status: 'task', task_comment: 'task',
  join_request: 'approval', join_approved: 'approval', join_rejected: 'approval', join_via_code: 'approval',
  client_request: 'approval', client_request_approved: 'approval', client_request_rejected: 'approval',
  ticket_reply: 'system', follow_reminder: 'system',
  security: 'security',
};

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
  const category = TYPE_TO_CATEGORY[type] || 'system';
  try {
    const [result] = await db.query(
      'INSERT INTO duijie_notifications (user_id, type, title, content, link, category) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, title, content || '', link || null, category]
    );
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('new_notification', {
        id: result.insertId, user_id: userId, type, category, title, content: content || '', link: link || null, is_read: 0, created_at: new Date().toISOString()
      });
    }
    await sendMobilePush(userId, { title, body: content || '', link: link || null, type, category });
  } catch (e) {
    logger.error(`notify failed: ${e.message}`);
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
