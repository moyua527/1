const createProject = require('../../services/project/createProject');
const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { withTransaction } = require('../../utils/transaction');
const { ensureDefaultProjectRoles } = require('../../utils/projectRoles');
const { invalidateProjectCaches } = require('../../utils/cacheInvalidation');

module.exports = async (req, res) => {
  try {
    if (!req.body.name || !req.body.name.trim()) return res.status(400).json({ success: false, message: '请输入项目名称' });
    const clientId = req.body.client_id || null;

    const id = await withTransaction(async (conn) => {
      const projectId = await createProject({ ...req.body, client_id: clientId, internal_client_id: null, created_by: req.userId, enterprise_id: req.activeEnterpriseId || null }, conn);
      await conn.query(
        "INSERT IGNORE INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, 'owner', 'internal')",
        [projectId, req.userId]
      );
      return projectId;
    });

    ensureDefaultProjectRoles(id, req.userId).catch(() => {});

    if (req.body.template_id) {
      try {
        const [[tpl]] = await db.query('SELECT config FROM duijie_project_templates WHERE id = ? AND is_deleted = 0', [req.body.template_id]);
        if (tpl?.config) {
          const cfg = typeof tpl.config === 'string' ? JSON.parse(tpl.config) : tpl.config;
          if (cfg.tasks?.length) {
            for (let i = 0; i < cfg.tasks.length; i++) {
              const t = cfg.tasks[i];
              await db.query(
                'INSERT INTO duijie_tasks (project_id, title, description, priority, status, sort_order, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, t.title, t.description || '', t.priority || 'medium', 'submitted', i, req.userId]
              );
            }
          }
          if (cfg.presetTitles?.length) {
            await db.query(
              'INSERT INTO duijie_task_title_presets (project_id, preset_titles) VALUES (?, ?) ON DUPLICATE KEY UPDATE preset_titles = VALUES(preset_titles)',
              [id, JSON.stringify(cfg.presetTitles)]
            );
          }
        }
      } catch (_) {}
    }

    invalidateProjectCaches().catch(() => {});
    broadcast('project', 'created', { id, userId: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
