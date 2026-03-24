const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
    if (!keys.length) return res.json({ success: true });
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = keys.map(k => fields[k]);
    await db.query(`UPDATE duijie_opportunities SET ${sets} WHERE id = ? AND is_deleted = 0`, [...vals, id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
