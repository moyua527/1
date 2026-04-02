const db = require('../../../config/db');
const { normalizeTaskTitlePresets } = require('../../utils/taskTitlePresets');

module.exports = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    if (!title) return res.status(400).json({ success: false, message: '请输入标题' });
    if (title.length > 200) return res.status(400).json({ success: false, message: '标题不超过200字' });

    const [[project]] = await db.query(
      'SELECT task_title_presets FROM duijie_projects WHERE id = ? AND is_deleted = 0 LIMIT 1',
      [req.params.id]
    );
    if (!project) return res.status(404).json({ success: false, message: '项目不存在' });

    await db.query(
      `INSERT INTO duijie_task_title_history (user_id, project_id, title, last_used_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE last_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
      [req.userId, req.params.id, title]
    );

    const [history] = await db.query(
      'SELECT id, title, last_used_at FROM duijie_task_title_history WHERE project_id = ? AND user_id = ? ORDER BY last_used_at DESC, id DESC',
      [req.params.id, req.userId]
    );

    res.json({
      success: true,
      data: {
        presets: normalizeTaskTitlePresets(project.task_title_presets),
        history,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
