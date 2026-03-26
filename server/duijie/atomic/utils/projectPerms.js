const db = require('../../config/db');

/**
 * 获取用户在指定项目中的有效权限（第二身份）
 * 优先级：项目级企业角色 > 平台角色
 * @param {number} userId
 * @param {number} projectId
 * @returns {object|null} 权限对象，null 表示不是项目成员
 */
async function getProjectPerms(userId, projectId) {
  const [[member]] = await db.query(
    `SELECT pm.role, pm.enterprise_role_id, pm.source,
            er.can_manage_members, er.can_manage_roles,
            er.can_create_project, er.can_edit_project, er.can_delete_project,
            er.can_manage_client, er.can_view_report, er.can_manage_task
     FROM duijie_project_members pm
     LEFT JOIN enterprise_roles er ON er.id = pm.enterprise_role_id AND er.is_deleted = 0
     WHERE pm.project_id = ? AND pm.user_id = ?`,
    [projectId, userId]
  );
  if (!member) return null;

  if (member.enterprise_role_id && member.can_edit_project !== null) {
    return {
      projectRole: member.role,
      source: member.source,
      enterpriseRoleId: member.enterprise_role_id,
      can_manage_members: !!member.can_manage_members,
      can_manage_roles: !!member.can_manage_roles,
      can_create_project: !!member.can_create_project,
      can_edit_project: !!member.can_edit_project,
      can_delete_project: !!member.can_delete_project,
      can_manage_client: !!member.can_manage_client,
      can_view_report: !!member.can_view_report,
      can_manage_task: !!member.can_manage_task,
    };
  }

  const isOwner = member.role === 'owner';
  return {
    projectRole: member.role,
    source: member.source,
    enterpriseRoleId: null,
    can_manage_members: isOwner,
    can_manage_roles: isOwner,
    can_create_project: isOwner,
    can_edit_project: isOwner,
    can_delete_project: isOwner,
    can_manage_client: isOwner,
    can_view_report: isOwner,
    can_manage_task: isOwner || member.role === 'editor',
  };
}

module.exports = { getProjectPerms };
