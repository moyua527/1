const db = require('../../../config/db');
const { findMyEnterprises, findActiveEnterprise, isCreator } = require('./enterpriseHelpers');

exports.getAll = async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ success: false, message: '仅系统管理员可查看' });
    const [enterprises] = await db.query(
      "SELECT c.*, u.nickname as creator_name FROM duijie_clients c LEFT JOIN voice_users u ON c.user_id = u.id WHERE c.client_type = 'company' AND c.is_deleted = 0 ORDER BY c.created_at DESC"
    );
    const list = [];
    for (const ent of enterprises) {
      const [members] = await db.query('SELECT * FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 ORDER BY created_at ASC', [ent.id]);
      const [departments] = await db.query('SELECT * FROM duijie_departments WHERE client_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC', [ent.id]);
      list.push({ enterprise: ent, members, departments });
    }
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    const [owned] = await db.query("SELECT id FROM duijie_clients WHERE user_id = ? AND client_type = 'company' AND is_deleted = 0 LIMIT 1", [req.userId]);
    if (owned[0]) return res.status(400).json({ success: false, message: '每个用户只能创建一个企业' });
    const { name, company, email, phone, notes, industry, scale, address, credit_code, legal_person, registered_capital, established_date, business_scope, company_type, website } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入企业名称' });
    const [result] = await db.query(
      `INSERT INTO duijie_clients (user_id, client_type, name, company, email, phone, notes, industry, scale, address, credit_code, legal_person, registered_capital, established_date, business_scope, company_type, website, created_by, stage) VALUES (?, 'company', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'signed')`,
      [req.userId, name.trim(), company || null, email || null, phone || null, notes || null, industry || null, scale || null, address || null, credit_code || null, legal_person || null, registered_capital || null, established_date || null, business_scope || null, company_type || null, website || null, req.userId]
    );
    const [user] = await db.query('SELECT nickname, username, phone, email FROM voice_users WHERE id = ?', [req.userId]);
    const u = user[0] || {};
    await db.query(
      "INSERT INTO duijie_client_members (client_id, user_id, name, phone, email, role, created_by) VALUES (?, ?, ?, ?, ?, 'creator', ?)",
      [result.insertId, req.userId, u.nickname || u.username || '', u.phone || null, u.email || null, req.userId]
    );
    await db.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id = ?', [result.insertId, req.userId]);
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.get = async (req, res) => {
  try {
    const enterprises = await findMyEnterprises(req.userId);
    if (enterprises.length === 0) return res.json({ success: true, data: null });
    const active = await findActiveEnterprise(req.userId);
    const [members] = await db.query('SELECT * FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 ORDER BY created_at ASC', [active.id]);
    const [departments] = await db.query('SELECT * FROM duijie_departments WHERE client_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC', [active.id]);
    res.json({ success: true, data: {
      enterprises: enterprises.map(e => ({ id: e.id, name: e.name, company: e.company, member_role: e.member_role })),
      activeId: active.id, enterprise: active, members, departments
    }});
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!isCreator(ent)) return res.status(403).json({ success: false, message: '仅企业创建者可编辑企业信息' });
    const { name, company, email, phone, notes, industry, scale, address, credit_code, legal_person, registered_capital, established_date, business_scope, company_type, website } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入企业名称' });
    await db.query(
      'UPDATE duijie_clients SET name=?, company=?, email=?, phone=?, notes=?, industry=?, scale=?, address=?, credit_code=?, legal_person=?, registered_capital=?, established_date=?, business_scope=?, company_type=?, website=? WHERE id=?',
      [name.trim(), company || null, email || null, phone || null, notes || null, industry || null, scale || null, address || null, credit_code || null, legal_person || null, registered_capital || null, established_date || null, business_scope || null, company_type || null, website || null, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    const ent = await findActiveEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    if (!isCreator(ent)) return res.status(403).json({ success: false, message: '仅企业创建者可删除企业' });
    await db.query('UPDATE duijie_clients SET is_deleted=1 WHERE id=?', [ent.id]);
    await db.query('UPDATE duijie_client_members SET is_deleted=1 WHERE client_id=?', [ent.id]);
    await db.query('UPDATE voice_users SET active_enterprise_id = NULL WHERE active_enterprise_id = ?', [ent.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.searchEnterprise = async (req, res) => {
  try {
    const name = (req.query.name || '').trim();
    if (!name || name.length < 1) return res.json({ success: true, data: [] });
    const [rows] = await db.query(
      "SELECT id, name, company, industry, scale FROM duijie_clients WHERE client_type = 'company' AND is_deleted = 0 AND (name LIKE ? OR company LIKE ?) LIMIT 10",
      [`%${name}%`, `%${name}%`]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.lookupUser = async (req, res) => {
  try {
    const phone = (req.query.phone || '').trim();
    if (!/^\d{11}$/.test(phone)) return res.status(400).json({ success: false, message: '请输入11位手机号' });
    const [rows] = await db.query("SELECT id, username, nickname, email, phone, avatar FROM voice_users WHERE phone = ? AND is_deleted = 0 LIMIT 1", [phone]);
    if (!rows[0]) return res.json({ success: true, data: null, message: '未找到该手机号对应的账号' });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.switchEnterprise = async (req, res) => {
  try {
    const { enterprise_id } = req.body;
    if (!enterprise_id) return res.status(400).json({ success: false, message: '请选择企业' });
    const enterprises = await findMyEnterprises(req.userId);
    const target = enterprises.find(e => e.id === enterprise_id);
    if (!target) return res.status(403).json({ success: false, message: '您不属于该企业' });
    await db.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id = ?', [enterprise_id, req.userId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
