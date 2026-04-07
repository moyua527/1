const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { PROJECT_ROLE_FIELDS, ensureDefaultProjectRoles, ensureDefaultEnterpriseProjectRoles } = require('../../utils/projectRoles');

// ========== 项目级角色（兼容旧路由） ==========

exports.list = async (req, res) => {
  try {
    const { id } = req.params;
    await ensureDefaultProjectRoles(id, req.userId);
    const [roles] = await db.query(
      `SELECT * FROM project_roles
       WHERE is_deleted = 0 AND project_id = ?
       ORDER BY sort_order ASC, id ASC`,
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
    PROJECT_ROLE_FIELDS.forEach(f => { perms[f] = req.body[f] ? 1 : 0; });
    perms.can_delete_project = 0;
    const [result] = await db.query(
      `INSERT INTO project_roles (project_id, name, color, ${PROJECT_ROLE_FIELDS.join(', ')}, created_by)
       VALUES (?, ?, ?, ${PROJECT_ROLE_FIELDS.map(() => '?').join(', ')}, ?)`,
      [id, name.trim(), color || '#64748b', ...PROJECT_ROLE_FIELDS.map(f => perms[f]), req.userId]
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
    if (existing[0].role_key === 'owner') return res.status(400).json({ success: false, message: '创建者角色不可编辑' });
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入角色名称' });
    const sets = ['name = ?', 'color = ?'];
    const vals = [name.trim(), color || '#64748b'];
    PROJECT_ROLE_FIELDS.forEach(f => {
      sets.push(`${f} = ?`);
      vals.push(f === 'can_delete_project' ? 0 : (req.body[f] ? 1 : 0));
    });
    vals.push(roleId, id);
    const [result] = await db.query(`UPDATE project_roles SET ${sets.join(', ')} WHERE id = ? AND project_id = ?`, vals);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: '角色更新失败，记录未找到' });
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
    if (existing[0].role_key === 'owner') return res.status(400).json({ success: false, message: '创建者角色不可删除' });
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

// ========== 企业级共享项目角色 ==========

exports.entList = async (req, res) => {
  try {
    const entId = req.activeEnterpriseId;
    if (!entId) return res.status(400).json({ success: false, message: '未关联企业' });
    const roles = await ensureDefaultEnterpriseProjectRoles(entId, req.userId);
    const [counts] = await db.query(
      'SELECT project_role_id, COUNT(*) as cnt FROM duijie_project_members WHERE project_role_id IS NOT NULL GROUP BY project_role_id'
    );
    const countMap = {};
    counts.forEach(r => { countMap[r.project_role_id] = r.cnt; });
    roles.forEach(r => { r.member_count = countMap[r.id] || 0; });
    res.json({ success: true, data: roles });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.entCreate = async (req, res) => {
  try {
    const entId = req.activeEnterpriseId;
    if (!entId) return res.status(400).json({ success: false, message: '未关联企业' });
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入角色名称' });
    const perms = {};
    PROJECT_ROLE_FIELDS.forEach(f => { perms[f] = req.body[f] ? 1 : 0; });
    const [result] = await db.query(
      `INSERT INTO project_roles (enterprise_id, name, color, ${PROJECT_ROLE_FIELDS.join(', ')}, created_by)
       VALUES (?, ?, ?, ${PROJECT_ROLE_FIELDS.map(() => '?').join(', ')}, ?)`,
      [entId, name.trim(), color || '#64748b', ...PROJECT_ROLE_FIELDS.map(f => perms[f]), req.userId]
    );
    broadcast('enterprise', 'project_role_created', { enterpriseId: entId, userId: req.userId });
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.entUpdate = async (req, res) => {
  try {
    const entId = req.activeEnterpriseId;
    if (!entId) return res.status(400).json({ success: false, message: '未关联企业' });
    const { roleId } = req.params;
    const [existing] = await db.query('SELECT * FROM project_roles WHERE id = ? AND enterprise_id = ? AND is_deleted = 0', [roleId, entId]);
    if (!existing[0]) return res.status(404).json({ success: false, message: '角色不存在' });
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入角色名称' });
    const sets = ['name = ?', 'color = ?'];
    const vals = [name.trim(), color || '#64748b'];
    PROJECT_ROLE_FIELDS.forEach(f => { sets.push(`${f} = ?`); vals.push(req.body[f] ? 1 : 0); });
    vals.push(roleId, entId);
    await db.query(`UPDATE project_roles SET ${sets.join(', ')} WHERE id = ? AND enterprise_id = ?`, vals);
    broadcast('enterprise', 'project_role_updated', { enterpriseId: entId, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.entRemove = async (req, res) => {
  try {
    const entId = req.activeEnterpriseId;
    if (!entId) return res.status(400).json({ success: false, message: '未关联企业' });
    const { roleId } = req.params;
    const [existing] = await db.query('SELECT * FROM project_roles WHERE id = ? AND enterprise_id = ? AND is_deleted = 0', [roleId, entId]);
    if (!existing[0]) return res.status(404).json({ success: false, message: '角色不存在' });
    if (existing[0].is_default) return res.status(400).json({ success: false, message: '默认角色不可删除' });
    const [used] = await db.query('SELECT COUNT(*) as cnt FROM duijie_project_members WHERE project_role_id = ?', [roleId]);
    if (used[0].cnt > 0) return res.status(400).json({ success: false, message: `该角色已分配给 ${used[0].cnt} 个成员，请先取消分配` });
    await db.query('UPDATE project_roles SET is_deleted = 1 WHERE id = ?', [roleId]);
    broadcast('enterprise', 'project_role_deleted', { enterpriseId: entId, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
