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

    invalidateProjectCaches().catch(() => {});
    broadcast('project', 'created', { id, userId: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
