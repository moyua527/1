const db = require('../../../config/db');
const { normalizeTaskTitlePresets } = require('../../utils/taskTitlePresets');

module.exports = async (req, res) => {
  try {
    const [[project]] = await db.query(
      'SELECT task_title_presets FROM duijie_projects WHERE id = ? AND is_deleted = 0 LIMIT 1',
      [req.params.id]
    );
    if (!project) return res.status(404).json({ success: false, message: '项目不存在' });

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
