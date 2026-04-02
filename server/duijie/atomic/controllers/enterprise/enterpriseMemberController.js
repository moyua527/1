const db = require('../../../config/db');
const { findActiveEnterprise, isCreator } = require('./enterpriseHelpers');
const { notify } = require('../../utils/notify');
const { broadcast } = require('../../utils/broadcast');

exports.addMember = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, position, department, phone, email, notes, employee_id, join_date, supervisor, department_id, enterprise_role_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    let userId = null;
    if (phone) {
      const [match] = await db.query('SELECT id FROM voice_users WHERE phone = ? AND is_deleted = 0 LIMIT 1', [phone]);
      if (match[0]) userId = match[0].id;
    }
    if (!userId && email) {
      const [match] = await db.query('SELECT id FROM voice_users WHERE email = ? AND is_deleted = 0 LIMIT 1', [email]);
      if (match[0]) userId = match[0].id;
    }
    const [result] = await db.query(
      'INSERT INTO duijie_client_members (client_id, user_id, name, position, department, phone, email, notes, employee_id, join_date, supervisor, department_id, enterprise_role_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ent.id, userId, name.trim(), position || null, department || null, phone || null, email || null, notes || null, employee_id || null, join_date || null, supervisor || null, department_id || null, enterprise_role_id || null, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, position, department, phone, email, notes, employee_id, join_date, supervisor, department_id, enterprise_role_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    await db.query(
      'UPDATE duijie_client_members SET name=?, position=?, department=?, phone=?, email=?, notes=?, employee_id=?, join_date=?, supervisor=?, department_id=?, enterprise_role_id=? WHERE id=? AND client_id=? AND is_deleted=0',
      [name.trim(), position || null, department || null, phone || null, email || null, notes || null, employee_id || null, join_date || null, supervisor || null, department_id || null, enterprise_role_id || null, req.params.id, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    await db.query('UPDATE duijie_client_members SET is_deleted=1 WHERE id=? AND client_id=?', [req.params.id, ent.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.leaveEnterprise = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (isCreator(ent)) return res.status(400).json({ success: false, message: '企业创建者不能退出自己的企业，请先转让或解散' });
    // 软删除该用户在企业中的成员记录
    await db.query('UPDATE duijie_client_members SET is_deleted=1 WHERE client_id=? AND user_id=? AND is_deleted=0', [ent.id, req.userId]);
    // 清除活跃企业设置
    await db.query('UPDATE voice_users SET active_enterprise_id=NULL WHERE id=?', [req.userId]);
    // 通知企业创建者
    if (ent.user_id) {
      const [userRow] = await db.query('SELECT nickname, username FROM voice_users WHERE id=?', [req.userId]);
      const userName = userRow[0]?.nickname || userRow[0]?.username || '未知用户';
      await notify(ent.user_id, 'enterprise', '成员退出企业',
        `成员「${userName}」已退出企业「${ent.name}」`, '/enterprise');
      broadcast('enterprise', 'member_left', { enterprise_id: ent.id, user_id: req.userId });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!isCreator(ent)) return res.status(403).json({ success: false, message: '仅企业创建者可修改成员角色' });
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ success: false, message: '角色只能是 admin 或 member' });
    const [target] = await db.query('SELECT * FROM duijie_client_members WHERE id = ? AND client_id = ? AND is_deleted = 0', [req.params.id, ent.id]);
    if (!target[0]) return res.status(404).json({ success: false, message: '成员不存在' });
    if (target[0].role === 'creator') return res.status(400).json({ success: false, message: '无法修改创建者角色' });
    await db.query('UPDATE duijie_client_members SET role = ? WHERE id = ?', [role, req.params.id]);

    if (target[0].user_id) {
      const roleLabel = role === 'admin' ? '管理员' : '普通成员';
      await notify(target[0].user_id, 'enterprise', '企业角色变更',
        `您在企业「${ent.name}」中的角色已被修改为「${roleLabel}」`, '/enterprise');
      broadcast('enterprise', 'member_role_updated', { enterprise_id: ent.id, member_id: req.params.id });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
