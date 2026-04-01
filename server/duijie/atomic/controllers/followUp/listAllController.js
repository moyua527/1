const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, c.company_name as client_name
       FROM duijie_follow_ups f
       LEFT JOIN duijie_clients c ON f.client_id = c.id
       WHERE f.next_follow_date IS NOT NULL
       ORDER BY f.next_follow_date DESC
       LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
