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
            er.can_edit_project AS er_can_edit_project, er.can_delete_project AS er_can_delete_project,
            er.can_set_client AS er_can_set_client,
            er.can_add_member AS er_can_add_member, er.can_remove_member AS er_can_remove_member,
            er.can_update_member_role AS er_can_update_member_role,
            er.can_manage_client_member AS er_can_manage_client_member,
            er.can_approve_join AS er_can_approve_join,
            er.can_manage_roles AS er_can_manage_roles,
            er.can_create_task AS er_can_create_task, er.can_delete_task AS er_can_delete_task,
            er.can_manage_task_flow AS er_can_manage_task_flow, er.can_manage_task_preset AS er_can_manage_task_preset,
            er.can_manage_milestone AS er_can_manage_milestone,
            er.can_view_report AS er_can_view_report, er.can_manage_app AS er_can_manage_app,
            er.can_create_project AS er_can_create_project,
            pr.can_edit_project AS pr_can_edit_project, pr.can_delete_project AS pr_can_delete_project,
            pr.can_set_client AS pr_can_set_client,
            pr.can_add_member AS pr_can_add_member, pr.can_remove_member AS pr_can_remove_member,
            pr.can_update_member_role AS pr_can_update_member_role,
            pr.can_manage_client_member AS pr_can_manage_client_member,
            pr.can_approve_join AS pr_can_approve_join,
            pr.can_manage_roles AS pr_can_manage_roles,
            pr.can_create_task AS pr_can_create_task, pr.can_delete_task AS pr_can_delete_task,
            pr.can_manage_task_flow AS pr_can_manage_task_flow, pr.can_manage_task_preset AS pr_can_manage_task_preset,
            pr.can_manage_milestone AS pr_can_manage_milestone,
            pr.can_view_report AS pr_can_view_report, pr.can_manage_app AS pr_can_manage_app
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
        const isCreator = entMember.role === 'creator';
        return {
          projectRole: null,
          source: null,
          enterpriseRoleId: null,
          enterpriseManager: true,
          can_create_project: true,
          can_edit_project: true,
          can_delete_project: isCreator,
          can_set_client: true,
          can_add_member: true,
          can_remove_member: true,
          can_update_member_role: true,
          can_manage_client_member: true,
          can_approve_join: true,
          can_manage_roles: false,
          can_create_task: true,
          can_delete_task: true,
          can_manage_task_flow: true,
          can_manage_task_preset: true,
          can_manage_milestone: true,
          can_view_report: true,
          can_manage_app: true,
        };
      }
    }
    return null;
  }

  const permFields = [
    'can_edit_project', 'can_delete_project', 'can_set_client',
    'can_add_member', 'can_remove_member', 'can_update_member_role',
    'can_manage_client_member', 'can_approve_join', 'can_manage_roles',
    'can_create_task', 'can_delete_task', 'can_manage_task_flow', 'can_manage_task_preset',
    'can_manage_milestone', 'can_view_report', 'can_manage_app',
  ];

  const buildPerms = (prefix, base = {}) => {
    const result = { ...base };
    permFields.forEach(f => { result[f] = !!member[`${prefix}_${f}`]; });
    return result;
  };

  // 优先级1：项目角色（project_role_id）
  if (member.project_role_id && member.pr_can_edit_project !== undefined && member.pr_can_edit_project !== null) {
    return buildPerms('pr', {
      projectRole: member.role,
      source: member.source,
      projectRoleId: member.project_role_id,
      enterpriseRoleId: member.enterprise_role_id,
      can_create_project: false,
    });
  }

  // 优先级2：企业角色（enterprise_role_id）
  if (member.enterprise_role_id && member.er_can_edit_project !== undefined && member.er_can_edit_project !== null) {
    const perms = buildPerms('er', {
      projectRole: member.role,
      source: member.source,
      projectRoleId: null,
      enterpriseRoleId: member.enterprise_role_id,
      can_create_project: !!member.er_can_create_project,
    });
    return perms;
  }
      can_manage_client: !!member.er_can_manage_client,
      can_view_report: !!member.er_can_view_report,
      can_manage_task: !!member.er_can_manage_task,
    };
  }

  const isOwner = member.role === 'owner';
  const isEditor = member.role === 'editor';

  // 如果是企业 creator/admin，即使项目角色不是 owner 也应有管理权限
  if (!isOwner && activeEnterpriseId) {
    const [[entMember]] = await db.query(
      "SELECT role FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND role IN ('creator','admin') AND is_deleted = 0 LIMIT 1",
      [activeEnterpriseId, userId]
    );
    if (entMember) {
      const isCreator = entMember.role === 'creator';
      return {
        projectRole: member.role,
        source: member.source,
        projectRoleId: null,
        enterpriseRoleId: null,
        enterpriseManager: true,
        can_create_project: true,
        can_edit_project: true,
        can_delete_project: isCreator,
        can_set_client: true,
        can_add_member: true,
        can_remove_member: true,
        can_update_member_role: true,
        can_manage_client_member: true,
        can_approve_join: true,
        can_manage_roles: false,
        can_create_task: true,
        can_delete_task: true,
        can_manage_task_flow: true,
        can_manage_task_preset: true,
        can_manage_milestone: true,
        can_view_report: true,
        can_manage_app: true,
      };
    }
  }

  // 遗留角色回退
  return {
    projectRole: member.role,
    source: member.source,
    projectRoleId: null,
    enterpriseRoleId: null,
    can_create_project: isOwner,
    can_edit_project: isOwner,
    can_delete_project: isOwner,
    can_set_client: isOwner,
    can_add_member: isOwner,
    can_remove_member: isOwner,
    can_update_member_role: isOwner,
    can_manage_client_member: isOwner,
    can_approve_join: isOwner,
    can_manage_roles: isOwner,
    can_create_task: isOwner || isEditor,
    can_delete_task: isOwner || isEditor,
    can_manage_task_flow: isOwner || isEditor,
    can_manage_task_preset: isOwner || isEditor,
    can_manage_milestone: isOwner,
    can_view_report: isOwner,
    can_manage_app: isOwner,
  };
}

module.exports = { getProjectPerms };
