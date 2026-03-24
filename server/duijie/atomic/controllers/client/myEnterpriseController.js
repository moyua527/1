const db = require('../../../config/db');

// 辅助：查找当前用户关联的企业
async function findMyEnterprise(userId) {
  const [rows] = await db.query(
    "SELECT * FROM duijie_clients WHERE user_id = ? AND client_type = 'company' AND is_deleted = 0 LIMIT 1",
    [userId]
  );
  return rows[0] || null;
}

// POST /api/my-enterprise — 创建企业
exports.create = async (req, res) => {
  try {
    const existing = await findMyEnterprise(req.userId);
    if (existing) return res.status(400).json({ success: false, message: '您已拥有企业' });
    const { name, company, email, phone, notes, industry, scale, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入企业名称' });
    const [result] = await db.query(
      "INSERT INTO duijie_clients (user_id, client_type, name, company, email, phone, notes, industry, scale, address, created_by, stage) VALUES (?, 'company', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'signed')",
      [req.userId, name.trim(), company || null, email || null, phone || null, notes || null, industry || null, scale || null, address || null, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/my-enterprise
exports.get = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.json({ success: true, data: null });
    const [members] = await db.query(
      'SELECT * FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 ORDER BY created_at ASC',
      [ent.id]
    );
    const [departments] = await db.query(
      'SELECT * FROM duijie_departments WHERE client_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC',
      [ent.id]
    );
    res.json({ success: true, data: { enterprise: ent, members, departments } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/my-enterprise — 更新企业信息
exports.update = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, company, email, phone, notes, industry, scale, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入企业名称' });
    await db.query(
      'UPDATE duijie_clients SET name=?, company=?, email=?, phone=?, notes=?, industry=?, scale=?, address=? WHERE id=?',
      [name.trim(), company || null, email || null, phone || null, notes || null, industry || null, scale || null, address || null, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/my-enterprise — 删除企业
exports.remove = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    await db.query('UPDATE duijie_clients SET is_deleted=1 WHERE id=?', [ent.id]);
    await db.query('UPDATE duijie_client_members SET is_deleted=1 WHERE client_id=?', [ent.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/my-enterprise/members — 添加成员
exports.addMember = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, position, department, phone, email, notes, employee_id, join_date, supervisor, department_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    const [result] = await db.query(
      'INSERT INTO duijie_client_members (client_id, name, position, department, phone, email, notes, employee_id, join_date, supervisor, department_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ent.id, name.trim(), position || null, department || null, phone || null, email || null, notes || null, employee_id || null, join_date || null, supervisor || null, department_id || null, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/my-enterprise/members/:id — 更新成员
exports.updateMember = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, position, department, phone, email, notes, employee_id, join_date, supervisor, department_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    await db.query(
      'UPDATE duijie_client_members SET name=?, position=?, department=?, phone=?, email=?, notes=?, employee_id=?, join_date=?, supervisor=?, department_id=? WHERE id=? AND client_id=? AND is_deleted=0',
      [name.trim(), position || null, department || null, phone || null, email || null, notes || null, employee_id || null, join_date || null, supervisor || null, department_id || null, req.params.id, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/my-enterprise/members/:id — 删除成员
exports.removeMember = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    await db.query(
      'UPDATE duijie_client_members SET is_deleted=1 WHERE id=? AND client_id=?',
      [req.params.id, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// === 部门管理 ===

// POST /api/my-enterprise/departments
exports.addDepartment = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, parent_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入部门名称' });
    const [result] = await db.query(
      'INSERT INTO duijie_departments (client_id, name, parent_id) VALUES (?, ?, ?)',
      [ent.id, name.trim(), parent_id || null]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/my-enterprise/departments/:id
exports.updateDepartment = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, parent_id, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入部门名称' });
    await db.query(
      'UPDATE duijie_departments SET name=?, parent_id=?, sort_order=? WHERE id=? AND client_id=? AND is_deleted=0',
      [name.trim(), parent_id || null, sort_order ?? 0, req.params.id, ent.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/my-enterprise/departments/:id
exports.removeDepartment = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    await db.query('UPDATE duijie_departments SET is_deleted=1 WHERE id=? AND client_id=?', [req.params.id, ent.id]);
    await db.query('UPDATE duijie_client_members SET department_id=NULL WHERE department_id=? AND client_id=?', [req.params.id, ent.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
