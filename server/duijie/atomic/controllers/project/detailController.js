const getProjectDetail = require('../../services/project/getProjectDetail');
const db = require('../../../config/db');
const getSubordinateIds = require('../../utils/getSubordinateIds');

module.exports = async (req, res) => {
  try {
    const data = await getProjectDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: '项目不存在' });

    const role = req.userRole;
    const uid = req.userId;
    let allowed = false;

    if (role === 'admin' || role === 'viewer') {
      allowed = true;
    } else if (role === 'sales_manager') {
      const teamIds = await getSubordinateIds(uid);
      const ph = teamIds.map(() => '?').join(',');
      const [rows] = await db.query(
        `SELECT 1 FROM duijie_projects p WHERE p.id = ? AND p.is_deleted = 0 AND (
          p.client_id IN (SELECT id FROM duijie_clients WHERE (assigned_to IN (${ph}) OR created_by IN (${ph})) AND is_deleted = 0)
          OR p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?)
        )`, [req.params.id, ...teamIds, ...teamIds, uid, uid]
      );
      allowed = rows.length > 0;
    } else if (role === 'client') {
      const [rows] = await db.query(
        'SELECT 1 FROM duijie_projects p WHERE p.id = ? AND p.client_id IN (SELECT id FROM duijie_clients WHERE user_id = ? AND is_deleted = 0)',
        [req.params.id, uid]
      );
      allowed = rows.length > 0;
    } else {
      const [rows] = await db.query(
        'SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ? UNION SELECT 1 FROM duijie_projects WHERE id = ? AND created_by = ?',
        [req.params.id, uid, req.params.id, uid]
      );
      allowed = rows.length > 0;
    }

    if (!allowed) return res.status(403).json({ success: false, message: '无权访问此项目' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
