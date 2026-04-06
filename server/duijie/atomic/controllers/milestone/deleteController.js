const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const [[ms]] = await db.query('SELECT project_id FROM duijie_milestones WHERE id = ?', [id]);
    if (!ms) return res.status(404).json({ success: false, message: '代办不存在' });
    if (req.userRole !== 'admin') {
      const perms = await getProjectPerms(req.userId, ms.project_id);
      if (!perms?.can_delete_milestone) return res.status(403).json({ success: false, message: '无代办删除权限' });
    }
    await db.query('DELETE FROM duijie_milestones WHERE id = ?', [id]);
    broadcast('milestone', 'deleted', { project_id: ms.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
