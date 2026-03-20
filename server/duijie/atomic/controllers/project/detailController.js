const getProjectDetail = require('../../services/project/getProjectDetail');
const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const data = await getProjectDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: '项目不存在' });

    if (req.userRole === 'client' && req.clientId && data.client_id !== req.clientId) {
      return res.status(403).json({ success: false, message: '无权访问此项目' });
    }
    if (req.userRole === 'member') {
      const [rows] = await db.query(
        'SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ? UNION SELECT 1 FROM duijie_projects WHERE id = ? AND created_by = ?',
        [req.params.id, req.userId, req.params.id, req.userId]
      );
      if (rows.length === 0) return res.status(403).json({ success: false, message: '无权访问此项目' });
    }

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
