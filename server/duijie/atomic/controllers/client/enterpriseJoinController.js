const db = require('../../../config/db');
const { withTransaction } = require('../../utils/transaction');
const { auditLog } = require('../../utils/auditLog');
const { notifyMany } = require('../../utils/notify');
const { findActiveEnterprise, canManage, getEnterpriseManagerUserIds } = require('./enterpriseHelpers');

exports.joinEnterprise = async (req, res) => {
  try {
    const { enterprise_id, join_code } = req.body;
    const normalizedCode = (join_code || '').trim().toUpperCase();
    if (!enterprise_id) return res.status(400).json({ success: false, message: '请选择要加入的企业' });
    const [ent] = await db.query("SELECT id, name, join_code FROM duijie_clients WHERE id = ? AND client_type = 'company' AND is_deleted = 0", [enterprise_id]);
    if (!ent[0]) return res.status(404).json({ success: false, message: '企业不存在' });
    const [dup] = await db.query('SELECT id FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND is_deleted = 0', [enterprise_id, req.userId]);
    if (dup[0]) return res.status(400).json({ success: false, message: '您已是该企业成员' });
    const [pendingDup] = await db.query("SELECT id FROM duijie_join_requests WHERE client_id = ? AND user_id = ? AND status = 'pending'", [enterprise_id, req.userId]);
    if (!normalizedCode) {
      if (pendingDup[0]) return res.status(400).json({ success: false, message: '您已提交申请，请等待审批' });
      await db.query('INSERT INTO duijie_join_requests (client_id, user_id) VALUES (?, ?)', [enterprise_id, req.userId]);
      return res.json({ success: true, message: `已向「${ent[0].name}」提交加入申请，请等待管理员审批`, data: { joinedDirectly: false } });
    }
    if (!ent[0].join_code || ent[0].join_code !== normalizedCode) {
      return res.status(400).json({ success: false, message: '推荐码无效，请确认后重试' });
    }
    const [user] = await db.query('SELECT nickname, username, phone, email FROM voice_users WHERE id = ?', [req.userId]);
    const u = user[0] || {};
    await withTransaction(async (conn) => {
      await conn.query(
        'INSERT INTO duijie_client_members (client_id, user_id, name, phone, email, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [enterprise_id, req.userId, u.nickname || u.username || '', u.phone || null, u.email || null, req.userId]
      );
      await conn.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id = ? AND active_enterprise_id IS NULL', [enterprise_id, req.userId]);
      if (pendingDup[0]) {
        await conn.query("UPDATE duijie_join_requests SET status = 'approved', handled_at = NOW(), handled_by = NULL WHERE id = ?", [pendingDup[0].id]);
      } else {
        await conn.query("INSERT INTO duijie_join_requests (client_id, user_id, status, handled_at, handled_by) VALUES (?, ?, 'approved', NOW(), NULL)", [enterprise_id, req.userId]);
      }
    });
    const managerIds = await getEnterpriseManagerUserIds(enterprise_id, req.userId);
    await notifyMany(managerIds, 'join_via_code', '企业新增成员', `${u.nickname || u.username || '新成员'} 通过推荐码加入了企业「${ent[0].name}」`, '/enterprise');
    await auditLog({
      userId: req.userId,
      username: u.username || u.nickname || '',
      action: 'join_by_code',
      entityType: 'enterprise',
      entityId: enterprise_id,
      detail: `通过推荐码加入企业「${ent[0].name}」`,
      ip: req.ip,
    });
    return res.json({ success: true, message: `已通过推荐码加入「${ent[0].name}」`, data: { joinedDirectly: true } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.listJoinRequests = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent || !(await canManage(ent, req.userId))) return res.json({ success: true, data: [] });
    const [rows] = await db.query(
      `SELECT r.id, r.user_id, r.status, r.created_at, u.nickname, u.username, u.phone, u.email, u.avatar
       FROM duijie_join_requests r LEFT JOIN voice_users u ON u.id = r.user_id
       WHERE r.client_id = ? AND r.status = 'pending' ORDER BY r.created_at DESC`,
      [ent.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.approveJoinRequest = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent || !(await canManage(ent, req.userId))) return res.status(403).json({ success: false, message: '无权操作' });
    const [reqRows] = await db.query("SELECT * FROM duijie_join_requests WHERE id = ? AND client_id = ? AND status = 'pending'", [req.params.id, ent.id]);
    if (!reqRows[0]) return res.status(404).json({ success: false, message: '申请不存在或已处理' });
    const jr = reqRows[0];
    const [user] = await db.query('SELECT nickname, username, phone, email FROM voice_users WHERE id = ?', [jr.user_id]);
    const u = user[0] || {};
    await withTransaction(async (conn) => {
      await conn.query("UPDATE duijie_join_requests SET status = 'approved', handled_at = NOW(), handled_by = ? WHERE id = ?", [req.userId, jr.id]);
      await conn.query(
        'INSERT INTO duijie_client_members (client_id, user_id, name, phone, email, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [ent.id, jr.user_id, u.nickname || u.username || '', u.phone || null, u.email || null, req.userId]
      );
      await conn.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id = ? AND active_enterprise_id IS NULL', [ent.id, jr.user_id]);
    });
    res.json({ success: true, message: '已批准' });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.rejectJoinRequest = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent || !(await canManage(ent, req.userId))) return res.status(403).json({ success: false, message: '无权操作' });
    await db.query("UPDATE duijie_join_requests SET status = 'rejected', handled_at = NOW(), handled_by = ? WHERE id = ? AND client_id = ? AND status = 'pending'", [req.userId, req.params.id, ent.id]);
    res.json({ success: true, message: '已拒绝' });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.myJoinRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.client_id, r.status, r.created_at, c.name as enterprise_name
       FROM duijie_join_requests r LEFT JOIN duijie_clients c ON c.id = r.client_id
       WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 10`,
      [req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
