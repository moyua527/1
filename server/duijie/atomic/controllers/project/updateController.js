const updateProject = require('../../services/project/updateProject');
const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { normalizeProjectClientId } = require('../../services/accessScope');
const logger = require('../../../config/logger');

module.exports = async (req, res) => {
  try {
    const pid = req.params.id;
    const body = { ...req.body };

    if ('client_id' in body) {
      const [[project]] = await db.query('SELECT internal_client_id, client_id FROM duijie_projects WHERE id = ? AND is_deleted = 0', [pid]);
      if (project) {
        body.client_id = await normalizeProjectClientId(body.client_id, project.internal_client_id);

        // 客户企业变更时，移除旧客户方的项目成员
        const oldClientId = project.client_id ? Number(project.client_id) : null;
        const newClientId = body.client_id ? Number(body.client_id) : null;
        if (oldClientId && oldClientId !== newClientId && oldClientId !== Number(project.internal_client_id)) {
          const [removed] = await db.query(
            "DELETE FROM duijie_project_members WHERE project_id = ? AND source = 'client'",
            [pid]
          );
          logger.info(`project-update: removed ${removed.affectedRows} client members from project ${pid} (old client_id=${oldClientId})`);
        }
      }
    }

    await updateProject(pid, body);
    broadcast('project', 'updated', { id: pid, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    logger.error(`project-update: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
