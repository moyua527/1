const db = require('../../../config/db');

async function findMyEnterprises(userId) {
  const [rows] = await db.query(
    `SELECT c.*,
       CASE WHEN c.user_id = ? THEN 'creator' ELSE COALESCE(m.role, 'member') END as member_role,
       CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_owner,
       m.enterprise_role_id
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

async function canManage(ent, userId) {
  if (!ent) return false;
  if (ent.member_role === 'creator') return true;
  if (!ent.enterprise_role_id) return false;
  const [rows] = await db.query('SELECT can_manage_members FROM enterprise_roles WHERE id = ? AND is_deleted = 0', [ent.enterprise_role_id]);
  return rows[0]?.can_manage_members === 1;
}

function isCreator(ent) { return ent && ent.member_role === 'creator'; }

async function getEnterprisePerms(userId) {
  const ent = await findActiveEnterprise(userId);
  if (!ent) return null;
  if (isCreator(ent)) {
    return { is_creator: true, can_manage_members: true, can_manage_roles: true, can_create_project: true, can_edit_project: true, can_delete_project: true, can_manage_client: true, can_view_report: true, can_manage_task: true };
  }
  if (!ent.enterprise_role_id) {
    return { is_creator: false, can_manage_members: false, can_manage_roles: false, can_create_project: false, can_edit_project: false, can_delete_project: false, can_manage_client: false, can_view_report: false, can_manage_task: false };
  }
  const [rows] = await db.query('SELECT * FROM enterprise_roles WHERE id = ? AND is_deleted = 0', [ent.enterprise_role_id]);
  if (!rows[0]) return { is_creator: false, can_manage_members: false, can_manage_roles: false, can_create_project: false, can_edit_project: false, can_delete_project: false, can_manage_client: false, can_view_report: false, can_manage_task: false };
  const r = rows[0];
  return {
    is_creator: false,
    can_manage_members: !!r.can_manage_members, can_manage_roles: !!r.can_manage_roles,
    can_create_project: !!r.can_create_project, can_edit_project: !!r.can_edit_project,
    can_delete_project: !!r.can_delete_project, can_manage_client: !!r.can_manage_client,
    can_view_report: !!r.can_view_report, can_manage_task: !!r.can_manage_task,
  };
}

module.exports = { findMyEnterprises, findActiveEnterprise, canManage, isCreator, getEnterprisePerms };
