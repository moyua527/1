const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

// 恢复已删除的项目
module.exports = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM duijie_projects WHERE id = ? AND is_deleted = 1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: '项目不存在或未被删除' });

    await db.query('UPDATE duijie_projects SET is_deleted = 0 WHERE id = ?', [req.params.id]);
    broadcast('project', 'restored', { id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('项目恢复错误:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
