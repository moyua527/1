const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { name, description, config, from_project_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: '模板名称必填' });

    let templateConfig = config || {};

    if (from_project_id) {
      const [[project]] = await db.query(
        'SELECT name, description, status FROM duijie_projects WHERE id = ? AND is_deleted = 0',
        [from_project_id]
      );
      if (!project) return res.status(404).json({ success: false, message: '项目不存在' });

      const [tasks] = await db.query(
        'SELECT title, description, priority, status, sort_order FROM duijie_tasks WHERE project_id = ? AND is_deleted = 0 ORDER BY sort_order',
        [from_project_id]
      );

      const [[presets]] = await db.query(
        'SELECT preset_titles FROM duijie_task_title_presets WHERE project_id = ?',
        [from_project_id]
      );

      templateConfig = {
        projectDescription: project.description || '',
        tasks: tasks.map(t => ({ title: t.title, description: t.description || '', priority: t.priority })),
        presetTitles: presets?.preset_titles ? JSON.parse(presets.preset_titles) : [],
      };
    }

    const [result] = await db.query(
      'INSERT INTO duijie_project_templates (name, description, enterprise_id, created_by, config) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, req.activeEnterpriseId || null, req.userId, JSON.stringify(templateConfig)]
    );

    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '创建模板失败' });
  }
};
