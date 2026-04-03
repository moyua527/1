const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

const PERM_FIELDS = [
  'can_manage_members', 'can_manage_roles',
  'can_edit_project', 'can_delete_project',
  'can_manage_client', 'can_view_report', 'can_manage_task'
];

exports.list = async (req, res) => {
  try {
    const { id } = req.params;
    const [roles] = await db.query(
      'SELECT * FROM project_roles WHERE project_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC',
      [id]
    );
    const [counts] = await db.query(
      'SELECT project_role_id, COUNT(*) as cnt FROM duijie_project_members WHERE project_id = ? AND project_role_id IS NOT NULL GROUP BY project_role_id',
      [id]
    );
    const countMap = {};
    counts.forEach(r => { countMap[r.project_role_id] = r.cnt; });
    roles.forEach(r => { r.member_count = countMap[r.id] || 0; });
    res.json({ success: true, data: roles });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入角色名称' });
    const perms = {};
    PERM_FIELDS.forEach(f => { perms[f] = req.body[f] ? 1 : 0; });
    const [result] = await db.query(
      `INSERT INTO project_roles (project_id, name, color, ${PERM_FIELDS.join(', ')}, created_by)
       VALUES (?, ?, ?, ${PERM_FIELDS.map(() => '?').join(', ')}, ?)`,
      [id, name.trim(), color || '#64748b', ...PERM_FIELDS.map(f => perms[f]), req.userId]
    );
    broadcast('project', 'role_created', { id, userId: req.userId });
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id, roleId } = req.params;
    const [existing] = await db.query('SELECT * FROM project_roles WHERE id = ? AND project_id = ? AND is_deleted = 0', [roleId, id]);
    if (!existing[0]) return res.status(404).json({ success: false, message: '角色不存在' });
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入角色名称' });
    const sets = ['name = ?', 'color = ?'];
    const vals = [name.trim(), color || '#64748b'];
    PERM_FIELDS.forEach(f => { sets.push(`${f} = ?`); vals.push(req.body[f] ? 1 : 0); });
    vals.push(roleId, id);
    await db.query(`UPDATE project_roles SET ${sets.join(', ')} WHERE id = ? AND project_id = ?`, vals);
    broadcast('project', 'role_updated', { id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id, roleId } = req.params;
    const [existing] = await db.query('SELECT * FROM project_roles WHERE id = ? AND project_id = ? AND is_deleted = 0', [roleId, id]);
    if (!existing[0]) return res.status(404).json({ success: false, message: '角色不存在' });
    if (existing[0].is_default) return res.status(400).json({ success: false, message: '默认角色不可删除' });
    const [used] = await db.query('SELECT COUNT(*) as cnt FROM duijie_project_members WHERE project_role_id = ? AND project_id = ?', [roleId, id]);
    if (used[0].cnt > 0) return res.status(400).json({ success: false, message: `该角色已分配给 ${used[0].cnt} 个成员，请先取消分配` });
    await db.query('UPDATE project_roles SET is_deleted = 1 WHERE id = ?', [roleId]);
    broadcast('project', 'role_deleted', { id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.createDefaultRoles = async (projectId, createdBy) => {
  await db.query(
    `INSERT INTO project_roles (project_id, name, color, can_manage_members, can_manage_roles, can_edit_project, can_delete_project, can_manage_client, can_view_report, can_manage_task, is_default, sort_order, created_by)
     VALUES (?, '项目管理员', '#2563eb', 1, 1, 1, 1, 1, 1, 1, 1, 0, ?),
            (?, '开发者', '#059669', 0, 0, 0, 0, 0, 0, 1, 1, 1, ?),
            (?, '观察者', '#64748b', 0, 0, 0, 0, 0, 1, 0, 1, 2, ?)`,
    [projectId, createdBy, projectId, createdBy, projectId, createdBy]
  );
};
