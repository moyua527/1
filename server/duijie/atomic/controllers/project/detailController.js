const getProjectDetail = require('../../services/project/getProjectDetail');
const db = require('../../../config/db');
const { getUserActiveEnterpriseId } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    const data = await getProjectDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: '项目不存在' });

    const role = req.userRole;
    const uid = req.userId;
    let allowed = false;

    if (role === 'admin') {
      allowed = true;
    } else {
      const [rows] = await db.query(
        'SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ? UNION SELECT 1 FROM duijie_projects WHERE id = ? AND created_by = ?',
        [req.params.id, uid, req.params.id, uid]
      );
      allowed = rows.length > 0;

      // 企业管理人员（creator/admin）可以访问本企业关联的项目
      if (!allowed) {
        const activeEntId = await getUserActiveEnterpriseId(uid);
        if (activeEntId) {
          const projClientId = data.client_id ? Number(data.client_id) : null;
          const projInternalId = data.internal_client_id ? Number(data.internal_client_id) : null;
          if (projClientId === activeEntId || projInternalId === activeEntId) {
            const [[entMember]] = await db.query(
              "SELECT 1 FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND role IN ('creator','admin') AND is_deleted = 0 LIMIT 1",
              [activeEntId, uid]
            );
            if (entMember) allowed = true;
          }
        }
      }
    }

    if (!allowed) return res.status(403).json({ success: false, message: '无权访问此项目' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
