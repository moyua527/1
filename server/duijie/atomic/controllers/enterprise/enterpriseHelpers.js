const crypto = require('crypto');
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
  if (ent.member_role === 'creator' || ent.member_role === 'admin') return true;
  if (!ent.enterprise_role_id) return false;
  const [rows] = await db.query('SELECT can_manage_members FROM enterprise_roles WHERE id = ? AND is_deleted = 0', [ent.enterprise_role_id]);
  return rows[0]?.can_manage_members === 1;
}

async function generateJoinCode() {
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    const [rows] = await db.query('SELECT id FROM duijie_clients WHERE join_code = ? AND is_deleted = 0 LIMIT 1', [code]);
    if (!rows[0]) return code;
  }
  throw new Error('生成企业推荐码失败');
}

async function getEnterpriseManagerUserIds(clientId, excludeUserId = null) {
  const [rows] = await db.query(
    `SELECT DISTINCT m.user_id
     FROM duijie_client_members m
     LEFT JOIN enterprise_roles er ON er.id = m.enterprise_role_id AND er.is_deleted = 0
     WHERE m.client_id = ?
       AND m.is_deleted = 0
       AND m.user_id IS NOT NULL
       AND (m.role IN ('creator', 'admin') OR er.can_manage_members = 1)`,
    [clientId]
  );
  return rows.map(r => r.user_id).filter(id => id && id !== excludeUserId);
}

function isCreator(ent) { return ent && ent.member_role === 'creator'; }

const ENTERPRISE_PERM_KEYS = ['can_manage_members', 'can_approve_join', 'can_manage_roles', 'can_create_project', 'can_delete_project', 'can_view_report', 'can_manage_app', 'can_manage_department', 'can_edit_enterprise'];

function allEnterprisePerms(val) {
  const obj = { is_creator: false };
  ENTERPRISE_PERM_KEYS.forEach(k => { obj[k] = val; });
  return obj;
}

async function getEnterprisePerms(userId) {
  const ent = await findActiveEnterprise(userId);
  if (!ent) return null;
  if (isCreator(ent)) {
    return { ...allEnterprisePerms(true), is_creator: true };
  }
  if (ent.member_role === 'admin') {
    return allEnterprisePerms(true);
  }
  if (!ent.enterprise_role_id) {
    return allEnterprisePerms(false);
  }
  const [rows] = await db.query('SELECT * FROM enterprise_roles WHERE id = ? AND is_deleted = 0', [ent.enterprise_role_id]);
  if (!rows[0]) return allEnterprisePerms(false);
  const r = rows[0];
  const obj = { is_creator: false };
  ENTERPRISE_PERM_KEYS.forEach(k => { obj[k] = !!r[k]; });
  return obj;
}

module.exports = { findMyEnterprises, findActiveEnterprise, canManage, isCreator, getEnterprisePerms, generateJoinCode, getEnterpriseManagerUserIds };
