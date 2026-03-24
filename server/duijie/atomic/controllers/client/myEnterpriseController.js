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
    const { name, company, email, phone, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入企业名称' });
    const [result] = await db.query(
      "INSERT INTO duijie_clients (user_id, client_type, name, company, email, phone, notes, created_by, stage) VALUES (?, 'company', ?, ?, ?, ?, ?, ?, 'signed')",
      [req.userId, name.trim(), company || null, email || null, phone || null, notes || null, req.userId]
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
    res.json({ success: true, data: { enterprise: ent, members } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/my-enterprise — 更新企业信息
exports.update = async (req, res) => {
  try {
    const ent = await findMyEnterprise(req.userId);
    if (!ent) return res.status(404).json({ success: false, message: '未找到关联企业' });
    const { name, company, email, phone, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入企业名称' });
    await db.query(
      'UPDATE duijie_clients SET name=?, company=?, email=?, phone=?, notes=? WHERE id=?',
      [name.trim(), company || null, email || null, phone || null, notes || null, ent.id]
    );
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
    const { name, position, department, phone, email, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    const [result] = await db.query(
      'INSERT INTO duijie_client_members (client_id, name, position, department, phone, email, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [ent.id, name.trim(), position || null, department || null, phone || null, email || null, notes || null, req.userId]
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
    const { name, position, department, phone, email, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    await db.query(
      'UPDATE duijie_client_members SET name=?, position=?, department=?, phone=?, email=?, notes=? WHERE id=? AND client_id=? AND is_deleted=0',
      [name.trim(), position || null, department || null, phone || null, email || null, notes || null, req.params.id, ent.id]
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
