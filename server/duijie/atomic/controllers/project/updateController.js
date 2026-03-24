const updateProject = require('../../services/project/updateProject');
const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const role = req.userRole;
    const uid = req.userId;
    const pid = req.params.id;

    if (role !== 'admin') {
      const [rows] = await db.query(
        'SELECT 1 FROM duijie_projects WHERE id = ? AND created_by = ? UNION SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
        [pid, uid, pid, uid]
      );
      if (rows.length === 0) return res.status(403).json({ success: false, message: '无权编辑此项目' });
    }

    await updateProject(pid, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
