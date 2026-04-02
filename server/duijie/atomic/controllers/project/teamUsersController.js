const db = require('../../../config/db');
const { getUserActiveEnterpriseId, listEnterpriseUsers } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      const enterpriseId = await getUserActiveEnterpriseId(req.userId);
      if (!enterpriseId) return res.json({ success: true, data: [] });
      const rows = await listEnterpriseUsers(enterpriseId);
      return res.json({ success: true, data: rows });
    }
    const [rows] = await db.query(
      `SELECT id, username, nickname, role FROM voice_users
       WHERE is_deleted = 0 AND is_active = 1
       ORDER BY nickname, username`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
