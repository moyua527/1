const db = require('../../config/db');

const PROJECT_ROLE_FIELDS = [
  // 项目信息管理
  'can_edit_project_name', 'can_edit_project_desc', 'can_edit_project_status',
  'can_delete_project',
  // 关联客户企业
  'can_send_client_request', 'can_cancel_client_link', 'can_change_client_link',
  // 我方成员管理
  'can_add_member', 'can_assign_member_legacy_role', 'can_assign_member_ent_role', 'can_assign_member_proj_role',
  'can_remove_member',
  // 修改成员角色
  'can_update_member_legacy_role', 'can_update_member_ent_role', 'can_update_member_proj_role',
  // 客户方成员
  'can_view_client_users', 'can_add_client_member', 'can_remove_client_member',
  // 加入审批
  'can_view_join_requests', 'can_approve_join', 'can_reject_join',
  // 角色管理
  'can_create_role', 'can_edit_role_name', 'can_edit_role_color', 'can_edit_role_perms', 'can_delete_role',
  // 任务创建
  'can_create_task', 'can_create_task_with_attachment',
  // 任务删除与恢复
  'can_delete_task', 'can_view_task_trash', 'can_restore_task',
  // 任务状态流转
  'can_move_task_accept', 'can_move_task_dispute', 'can_move_task_supplement',
  'can_move_task_submit_review', 'can_move_task_reject', 'can_move_task_approve', 'can_move_task_resubmit',
  // 任务编辑
  'can_edit_task_title', 'can_edit_task_desc', 'can_edit_task_priority', 'can_edit_task_deadline',
  'can_assign_task',
  // 任务附件
  'can_upload_task_attachment', 'can_delete_task_attachment',
  // 审核要点
  'can_add_review_point', 'can_respond_review_point', 'can_confirm_review_point',
  // 任务预设标题
  'can_view_title_options', 'can_record_title_history', 'can_delete_title_history', 'can_edit_title_presets',
  // 里程碑
  'can_create_milestone', 'can_edit_milestone', 'can_delete_milestone', 'can_toggle_milestone',
  // 报表
  'can_view_report', 'can_export_data',
  // 应用/集成
  'can_manage_app_config', 'can_manage_app_integration',
];

const LEGACY_ROLE_LABELS = {
  owner: '负责人',
  editor: '编辑者',
  viewer: '查看者',
};

const DEFAULT_PROJECT_ROLE_PRESETS = [
  {
    role_key: 'owner', name: '负责人', color: '#2563eb', sort_order: 0, is_default: 1,
    ...Object.fromEntries(PROJECT_ROLE_FIELDS.map(f => [f, 1])),
  },
  {
    role_key: 'editor', name: '项目编辑', color: '#059669', sort_order: 1, is_default: 1,
    ...Object.fromEntries(PROJECT_ROLE_FIELDS.map(f => [f, 0])),
    // 任务创建
    can_create_task: 1, can_create_task_with_attachment: 1,
    // 任务删除与恢复
    can_delete_task: 1, can_view_task_trash: 1, can_restore_task: 1,
    // 任务状态流转
    can_move_task_accept: 1, can_move_task_dispute: 1, can_move_task_supplement: 1,
    can_move_task_submit_review: 1, can_move_task_reject: 1, can_move_task_approve: 1, can_move_task_resubmit: 1,
    // 任务编辑
    can_edit_task_title: 1, can_edit_task_desc: 1, can_edit_task_priority: 1, can_edit_task_deadline: 1,
    can_assign_task: 1,
    // 任务附件
    can_upload_task_attachment: 1, can_delete_task_attachment: 1,
    // 审核要点
    can_add_review_point: 1, can_respond_review_point: 1, can_confirm_review_point: 1,
    // 任务预设标题
    can_view_title_options: 1, can_record_title_history: 1, can_delete_title_history: 1, can_edit_title_presets: 1,
  },
  {
    role_key: 'viewer', name: '项目查看', color: '#64748b', sort_order: 2, is_default: 1,
    ...Object.fromEntries(PROJECT_ROLE_FIELDS.map(f => [f, 0])),
  },
];

async function getProjectCreatorId(projectId, conn = db) {
  const [rows] = await conn.query(
    'SELECT created_by FROM duijie_projects WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [projectId]
  );
  return rows[0]?.created_by || null;
}

async function listProjectRoles(projectId, conn = db) {
  const [rows] = await conn.query(
    'SELECT * FROM project_roles WHERE project_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC',
    [projectId]
  );
  return rows;
}

