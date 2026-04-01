const updateProject = require('../../services/project/updateProject');
const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { normalizeProjectClientId } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    const pid = req.params.id;
    const body = { ...req.body };

    if ('client_id' in body) {
      const [[project]] = await db.query('SELECT internal_client_id FROM duijie_projects WHERE id = ? AND is_deleted = 0', [pid]);
      if (project) {
        body.client_id = await normalizeProjectClientId(body.client_id, project.internal_client_id);
      }
    }

    await updateProject(pid, body);
    broadcast('project', 'updated', { id: pid, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
