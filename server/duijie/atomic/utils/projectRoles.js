const db = require('../../config/db');

const PROJECT_ROLE_FIELDS = [
  'can_edit_project',
  'can_delete_project',
  'can_set_client',
  'can_add_member',
  'can_remove_member',
  'can_update_member_role',
  'can_manage_client_member',
  'can_approve_join',
  'can_manage_roles',
  'can_create_task',
  'can_delete_task',
  'can_manage_task_flow',
  'can_manage_task_preset',
  'can_manage_milestone',
  'can_view_report',
  'can_manage_app',
];

const LEGACY_ROLE_LABELS = {
  owner: '负责人',
  editor: '编辑者',
  viewer: '查看者',
};

const DEFAULT_PROJECT_ROLE_PRESETS = [
  {
    role_key: 'owner',
    name: '负责人',
    color: '#2563eb',
    sort_order: 0,
    is_default: 1,
    can_edit_project: 1,
    can_delete_project: 1,
    can_set_client: 1,
    can_add_member: 1,
    can_remove_member: 1,
    can_update_member_role: 1,
    can_manage_client_member: 1,
    can_approve_join: 1,
    can_manage_roles: 1,
    can_create_task: 1,
    can_delete_task: 1,
    can_manage_task_flow: 1,
    can_manage_task_preset: 1,
    can_manage_milestone: 1,
    can_view_report: 1,
    can_manage_app: 1,
  },
  {
    role_key: 'editor',
    name: '编辑者',
    color: '#059669',
    sort_order: 1,
    is_default: 1,
    can_edit_project: 0,
    can_delete_project: 0,
    can_set_client: 0,
    can_add_member: 0,
    can_remove_member: 0,
    can_update_member_role: 0,
    can_manage_client_member: 0,
    can_approve_join: 0,
    can_manage_roles: 0,
    can_create_task: 1,
    can_delete_task: 1,
    can_manage_task_flow: 1,
    can_manage_task_preset: 1,
    can_manage_milestone: 0,
    can_view_report: 0,
    can_manage_app: 0,
  },
  {
    role_key: 'viewer',
    name: '查看者',
    color: '#64748b',
    sort_order: 2,
    is_default: 1,
    can_edit_project: 0,
    can_delete_project: 0,
    can_set_client: 0,
    can_add_member: 0,
    can_remove_member: 0,
    can_update_member_role: 0,
    can_manage_client_member: 0,
    can_approve_join: 0,
    can_manage_roles: 0,
    can_create_task: 0,
    can_delete_task: 0,
    can_manage_task_flow: 0,
    can_manage_task_preset: 0,
    can_manage_milestone: 0,
    can_view_report: 0,
    can_manage_app: 0,
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

async function findProjectRole(projectId, roleId, conn = db) {
  const [rows] = await conn.query(
    'SELECT * FROM project_roles WHERE id = ? AND project_id = ? AND is_deleted = 0 LIMIT 1',
    [roleId, projectId]
  );
  return rows[0] || null;
}

async function resolveProjectRoleId(projectId, legacyRole = 'viewer', requestedRoleId = null, conn = db) {
  if (requestedRoleId) {
    const role = await findProjectRole(projectId, requestedRoleId, conn);
    return role ? role.id : null;
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
  listProjectRoles,
  findProjectRole,
  resolveProjectRoleId,
  normalizeProjectRolePerms,
  getLegacyProjectRoleLabel,
};
