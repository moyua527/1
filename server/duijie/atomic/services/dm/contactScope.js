const db = require('../../../config/db');

async function findActiveEnterpriseId(userId) {
  const [[userRow]] = await db.query('SELECT active_enterprise_id FROM voice_users WHERE id = ?', [userId]);
  const activeEnterpriseId = userRow?.active_enterprise_id;
  if (!activeEnterpriseId) return null;

  const [[entRow]] = await db.query(
    `SELECT c.id
     FROM duijie_clients c
     LEFT JOIN duijie_client_members m ON m.client_id = c.id AND m.user_id = ? AND m.is_deleted = 0
     WHERE c.id = ?
       AND c.client_type = 'company'
       AND c.is_deleted = 0
       AND (c.user_id = ? OR m.id IS NOT NULL)
     LIMIT 1`,
    [userId, activeEnterpriseId, userId]
  );
  return entRow?.id || null;
}

async function getEnterpriseContactUserIds(userId) {
  const enterpriseId = await findActiveEnterpriseId(userId);
  if (!enterpriseId) return [];
  const [rows] = await db.query(
    `SELECT DISTINCT t.user_id
     FROM (
       SELECT c.user_id as user_id
       FROM duijie_clients c
       WHERE c.id = ? AND c.client_type = 'company' AND c.is_deleted = 0 AND c.user_id IS NOT NULL
       UNION
       SELECT m.user_id
       FROM duijie_client_members m
       WHERE m.client_id = ? AND m.is_deleted = 0 AND m.user_id IS NOT NULL
     ) t
     WHERE t.user_id IS NOT NULL AND t.user_id != ?`,
    [enterpriseId, enterpriseId, userId]
  );
  return rows.map(row => Number(row.user_id)).filter(Boolean);
}

async function getProjectContactUserIds(userId) {
  const [rows] = await db.query(
    `SELECT DISTINCT t.user_id
     FROM (
       SELECT p.created_by as user_id
       FROM duijie_projects p
       WHERE p.is_deleted = 0
         AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))
       UNION
       SELECT pm.user_id
       FROM duijie_project_members pm
       WHERE pm.project_id IN (
         SELECT p.id
         FROM duijie_projects p
         WHERE p.is_deleted = 0
           AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))
       )
     ) t
     WHERE t.user_id IS NOT NULL AND t.user_id != ?`,
    [userId, userId, userId, userId, userId]
  );
  return rows.map(row => Number(row.user_id)).filter(Boolean);
}

async function getAllowedContactUserIds(userId, userRole) {
  if (userRole === 'admin') return null;
  const ids = new Set();
  const enterpriseIds = await getEnterpriseContactUserIds(userId);
  const projectIds = await getProjectContactUserIds(userId);
  enterpriseIds.forEach(id => ids.add(id));
  projectIds.forEach(id => ids.add(id));
  ids.delete(Number(userId));
  return Array.from(ids);
}

async function canContactUser(userId, userRole, otherUserId) {
  if (!otherUserId || Number(otherUserId) === Number(userId)) return false;
  if (userRole === 'admin') return true;
  const allowedUserIds = await getAllowedContactUserIds(userId, userRole);
  return allowedUserIds.includes(Number(otherUserId));
}

module.exports = { getAllowedContactUserIds, canContactUser };
