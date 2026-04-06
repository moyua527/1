const db = require('../../../config/db');
const path = require('path');
const fs = require('fs');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const pid = req.params.id;
    const [[proj]] = await db.query('SELECT id, cover_image FROM duijie_projects WHERE id = ?', [pid]);
    if (!proj) return res.status(404).json({ success: false, message: '项目不存在' });

    if (proj.cover_image && proj.cover_image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../../../uploads', path.basename(proj.cover_image));
      fs.unlink(oldPath, () => {});
    }

    await db.query('UPDATE duijie_projects SET cover_image = NULL WHERE id = ?', [pid]);
    broadcast('project', 'updated', { project_id: pid, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('remove cover error:', e);
    res.status(500).json({ success: false, message: '移除封面失败' });
  }
};