async function listEnterpriseProjectRoles(enterpriseId, conn = db) {
  const [rows] = await conn.query(
    'SELECT * FROM project_roles WHERE enterprise_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC',
    [enterpriseId]
  );
  return rows;
}

async function ensureDefaultProjectRoles(projectId, createdBy = null, conn = db) {
  const existing = await listProjectRoles(projectId, conn);
  if (existing.length > 0) return existing;

  const roleCreatorId = createdBy || await getProjectCreatorId(projectId, conn);
  for (const preset of DEFAULT_PROJECT_ROLE_PRESETS) {
    await conn.query(
      `INSERT INTO project_roles (
        project_id, role_key, name, color, ${PROJECT_ROLE_FIELDS.join(', ')}, sort_order, is_default, created_by
      ) VALUES (?, ?, ?, ?, ${PROJECT_ROLE_FIELDS.map(() => '?').join(', ')}, ?, ?, ?)`,
      [
        projectId,
        preset.role_key,
        preset.name,
        preset.color,
        ...PROJECT_ROLE_FIELDS.map(field => preset[field]),
        preset.sort_order,
        preset.is_default,
        roleCreatorId,
      ]
    );
  }

  const roles = await listProjectRoles(projectId, conn);
  const roleIdMap = {};
  roles.forEach(role => {
    if (role.role_key) roleIdMap[role.role_key] = role.id;
  });

  for (const roleKey of Object.keys(roleIdMap)) {
    await conn.query(
      'UPDATE duijie_project_members SET project_role_id = ? WHERE project_id = ? AND role = ? AND project_role_id IS NULL',
      [roleIdMap[roleKey], projectId, roleKey]
    );
  }

  return roles;
}

async function ensureDefaultEnterpriseProjectRoles(enterpriseId, createdBy = null, conn = db) {
  const existing = await listEnterpriseProjectRoles(enterpriseId, conn);
  if (existing.length > 0) return existing;

  for (const preset of DEFAULT_PROJECT_ROLE_PRESETS) {
    await conn.query(
      `INSERT INTO project_roles (
        enterprise_id, role_key, name, color, ${PROJECT_ROLE_FIELDS.join(', ')}, sort_order, is_default, created_by
      ) VALUES (?, ?, ?, ?, ${PROJECT_ROLE_FIELDS.map(() => '?').join(', ')}, ?, ?, ?)`,
      [
        enterpriseId,
        preset.role_key,
        preset.name,
        preset.color,
        ...PROJECT_ROLE_FIELDS.map(field => preset[field]),
        preset.sort_order,
        preset.is_default,
        createdBy,
      ]
    );
  }

  return listEnterpriseProjectRoles(enterpriseId, conn);
}

async function findProjectRole(projectId, roleId, conn = db) {
  const [rows] = await conn.query(
    'SELECT * FROM project_roles WHERE id = ? AND project_id = ? AND is_deleted = 0 LIMIT 1',
    [roleId, projectId]
  );
  return rows[0] || null;
}

async function findEnterpriseProjectRole(enterpriseId, roleId, conn = db) {
  const [rows] = await conn.query(
    'SELECT * FROM project_roles WHERE id = ? AND enterprise_id = ? AND is_deleted = 0 LIMIT 1',
    [roleId, enterpriseId]
  );
  return rows[0] || null;
}

async function resolveProjectRoleId(projectId, legacyRole = 'viewer', requestedRoleId = null, conn = db) {
  if (requestedRoleId) {
    const [rows] = await conn.query('SELECT * FROM project_roles WHERE id = ? AND is_deleted = 0 LIMIT 1', [requestedRoleId]);
    return rows[0] ? rows[0].id : null;
  }
  const roles = await ensureDefaultProjectRoles(projectId, null, conn);
  return roles.find(role => role.role_key === legacyRole)?.id || null;
}

function normalizeProjectRolePerms(body = {}) {
  const perms = {};
  PROJECT_ROLE_FIELDS.forEach(field => {
    perms[field] = body[field] ? 1 : 0;
  });
  return perms;
}

function getLegacyProjectRoleLabel(role) {
  return LEGACY_ROLE_LABELS[role] || LEGACY_ROLE_LABELS.viewer;
}

module.exports = {
  PROJECT_ROLE_FIELDS,
  ensureDefaultProjectRoles,
  ensureDefaultEnterpriseProjectRoles,
  listProjectRoles,
  listEnterpriseProjectRoles,
  findProjectRole,
  findEnterpriseProjectRole,
  resolveProjectRoleId,
  normalizeProjectRolePerms,
  getLegacyProjectRoleLabel,
};
