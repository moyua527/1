const db = require('../../config/db');
const { getProjectPerms } = require('../utils/projectPerms');

/**
 * 审核要点/附件 权限守卫 — 从 pointId/attachmentId 反查 task → project_id
 */
module.exports = (permFields, { paramName = 'pointId', table = 'duijie_task_review_points', fk = 'task_id' } = {}) => {
  const fields = Array.isArray(permFields) ? permFields : [permFields];
  return async (req, res, next) => {
    try {
      if (req.userRole === 'admin') return next();

      const itemId = req.params?.[paramName];
      if (!itemId) return res.status(400).json({ success: false, message: '缺少ID' });

      const [rows] = await db.query(
        `SELECT t.project_id FROM ${table} r JOIN duijie_tasks t ON t.id = r.${fk} WHERE r.id = ?`,
        [itemId]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: '记录不存在' });

      const perms = await getProjectPerms(req.userId, rows[0].project_id);
      if (!perms) return res.status(403).json({ success: false, message: '无权访问此项目' });
      if (!fields.some(f => !!perms[f])) return res.status(403).json({ success: false, message: '权限不足' });

      req.projectPerms = perms;
      return next();
    } catch (e) {
      return res.status(403).json({ success: false, message: '权限检查失败' });
    }
  };
};
