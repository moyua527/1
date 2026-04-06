const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { progress } = req.body;
    const val = parseInt(progress, 10);
    if (isNaN(val) || val < 0 || val > 100) {
      return res.status(400).json({ success: false, message: '进度值需在 0-100 之间' });
    }

    const [[ms]] = await db.query(
      'SELECT project_id, is_completed FROM duijie_milestones WHERE id = ? AND is_deleted = 0',
      [req.params.id]
    );
    if (!ms) return res.status(404).json({ success: false, message: '代办不存在' });

    if (ms.is_completed && val < 100) {
      return res.status(400).json({ success: false, message: '已完成的代办进度不能低于 100' });
    }

    await db.query(
      'UPDATE duijie_milestones SET progress = ? WHERE id = ?',
      [val, req.params.id]
    );

    broadcast('milestone', 'updated', { project_id: ms.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
