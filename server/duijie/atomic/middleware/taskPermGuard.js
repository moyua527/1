const db = require('../../config/db');
const { getProjectPerms } = require('../utils/projectPerms');

/**
 * 任务级权限守卫 — 从 task ID 反查 project_id 再校验项目角色权限
 *
 * @param {string|string[]} permFields  需要的权限字段（ANY 满足即可）
 * @param {{ taskIdParam?: string, fromBody?: string }} opts
 *   taskIdParam: 路由参数名（默认 'id'）
 *   fromBody:    如果 project_id 不在路由而在 body 里（如 POST /tasks 创建时）
 */
module.exports = (permFields, { taskIdParam = 'id', fromBody } = {}) => {
  const fields = Array.isArray(permFields) ? permFields : [permFields];
  return async (req, res, next) => {
    try {
      if (req.userRole === 'admin') return next();

      let projectId;

      if (fromBody) {
        projectId = req.body?.[fromBody];
      } else {
        const taskId = req.params?.[taskIdParam];
        if (!taskId) return res.status(400).json({ success: false, message: '缺少任务ID' });

        const [rows] = await db.query('SELECT project_id FROM duijie_tasks WHERE id = ?', [taskId]);
        if (!rows.length) return res.status(404).json({ success: false, message: '任务不存在' });
        projectId = rows[0].project_id;
      }

      if (!projectId) return res.status(400).json({ success: false, message: '缺少项目ID' });

      const perms = await getProjectPerms(req.userId, projectId);
      if (!perms) return res.status(403).json({ success: false, message: '无权访问此项目' });

      if (!fields.some(f => !!perms[f])) {
        return res.status(403).json({ success: false, message: '权限不足' });
      }

      req.projectPerms = perms;
      req.taskProjectId = projectId;
      return next();
    } catch (e) {
      return res.status(403).json({ success: false, message: '权限检查失败' });
    }
  };
};
