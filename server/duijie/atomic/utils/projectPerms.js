const db = require('../../config/db');
const { getUserActiveEnterpriseId } = require('../services/accessScope');

/**
 * 获取用户在指定项目中的有效权限（第二身份）
 * 优先级：项目级企业角色 > 平台角色
 * 增加企业范围隔离：项目必须属于用户活跃企业
 * @param {number} userId
 * @param {number} projectId
 * @returns {object|null} 权限对象，null 表示不是项目成员
 */
async function getProjectPerms(userId, projectId) {
  // 企业范围隔离
  const activeEnterpriseId = await getUserActiveEnterpriseId(userId);
  if (activeEnterpriseId) {
    const [[project]] = await db.query(
      'SELECT client_id, internal_client_id FROM duijie_projects WHERE id = ? AND is_deleted = 0 LIMIT 1',
      [projectId]
    );
    if (!project) return null;
    const clientId = project.client_id ? Number(project.client_id) : null;
    const internalClientId = project.internal_client_id ? Number(project.internal_client_id) : null;
    if (clientId !== activeEnterpriseId && internalClientId !== activeEnterpriseId) {
      return null;
    }
  }

  const [[member]] = await db.query(
    `SELECT pm.role, pm.enterprise_role_id, pm.project_role_id, pm.source,
            er.can_manage_members AS er_can_manage_members, er.can_manage_roles AS er_can_manage_roles,
            er.can_create_project AS er_can_create_project, er.can_edit_project AS er_can_edit_project,
            er.can_delete_project AS er_can_delete_project, er.can_manage_client AS er_can_manage_client,
            er.can_view_report AS er_can_view_report, er.can_manage_task AS er_can_manage_task,
            pr.can_manage_members AS pr_can_manage_members, pr.can_manage_roles AS pr_can_manage_roles,
            pr.can_edit_project AS pr_can_edit_project, pr.can_delete_project AS pr_can_delete_project,
            pr.can_manage_client AS pr_can_manage_client, pr.can_view_report AS pr_can_view_report,
            pr.can_manage_task AS pr_can_manage_task
     FROM duijie_project_members pm
     LEFT JOIN enterprise_roles er ON er.id = pm.enterprise_role_id AND er.is_deleted = 0
     LEFT JOIN project_roles pr ON pr.id = pm.project_role_id AND pr.is_deleted = 0
     WHERE pm.project_id = ? AND pm.user_id = ?`,
    [projectId, userId]
  );
  if (!member) {
    // 非项目成员：检查是否企业管理人员（creator/admin）
    if (activeEnterpriseId) {
      const [[entMember]] = await db.query(
        "SELECT role FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND role IN ('creator','admin') AND is_deleted = 0 LIMIT 1",
        [activeEnterpriseId, userId]
      );
      if (entMember) {
        return {
          projectRole: null,
          source: null,
          enterpriseRoleId: null,
          enterpriseManager: true,
          can_manage_members: true,
          can_manage_roles: false,
          can_create_project: true,
          can_edit_project: true,
          can_delete_project: entMember.role === 'creator',
          can_manage_client: true,
          can_view_report: true,
          can_manage_task: true,
        };
      }
    }
    return null;
  }

  // 优先级1：项目角色（project_role_id）
  if (member.project_role_id && member.pr_can_edit_project !== null) {
    return {
      projectRole: member.role,
      source: member.source,
      projectRoleId: member.project_role_id,
      enterpriseRoleId: member.enterprise_role_id,
      can_manage_members: !!member.pr_can_manage_members,
      can_manage_roles: !!member.pr_can_manage_roles,
      can_create_project: false,
      can_edit_project: !!member.pr_can_edit_project,
      can_delete_project: !!member.pr_can_delete_project,
      can_manage_client: !!member.pr_can_manage_client,
      can_view_report: !!member.pr_can_view_report,
      can_manage_task: !!member.pr_can_manage_task,
    };
  }

  // 优先级2：企业角色（enterprise_role_id）
  if (member.enterprise_role_id && member.er_can_edit_project !== null) {
    return {
      projectRole: member.role,
      source: member.source,
      projectRoleId: null,
      enterpriseRoleId: member.enterprise_role_id,
      can_manage_members: !!member.er_can_manage_members,
      can_manage_roles: !!member.er_can_manage_roles,
      can_create_project: !!member.er_can_create_project,
      can_edit_project: !!member.er_can_edit_project,
      can_delete_project: !!member.er_can_delete_project,
      can_manage_client: !!member.er_can_manage_client,
      can_view_report: !!member.er_can_view_report,
      can_manage_task: !!member.er_can_manage_task,
    };
  }

  const isOwner = member.role === 'owner';

  // 如果是企业 creator/admin，即使项目角色不是 owner 也应有管理权限
  if (!isOwner && activeEnterpriseId) {
    const [[entMember]] = await db.query(
      "SELECT role FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND role IN ('creator','admin') AND is_deleted = 0 LIMIT 1",
      [activeEnterpriseId, userId]
    );
    if (entMember) {
      return {
        projectRole: member.role,
        source: member.source,
        projectRoleId: null,
        enterpriseRoleId: null,
        enterpriseManager: true,
        can_manage_members: true,
        can_manage_roles: false,
        can_create_project: true,
        can_edit_project: true,
        can_delete_project: entMember.role === 'creator',
        can_manage_client: true,
        can_view_report: true,
        can_manage_task: true,
      };
    }
  }

  return {
    projectRole: member.role,
    source: member.source,
    projectRoleId: null,
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
