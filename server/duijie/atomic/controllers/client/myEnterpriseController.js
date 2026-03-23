const db = require('../../../config/db');

// GET /api/my-enterprise — 当前用户关联的企业信息+企业成员
module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    // 1. 查找用户关联的客户记录(企业)
    const [clients] = await db.query(
      "SELECT * FROM duijie_clients WHERE user_id = ? AND client_type = 'company' AND is_deleted = 0 LIMIT 1",
      [userId]
    );
    if (clients.length === 0) {
      return res.json({ success: true, data: null });
    }
    const enterprise = clients[0];
    // 2. 查询企业成员
    const [members] = await db.query(
      'SELECT * FROM duijie_client_members WHERE client_id = ? AND is_deleted = 0 ORDER BY created_at ASC',
      [enterprise.id]
    );
    res.json({ success: true, data: { enterprise, members } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
