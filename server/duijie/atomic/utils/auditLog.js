const db = require('../../config/db');

/**
 * 记录审计日志
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.username
 * @param {string} params.action - create, update, delete, login, logout, etc.
 * @param {string} params.entityType - project, task, client, ticket, user, etc.
 * @param {number} [params.entityId]
 * @param {string} [params.detail]
 * @param {string} [params.ip]
 */
async function auditLog({ userId, username, action, entityType, entityId, detail, ip }) {
  try {
    await db.query(
      'INSERT INTO duijie_audit_logs (user_id, username, action, entity_type, entity_id, detail, ip) VALUES (?,?,?,?,?,?,?)',
      [userId || null, username || '', action, entityType || null, entityId || null, detail || null, ip || null]
    );
  } catch (e) {
    console.error('[auditLog] Failed:', e.message);
  }
}

module.exports = { auditLog };
