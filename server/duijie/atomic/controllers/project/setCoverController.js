const db = require('../../../config/db');
const path = require('path');
const fs = require('fs');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const pid = req.params.id;
    const [[proj]] = await db.query('SELECT id, cover_image FROM duijie_projects WHERE id = ?', [pid]);
    if (!proj) return res.status(404).json({ success: false, message: '项目不存在' });

    if (req.body.cover_image_url) {
      await db.query('UPDATE duijie_projects SET cover_image = ? WHERE id = ?', [req.body.cover_image_url, pid]);
      broadcast('project', 'updated', { project_id: pid, userId: req.userId });
      return res.json({ success: true, data: { cover_image: req.body.cover_image_url } });
    }

    if (!req.file) return res.status(400).json({ success: false, message: '请上传图片或提供图片URL' });

    if (proj.cover_image && proj.cover_image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../../../uploads', path.basename(proj.cover_image));
      fs.unlink(oldPath, () => {});
    }

    const coverUrl = `/uploads/${req.file.filename}`;
    await db.query('UPDATE duijie_projects SET cover_image = ? WHERE id = ?', [coverUrl, pid]);
    broadcast('project', 'updated', { project_id: pid, userId: req.userId });
    res.json({ success: true, data: { cover_image: coverUrl } });
  } catch (e) {
    console.error('set cover error:', e);
    res.status(500).json({ success: false, message: '设置封面失败' });
  }
};
