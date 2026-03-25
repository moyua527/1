const db = require('../../../config/db');

async function findMyEnterprises(userId) {
  const [rows] = await db.query(
    `SELECT c.*,
       CASE WHEN c.user_id = ? THEN 'creator' ELSE COALESCE(m.role, 'member') END as member_role,
       CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_owner
     FROM duijie_clients c
     LEFT JOIN duijie_client_members m ON m.client_id = c.id AND m.user_id = ? AND m.is_deleted = 0
     WHERE c.client_type = 'company' AND c.is_deleted = 0
       AND (c.user_id = ? OR m.id IS NOT NULL)
     ORDER BY CASE WHEN c.user_id = ? THEN 0 ELSE 1 END, c.created_at ASC`,
    [userId, userId, userId, userId, userId]
  );
  return rows;
}

async function findActiveEnterprise(userId) {
  const enterprises = await findMyEnterprises(userId);
  if (enterprises.length === 0) return null;
  const [userRow] = await db.query('SELECT active_enterprise_id FROM voice_users WHERE id = ?', [userId]);
  const activeId = userRow[0]?.active_enterprise_id;
  if (activeId) {
    const active = enterprises.find(e => e.id === activeId);
    if (active) return active;
  }
  return enterprises[0];
}

function canManage(ent) { return ent && (ent.member_role === 'creator' || ent.member_role === 'admin'); }
function isCreator(ent) { return ent && ent.member_role === 'creator'; }

module.exports = { findMyEnterprises, findActiveEnterprise, canManage, isCreator };
