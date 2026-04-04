const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: '请上传 CSV 文件' });

    const csv = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = csv.split('\n').filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ success: false, message: 'CSV 文件为空或格式不正确' });

    const statusMap = { '规划中': 'planning', '进行中': 'in_progress', '已完成': 'completed', '暂停': 'on_hold', '审核中': 'review' };
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/(".*?"|[^,]*),?/g);
      if (!cols || cols.length < 1) continue;
      const name = (cols[0] || '').replace(/^"|"$/g, '').replace(/""/g, '"').replace(/,$/,'').trim();
      if (!name) continue;

      const statusLabel = (cols[1] || '').replace(/,$/,'').trim();
      const status = statusMap[statusLabel] || 'planning';

      const [result] = await db.query(
        'INSERT INTO duijie_projects (name, status, created_by) VALUES (?, ?, ?)',
        [name, status, req.userId]
      );
      await db.query(
        "INSERT IGNORE INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, 'owner', 'internal')",
        [result.insertId, req.userId]
      );
      imported++;
    }

    broadcast('project', 'created', { userId: req.userId });
    res.json({ success: true, message: `成功导入 ${imported} 个项目` });
  } catch (e) {
    console.error('项目导入错误:', e);
    res.status(500).json({ success: false, message: '导入失败' });
  }
};
