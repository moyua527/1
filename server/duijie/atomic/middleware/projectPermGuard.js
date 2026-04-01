const { getProjectPerms } = require('../utils/projectPerms');

/**
 * 项目权限守卫中间件
 * 集中化替代 controller 中的 ad-hoc 权限检查
 *
 * @param {string} permField - 需要检查的权限字段，对应 projectPerms 返回的字段
 *   如 'can_manage_members', 'can_edit_project', 'can_delete_project', 'can_manage_tasks' 等
 * @param {{ projectIdParam?: string }} opts - 可选参数，指定路由中项目ID的参数名
 */
module.exports = (permField, { projectIdParam = 'id' } = {}) => {
  return async (req, res, next) => {
    try {
      // admin 跳过项目级权限检查
      if (req.userRole === 'admin') return next();

      const projectId = req.params?.[projectIdParam];
      if (!projectId) {
        return res.status(400).json({ success: false, message: '缺少项目ID' });
      }

      const perms = await getProjectPerms(req.userId, projectId);
      if (!perms) {
        return res.status(403).json({ success: false, message: '无权访问此项目' });
      }
      if (!perms[permField]) {
        return res.status(403).json({ success: false, message: '权限不足' });
      }

      // 将权限信息挂载到 req 上，供 controller 使用
      req.projectPerms = perms;
      return next();
    } catch (e) {
      return res.status(403).json({ success: false, message: '权限检查失败' });
    }
  };
};
