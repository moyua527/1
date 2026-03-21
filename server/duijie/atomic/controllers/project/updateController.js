const updateProject = require('../../services/project/updateProject');
const db = require('../../../config/db');
const getSubordinateIds = require('../../utils/getSubordinateIds');

module.exports = async (req, res) => {
  try {
    const role = req.userRole;
    const uid = req.userId;
    const pid = req.params.id;

    if (role !== 'admin') {
      if (role === 'sales_manager') {
        const teamIds = await getSubordinateIds(uid);
        const ph = teamIds.map(() => '?').join(',');
        const [rows] = await db.query(
          `SELECT 1 FROM duijie_projects WHERE id = ? AND is_deleted = 0 AND (
            created_by IN (${ph}) OR id IN (SELECT project_id FROM duijie_project_members WHERE user_id IN (${ph}))
          )`, [pid, ...teamIds, ...teamIds]
        );
        if (rows.length === 0) return res.status(403).json({ success: false, message: '无权编辑此项目' });
      } else {
        const [rows] = await db.query(
          'SELECT 1 FROM duijie_projects WHERE id = ? AND created_by = ? UNION SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
          [pid, uid, pid, uid]
        );
        if (rows.length === 0) return res.status(403).json({ success: false, message: '无权编辑此项目' });
      }
    }

    await updateProject(pid, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
