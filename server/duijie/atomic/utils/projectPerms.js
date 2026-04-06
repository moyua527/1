const db = require('../../config/db');
const { PROJECT_ROLE_FIELDS } = require('./projectRoles');

const ER_TO_PR_MAP = {
  can_edit_project:        ['can_edit_project_name', 'can_edit_project_desc', 'can_edit_project_status'],
  can_delete_project:      ['can_delete_project'],
  can_add_member:          ['can_add_member', 'can_assign_member_proj_role'],
  can_remove_member:       ['can_remove_member'],
  can_approve_join:        ['can_approve_join', 'can_reject_join'],
  can_manage_roles:        ['can_create_role', 'can_edit_role_name', 'can_edit_role_perms', 'can_delete_role'],
  can_create_task:         ['can_create_task'],
  can_delete_task:         ['can_delete_task'],
  can_manage_task_flow:    ['can_move_task_accept', 'can_move_task_dispute', 'can_move_task_supplement',
                            'can_move_task_submit_review', 'can_move_task_reject', 'can_move_task_approve', 'can_move_task_resubmit',
                            'can_edit_task_title', 'can_edit_task_desc', 'can_edit_task_priority', 'can_edit_task_deadline',
                            'can_assign_task', 'can_upload_task_attachment', 'can_delete_task_attachment',
                            'can_add_review_point', 'can_respond_review_point', 'can_confirm_review_point'],
  can_view_report:         ['can_export_data'],
  can_manage_app:          ['can_manage_app_config'],
};
const ER_FIELDS = Object.keys(ER_TO_PR_MAP);

function allPerms(val) {
  const obj = {};
  PROJECT_ROLE_FIELDS.forEach(f => { obj[f] = val; });
  return obj;
}

function expandErPerms(erRow) {
  const result = {};
  ER_FIELDS.forEach(erField => {
    const on = !!erRow[erField];
    ER_TO_PR_MAP[erField].forEach(prField => { result[prField] = on; });
  });
  return result;
}

function buildManagerPerms(isCreator) {
  const perms = allPerms(true);
  if (!isCreator) perms.can_delete_project = false;
  return perms;
}

/**
 * 获取用户在指定项目中的有效权限（60 个细粒度字段）
 * 优先级：项目角色 > 企业角色（展开映射） > 企业管理人员 > 遗留角色回退
 */
async function getProjectPerms(userId, projectId) {

  const prSelect = PROJECT_ROLE_FIELDS.map(f => `pr.${f} AS pr_${f}`).join(', ');
  const erSelect = ER_FIELDS.map(f => `er.${f} AS er_${f}`).join(', ');

  const [[member]] = await db.query(
    `SELECT pm.role, pm.enterprise_role_id, pm.project_role_id, pm.source,
            er.can_create_project AS er_can_create_project,
            ${erSelect}, ${prSelect}
     FROM duijie_project_members pm
     LEFT JOIN enterprise_roles er ON er.id = pm.enterprise_role_id AND er.is_deleted = 0
     LEFT JOIN project_roles pr ON pr.id = pm.project_role_id AND pr.is_deleted = 0
     WHERE pm.project_id = ? AND pm.user_id = ?`,
    [projectId, userId]
  );

  if (!member) {
    return null;
  }

  const base = { projectRole: member.role, source: member.source, projectRoleId: member.project_role_id, enterpriseRoleId: member.enterprise_role_id };

  // 优先级1：项目角色（60字段直读）
  if (member.project_role_id && member[`pr_${PROJECT_ROLE_FIELDS[0]}`] !== undefined && member[`pr_${PROJECT_ROLE_FIELDS[0]}`] !== null) {
    const perms = { ...base, can_create_project: false };
    PROJECT_ROLE_FIELDS.forEach(f => { perms[f] = !!member[`pr_${f}`]; });
    return perms;
  }

  // 优先级2：企业角色（16字段展开为60）
  if (member.enterprise_role_id && member.er_can_edit_project !== undefined && member.er_can_edit_project !== null) {
    const erRow = {};
    ER_FIELDS.forEach(f => { erRow[f] = member[`er_${f}`]; });
    return {
      ...base, projectRoleId: null,
      can_create_project: !!member.er_can_create_project,
      ...expandErPerms(erRow),
    };
  }

  // 遗留角色回退
  const isOwner = member.role === 'owner';
  const isEditor = member.role === 'editor';
  const ownerPerms = allPerms(false);
  PROJECT_ROLE_FIELDS.forEach(f => { ownerPerms[f] = isOwner; });
  if (isEditor) {
    const editorOn = [
      'can_create_task', 'can_delete_task',
      'can_edit_task_title', 'can_edit_task_desc', 'can_edit_task_priority', 'can_edit_task_deadline',
      'can_assign_task',
      'can_move_task_accept', 'can_move_task_dispute', 'can_move_task_supplement',
      'can_move_task_submit_review', 'can_move_task_reject', 'can_move_task_approve', 'can_move_task_resubmit',
      'can_upload_task_attachment', 'can_delete_task_attachment',
      'can_add_review_point', 'can_respond_review_point', 'can_confirm_review_point',
    ];
    editorOn.forEach(f => { ownerPerms[f] = true; });
  }
  return { ...base, projectRoleId: null, enterpriseRoleId: null, can_create_project: isOwner, ...ownerPerms };
}

module.exports = { getProjectPerms };
