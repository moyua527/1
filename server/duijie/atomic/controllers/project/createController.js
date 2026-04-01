const createProject = require('../../services/project/createProject');
const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { withTransaction } = require('../../utils/transaction');

module.exports = async (req, res) => {
  try {
    if (!req.body.name || !req.body.name.trim()) return res.status(400).json({ success: false, message: '请输入项目名称' });
    let clientId = req.body.client_id || null;
    let internalClientId = null;
    const [userRow] = await db.query('SELECT active_enterprise_id FROM voice_users WHERE id = ?', [req.userId]);
    internalClientId = userRow[0]?.active_enterprise_id || null;
    if (!clientId) {
      clientId = userRow[0]?.active_enterprise_id || null;
    }

    const id = await withTransaction(async (conn) => {
      const projectId = await createProject({ ...req.body, client_id: clientId, internal_client_id: internalClientId, created_by: req.userId }, conn);
      await conn.query(
        "INSERT IGNORE INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, 'owner', 'internal')",
        [projectId, req.userId]
      );
      return projectId;
    });

    broadcast('project', 'created', { id, userId: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
