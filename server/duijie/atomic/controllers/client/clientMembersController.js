const db = require('../../../config/db');

// GET /api/clients/:id/members
exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/clients/:id/members
exports.create = async (req, res) => {
  try {
    const { name, position, department, phone, email, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    const [result] = await db.query(
      'INSERT INTO duijie_client_members (client_id, name, position, department, phone, email, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.params.id, name.trim(), position || null, department || null, phone || null, email || null, notes || null, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/client-members/:id
exports.update = async (req, res) => {
  try {
    const { name, position, department, phone, email, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入成员姓名' });
    await db.query(
      'UPDATE duijie_client_members SET name=?, position=?, department=?, phone=?, email=?, notes=? WHERE id=? AND is_deleted=0',
      [name.trim(), position || null, department || null, phone || null, email || null, notes || null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/client-members/:id
exports.remove = async (req, res) => {
  try {
    await db.query('UPDATE duijie_client_members SET is_deleted = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
