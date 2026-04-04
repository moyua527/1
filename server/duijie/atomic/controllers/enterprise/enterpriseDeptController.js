const db = require('../../../config/db');
const { findActiveEnterprise, isCreator } = require('./enterpriseHelpers');

async function canManageDept(ent, userId) {
  if (!ent) return false;
  if (isCreator(ent) || ent.member_role === 'admin') return true;
  if (!ent.enterprise_role_id) return false;
  const [rows] = await db.query('SELECT can_manage_department FROM enterprise_roles WHERE id = ? AND is_deleted = 0', [ent.enterprise_role_id]);
  return rows[0]?.can_manage_department === 1;
}

exports.addDepartment = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!(await canManageDept(ent, req.userId))) return res.status(403).json({ success: false, message: '无权限管理部门' });
    const { name, parent_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入部门名称' });
    const [result] = await db.query(
      'INSERT INTO duijie_departments (client_id, name, parent_id) VALUES (?, ?, ?)',
      [ent.id, name.trim(), parent_id || null]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!(await canManageDept(ent, req.userId))) return res.status(403).json({ success: false, message: '无权限管理部门' });
    const { name, parent_id, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入部门名称' });
    await db.query(
      'UPDATE duijie_departments SET name=?, parent_id=?, sort_order=? WHERE id=? AND client_id=? AND is_deleted=0',
      [name.trim(), parent_id || null, sort_order ?? 0, req.params.id, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.removeDepartment = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!(await canManageDept(ent, req.userId))) return res.status(403).json({ success: false, message: '无权限管理部门' });
    await db.query('UPDATE duijie_departments SET is_deleted=1 WHERE id=? AND client_id=?', [req.params.id, ent.id]);
    await db.query('UPDATE duijie_client_members SET department_id=NULL WHERE department_id=? AND client_id=?', [req.params.id, ent.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
