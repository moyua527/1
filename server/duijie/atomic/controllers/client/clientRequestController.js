const db = require('../../../config/db');
const { notify, notifyMany } = require('../../utils/notify');
const { broadcast } = require('../../utils/broadcast');
const { getUserActiveEnterpriseId } = require('../../services/accessScope');
const { getEnterpriseManagerUserIds } = require('../enterprise/enterpriseHelpers');

// 发送添加客户请求
exports.send = async (req, res) => {
  try {
    const { to_enterprise_id, message } = req.body;
    if (!to_enterprise_id) return res.status(400).json({ success: false, message: '请选择目标企业' });

    const fromEnterpriseId = await getUserActiveEnterpriseId(req.userId);
    if (!fromEnterpriseId) return res.status(400).json({ success: false, message: '请先加入或创建企业' });
    if (Number(fromEnterpriseId) === Number(to_enterprise_id)) return res.status(400).json({ success: false, message: '不能向自己的企业发送请求' });

    // 检查目标企业是否存在
    const [[target]] = await db.query("SELECT id, name FROM duijie_clients WHERE id = ? AND client_type = 'company' AND is_deleted = 0", [to_enterprise_id]);
    if (!target) return res.status(404).json({ success: false, message: '目标企业不存在' });

    // 检查是否已有待处理的请求
    const [[existing]] = await db.query(
      "SELECT id FROM duijie_client_requests WHERE from_enterprise_id = ? AND to_enterprise_id = ? AND status = 'pending'",
      [fromEnterpriseId, to_enterprise_id]
    );
    if (existing) return res.status(400).json({ success: false, message: '已有待处理的请求，请等待对方审批' });

    const [result] = await db.query(
      'INSERT INTO duijie_client_requests (from_enterprise_id, to_enterprise_id, message, created_by) VALUES (?, ?, ?, ?)',
      [fromEnterpriseId, to_enterprise_id, message || null, req.userId]
    );

    // 获取发起方企业名称
    const [[fromEnt]] = await db.query('SELECT name FROM duijie_clients WHERE id = ?', [fromEnterpriseId]);
    const fromName = fromEnt?.name || '未知企业';

    // 通知目标企业管理人员
    const managerIds = await getEnterpriseManagerUserIds(to_enterprise_id);
    await notifyMany(managerIds, 'client_request', '收到客户添加请求', `企业「${fromName}」请求将贵企业添加为客户`, '/enterprise');
    broadcast('client_request', 'created', { id: result.insertId });

    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: '已有待处理的请求' });
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// 查看收到的请求（目标企业视角）
exports.incoming = async (req, res) => {
  try {
    const enterpriseId = await getUserActiveEnterpriseId(req.userId);
    if (!enterpriseId) return res.json({ success: true, data: [] });

    const [rows] = await db.query(
      `SELECT r.*, c.name as from_name, c.company as from_company, u.nickname as created_by_name
       FROM duijie_client_requests r
       LEFT JOIN duijie_clients c ON c.id = r.from_enterprise_id
       LEFT JOIN voice_users u ON u.id = r.created_by
       WHERE r.to_enterprise_id = ?
       ORDER BY FIELD(r.status, 'pending', 'approved', 'rejected'), r.created_at DESC`,
      [enterpriseId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// 查看发出的请求（发起方视角）
exports.outgoing = async (req, res) => {
  try {
    const enterpriseId = await getUserActiveEnterpriseId(req.userId);
    if (!enterpriseId) return res.json({ success: true, data: [] });

    const [rows] = await db.query(
      `SELECT r.*, c.name as to_name, c.company as to_company
       FROM duijie_client_requests r
       LEFT JOIN duijie_clients c ON c.id = r.to_enterprise_id
       WHERE r.from_enterprise_id = ?
       ORDER BY r.created_at DESC`,
      [enterpriseId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// 同意请求
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const enterpriseId = await getUserActiveEnterpriseId(req.userId);
    if (!enterpriseId) return res.status(403).json({ success: false, message: '无权操作' });

    const [[request]] = await db.query(
      "SELECT * FROM duijie_client_requests WHERE id = ? AND to_enterprise_id = ? AND status = 'pending'",
      [id, enterpriseId]
    );
    if (!request) return res.status(404).json({ success: false, message: '请求不存在或已处理' });

    await db.query(
      "UPDATE duijie_client_requests SET status = 'approved', handled_by = ?, handled_at = NOW() WHERE id = ?",
      [req.userId, id]
    );

    // 获取两方企业名称
    const [[fromEnt]] = await db.query('SELECT name FROM duijie_clients WHERE id = ?', [request.from_enterprise_id]);
    const [[toEnt]] = await db.query('SELECT name FROM duijie_clients WHERE id = ?', [request.to_enterprise_id]);

    // 通知发起方
    await notify(request.created_by, 'client_request_approved', '客户添加请求已通过',
      `企业「${toEnt?.name || ''}」已同意您的客户添加请求`, '/clients');
    broadcast('client_request', 'approved', { id, from_enterprise_id: request.from_enterprise_id, to_enterprise_id: request.to_enterprise_id });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

// 拒绝请求
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const enterpriseId = await getUserActiveEnterpriseId(req.userId);
    if (!enterpriseId) return res.status(403).json({ success: false, message: '无权操作' });

    const [[request]] = await db.query(
      "SELECT * FROM duijie_client_requests WHERE id = ? AND to_enterprise_id = ? AND status = 'pending'",
      [id, enterpriseId]
    );
    if (!request) return res.status(404).json({ success: false, message: '请求不存在或已处理' });

    await db.query(
      "UPDATE duijie_client_requests SET status = 'rejected', handled_by = ?, handled_at = NOW() WHERE id = ?",
      [req.userId, id]
    );

    const [[toEnt]] = await db.query('SELECT name FROM duijie_clients WHERE id = ?', [request.to_enterprise_id]);
    await notify(request.created_by, 'client_request_rejected', '客户添加请求被拒绝',
      `企业「${toEnt?.name || ''}」拒绝了您的客户添加请求`, '/clients');
    broadcast('client_request', 'rejected', { id });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
