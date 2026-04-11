const db = require('../../config/db');

async function logActivity(projectId, userId, type, { entityType, entityId, title, detail } = {}) {
  try {
    await db.query(
      `INSERT INTO duijie_project_activities (project_id, user_id, type, entity_type, entity_id, title, detail)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, userId, type, entityType || null, entityId || null, title || null, detail ? JSON.stringify(detail) : null]
    );
  } catch (e) {
    console.error('activityLogger error:', e.message);
  }
}

module.exports = { logActivity };
