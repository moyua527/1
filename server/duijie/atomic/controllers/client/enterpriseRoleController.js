const db = require('../../../config/db');
const { findActiveEnterprise, isCreator } = require('./enterpriseHelpers');

const PERM_FIELDS = [
  'can_manage_members', 'can_manage_roles',
  'can_create_project', 'can_edit_project', 'can_delete_project',
  'can_manage_client', 'can_view_report', 'can_manage_task'
];

async function canManageRoles(ent, userId) {
  if (isCreator(ent)) return true;
  const [rows] = await db.query(
    `SELECT er.can_manage_roles FROM duijie_client_members m
     JOIN enterprise_roles er ON er.id = m.enterprise_role_id AND er.is_deleted = 0
     WHERE m.client_id = ? AND m.user_id = ? AND m.is_deleted = 0`,
    [ent.id, userId]
  );
  return rows[0]?.can_manage_roles === 1;
}

exports.list = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const [roles] = await db.query(
      'SELECT * FROM enterprise_roles WHERE enterprise_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC',
      [ent.id]
    );
    const [counts] = await db.query(
      'SELECT enterprise_role_id, COUNT(*) as cnt FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 AND enterprise_role_id IS NOT NULL GROUP BY enterprise_role_id',
      [ent.id]
    );
    const countMap = {};
    counts.forEach(r => { countMap[r.enterprise_role_id] = r.cnt; });
    roles.forEach(r => { r.member_count = countMap[r.id] || 0; });
    res.json({ success: true, data: roles });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!(await canManageRoles(ent, req.userId))) return res.status(403).json({ success: false, message: '无权限管理角色' });
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入角色名称' });
    const perms = {};
    PERM_FIELDS.forEach(f => { perms[f] = req.body[f] ? 1 : 0; });
    const [result] = await db.query(
      `INSERT INTO enterprise_roles (enterprise_id, name, color, ${PERM_FIELDS.join(', ')}, created_by)
       VALUES (?, ?, ?, ${PERM_FIELDS.map(() => '?').join(', ')}, ?)`,
      [ent.id, name.trim(), color || '#64748b', ...PERM_FIELDS.map(f => perms[f]), req.userId]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!(await canManageRoles(ent, req.userId))) return res.status(403).json({ success: false, message: '无权限管理角色' });
    const [existing] = await db.query('SELECT * FROM enterprise_roles WHERE id = ? AND enterprise_id = ? AND is_deleted = 0', [req.params.id, ent.id]);
    if (!existing[0]) return res.status(404).json({ success: false, message: '角色不存在' });
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入角色名称' });
    const sets = ['name = ?', 'color = ?'];
    const vals = [name.trim(), color || '#64748b'];
    PERM_FIELDS.forEach(f => { sets.push(`${f} = ?`); vals.push(req.body[f] ? 1 : 0); });
    vals.push(req.params.id, ent.id);
    await db.query(`UPDATE enterprise_roles SET ${sets.join(', ')} WHERE id = ? AND enterprise_id = ?`, vals);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!(await canManageRoles(ent, req.userId))) return res.status(403).json({ success: false, message: '无权限管理角色' });
    const [existing] = await db.query('SELECT * FROM enterprise_roles WHERE id = ? AND enterprise_id = ? AND is_deleted = 0', [req.params.id, ent.id]);
    if (!existing[0]) return res.status(404).json({ success: false, message: '角色不存在' });
    if (existing[0].is_default) return res.status(400).json({ success: false, message: '默认角色不可删除' });
    const [used] = await db.query('SELECT COUNT(*) as cnt FROM duijie_client_members WHERE enterprise_role_id = ? AND client_id = ? AND is_deleted = 0', [req.params.id, ent.id]);
    if (used[0].cnt > 0) return res.status(400).json({ success: false, message: `该角色已分配给 ${used[0].cnt} 个成员，请先取消分配` });
    await db.query('UPDATE enterprise_roles SET is_deleted = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!(await canManageRoles(ent, req.userId))) return res.status(403).json({ success: false, message: '无权限分配角色' });
    const { enterprise_role_id } = req.body;
    if (enterprise_role_id) {
      const [role] = await db.query('SELECT id FROM enterprise_roles WHERE id = ? AND enterprise_id = ? AND is_deleted = 0', [enterprise_role_id, ent.id]);
      if (!role[0]) return res.status(400).json({ success: false, message: '角色不存在' });
    }
    const [member] = await db.query('SELECT * FROM duijie_client_members WHERE id = ? AND client_id = ? AND is_deleted = 0', [req.params.id, ent.id]);
    if (!member[0]) return res.status(404).json({ success: false, message: '成员不存在' });
    await db.query('UPDATE duijie_client_members SET enterprise_role_id = ? WHERE id = ?', [enterprise_role_id || null, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.createDefaultRoles = async (enterpriseId, createdBy) => {
  await db.query(
    `INSERT INTO enterprise_roles (enterprise_id, name, color, can_manage_members, can_manage_roles, can_create_project, can_edit_project, can_delete_project, can_manage_client, can_view_report, can_manage_task, is_default, sort_order, created_by)
     VALUES (?, '管理员', '#2563eb', 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, ?),
            (?, '普通成员', '#64748b', 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, ?)`,
    [enterpriseId, createdBy, enterpriseId, createdBy]
  );
};
