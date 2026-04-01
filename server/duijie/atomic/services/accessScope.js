const db = require('../../config/db');

async function isUserInEnterprise(userId, enterpriseId) {
  if (!enterpriseId) return false;
  const [[row]] = await db.query(
    `SELECT c.id
     FROM duijie_clients c
     LEFT JOIN duijie_client_members m ON m.client_id = c.id AND m.user_id = ? AND m.is_deleted = 0
     WHERE c.id = ?
       AND c.client_type = 'company'
       AND c.is_deleted = 0
       AND (c.user_id = ? OR m.id IS NOT NULL)
     LIMIT 1`,
    [userId, enterpriseId, userId]
  );
  return !!row;
}

async function getUserActiveEnterpriseId(userId) {
  const [[userRow]] = await db.query(
    'SELECT active_enterprise_id FROM voice_users WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [userId]
  );
  const enterpriseId = userRow?.active_enterprise_id ? Number(userRow.active_enterprise_id) : null;
  if (!enterpriseId) return null;
  const allowed = await isUserInEnterprise(userId, enterpriseId);
  return allowed ? enterpriseId : null;
}

async function getEnterpriseMemberUserIds(enterpriseId) {
  if (!enterpriseId) return [];
  const [rows] = await db.query(
    `SELECT DISTINCT t.user_id
     FROM (
       SELECT c.user_id as user_id
       FROM duijie_clients c
       WHERE c.id = ? AND c.client_type = 'company' AND c.is_deleted = 0 AND c.user_id IS NOT NULL
       UNION
       SELECT m.user_id
       FROM duijie_client_members m
       WHERE m.client_id = ? AND m.is_deleted = 0 AND m.user_id IS NOT NULL
     ) t
     WHERE t.user_id IS NOT NULL`,
    [enterpriseId, enterpriseId]
  );
  return rows.map(row => Number(row.user_id)).filter(Boolean);
}

async function listEnterpriseUsers(enterpriseId, excludeUserIds = [], activeOnly = true) {
  const userIds = await getEnterpriseMemberUserIds(enterpriseId);
  const excludeSet = new Set((excludeUserIds || []).map(id => Number(id)).filter(Boolean));
  const scopedUserIds = userIds.filter(id => !excludeSet.has(Number(id)));
  if (scopedUserIds.length === 0) return [];

  let sql = 'SELECT id, username, nickname, role FROM voice_users WHERE is_deleted = 0';
  if (activeOnly) sql += ' AND is_active = 1';
  sql += ` AND id IN (${scopedUserIds.map(() => '?').join(',')}) ORDER BY nickname, username`;
  const [rows] = await db.query(sql, scopedUserIds);
  return rows;
}

function uniqueNumericIds(ids = []) {
  return [...new Set((ids || []).map(id => Number(id)).filter(Boolean))];
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function hasExternalEnterprise(project) {
  const clientId = toNullableNumber(project?.client_id);
  const internalClientId = toNullableNumber(project?.internal_client_id);
  const clientOwnerUserId = toNullableNumber(project?.client_owner_user_id);
  const internalClientOwnerUserId = toNullableNumber(project?.internal_client_owner_user_id);

  if (!clientId) return false;
  if (internalClientId && clientId === internalClientId) return false;
  if (clientOwnerUserId && internalClientOwnerUserId && clientOwnerUserId === internalClientOwnerUserId) return false;
  return true;
}

async function normalizeProjectClientId(clientId, internalClientId) {
  const normalizedClientId = toNullableNumber(clientId);
  const normalizedInternalClientId = toNullableNumber(internalClientId);

  if (!normalizedClientId) return null;
  if (normalizedInternalClientId && normalizedClientId === normalizedInternalClientId) return null;
  if (!normalizedInternalClientId) return normalizedClientId;

  const [rows] = await db.query(
    'SELECT id, user_id FROM duijie_clients WHERE id IN (?, ?) AND is_deleted = 0',
    [normalizedClientId, normalizedInternalClientId]
  );
  const client = rows.find(row => Number(row.id) === normalizedClientId) || null;
  const internalClient = rows.find(row => Number(row.id) === normalizedInternalClientId) || null;
  if (client && internalClient && client.user_id && internalClient.user_id && Number(client.user_id) === Number(internalClient.user_id)) {
    return null;
  }
  return normalizedClientId;
}

async function getUserScopedProjectRows(userId) {
  const activeEnterpriseId = await getUserActiveEnterpriseId(userId);
  let sql = `SELECT DISTINCT p.id, p.client_id, p.internal_client_id,
                    c.user_id AS client_owner_user_id,
                    ic.user_id AS internal_client_owner_user_id
             FROM duijie_projects p
             LEFT JOIN duijie_clients c ON c.id = p.client_id
             LEFT JOIN duijie_clients ic ON ic.id = p.internal_client_id
             LEFT JOIN duijie_project_members pm ON pm.project_id = p.id AND pm.user_id = ?
             WHERE p.is_deleted = 0 AND (p.created_by = ? OR pm.user_id IS NOT NULL)`;
  const params = [userId, userId];

  if (activeEnterpriseId) {
    sql += ' AND (p.internal_client_id = ? OR p.client_id = ?)';
    params.push(activeEnterpriseId, activeEnterpriseId);
  }

  const [rows] = await db.query(sql, params);
  return rows;
}

async function getUserScopedDashboardScope(userId) {
  const activeEnterpriseId = await getUserActiveEnterpriseId(userId);
  const rows = await getUserScopedProjectRows(userId);
  const projectIds = uniqueNumericIds(rows.map(row => row.id));

  const clientIds = uniqueNumericIds(rows.map(row => {
    if (!hasExternalEnterprise(row)) return null;
    if (!activeEnterpriseId) return row.client_id;
    if (row.client_id && Number(row.client_id) !== Number(activeEnterpriseId)) return row.client_id;
    if (row.internal_client_id && Number(row.internal_client_id) !== Number(activeEnterpriseId)) return row.internal_client_id;
    return null;
  }));

  return { activeEnterpriseId, projectIds, clientIds };
 }

async function getUserScopedProjectIds(userId) {
  const scope = await getUserScopedDashboardScope(userId);
  return scope.projectIds;
}

async function getUserScopedClientIds(userId) {
  const scope = await getUserScopedDashboardScope(userId);
  return scope.clientIds;
}

async function getProjectScope(projectId) {
  const [[project]] = await db.query(
    `SELECT p.id, p.name, p.client_id, p.internal_client_id, p.created_by,
            c.user_id AS client_owner_user_id,
            ic.user_id AS internal_client_owner_user_id
     FROM duijie_projects p
     LEFT JOIN duijie_clients c ON c.id = p.client_id
     LEFT JOIN duijie_clients ic ON ic.id = p.internal_client_id
     WHERE p.id = ? AND p.is_deleted = 0 LIMIT 1`,
    [projectId]
  );
  if (!project) return null;
  return { ...project, has_external_enterprise: hasExternalEnterprise(project) };
}

async function getProjectAccessStatus(userId, userRole, projectId) {
  const project = await getProjectScope(projectId);
  if (!project) return 'missing';
  if (userRole === 'admin') return 'allowed';

  // 企业范围隔离：用户只能访问当前活跃企业的项目
  const activeEnterpriseId = await getUserActiveEnterpriseId(userId);
  if (activeEnterpriseId) {
    const clientId = toNullableNumber(project.client_id);
    const internalClientId = toNullableNumber(project.internal_client_id);
    if (clientId !== activeEnterpriseId && internalClientId !== activeEnterpriseId) {
      return 'forbidden';
    }
  }

  const [[row]] = await db.query(
    `SELECT 1 as allowed
     FROM duijie_project_members
     WHERE project_id = ? AND user_id = ?
     UNION
     SELECT 1 as allowed
     FROM duijie_projects
     WHERE id = ? AND created_by = ?
     LIMIT 1`,
    [projectId, userId, projectId, userId]
  );
  return row ? 'allowed' : 'forbidden';
}

async function canAccessProject(userId, userRole, projectId) {
  return (await getProjectAccessStatus(userId, userRole, projectId)) === 'allowed';
}

async function getClientAccessStatus(userId, userRole, clientId) {
  const [[client]] = await db.query(
    'SELECT id FROM duijie_clients WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [clientId]
  );
  if (!client) return 'missing';
  if (userRole === 'admin') return 'allowed';

  // 企业范围隔离：客户必须与用户活跃企业有关联
  const activeEnterpriseId = await getUserActiveEnterpriseId(userId);
  if (activeEnterpriseId && Number(clientId) !== activeEnterpriseId) {
    const [[related]] = await db.query(
      `SELECT 1 FROM duijie_projects p
       WHERE p.is_deleted = 0
         AND (p.client_id = ? OR p.internal_client_id = ?)
         AND (p.internal_client_id = ? OR p.client_id = ?)
       LIMIT 1`,
      [clientId, clientId, activeEnterpriseId, activeEnterpriseId]
    );
    if (!related) return 'forbidden';
  }

  const [[row]] = await db.query(
    `SELECT c.id
     FROM duijie_clients c
     LEFT JOIN duijie_client_members m ON m.client_id = c.id AND m.user_id = ? AND m.is_deleted = 0
     WHERE c.id = ?
       AND c.is_deleted = 0
       AND (
         c.user_id = ?
         OR m.id IS NOT NULL
         OR c.created_by = ?
         OR c.assigned_to = ?
         OR EXISTS (
           SELECT 1
           FROM duijie_projects p
           LEFT JOIN duijie_project_members pm ON pm.project_id = p.id AND pm.user_id = ?
           WHERE p.is_deleted = 0
             AND (p.client_id = c.id OR p.internal_client_id = c.id)
             AND (p.created_by = ? OR pm.user_id IS NOT NULL)
         )
       )
     LIMIT 1`,
    [userId, clientId, userId, userId, userId, userId, userId]
  );
  return row ? 'allowed' : 'forbidden';
}

async function canAccessClient(userId, userRole, clientId) {
  return (await getClientAccessStatus(userId, userRole, clientId)) === 'allowed';
}

async function getTicketAccessStatus(userId, userRole, ticketId) {
  const [[ticket]] = await db.query(
    'SELECT id, created_by, project_id FROM duijie_tickets WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [ticketId]
  );
  if (!ticket) return 'missing';
  if (userRole === 'admin') return 'allowed';

  const activeEnterpriseId = await getUserActiveEnterpriseId(userId);
  if (activeEnterpriseId) {
    const memberUserIds = await getEnterpriseMemberUserIds(activeEnterpriseId);
    if (memberUserIds.includes(Number(ticket.created_by))) return 'allowed';
    if (ticket.project_id) {
      const projectStatus = await getProjectAccessStatus(userId, userRole, ticket.project_id);
      if (projectStatus === 'allowed') return 'allowed';
    }
    return 'forbidden';
  }

  if (Number(ticket.created_by) === Number(userId)) return 'allowed';
  if (ticket.project_id) {
    const projectStatus = await getProjectAccessStatus(userId, userRole, ticket.project_id);
    if (projectStatus === 'allowed') return 'allowed';
  }
  return 'forbidden';
}

async function canAccessTicket(userId, userRole, ticketId) {
  return (await getTicketAccessStatus(userId, userRole, ticketId)) === 'allowed';
}

async function resolveClientIdFromResource(resourceType, resourceId) {
  const resourceMap = {
    contact: 'SELECT client_id FROM duijie_contacts WHERE id = ? AND is_deleted = 0 LIMIT 1',
    contract: 'SELECT client_id FROM duijie_contracts WHERE id = ? AND is_deleted = 0 LIMIT 1',
    followUp: 'SELECT client_id FROM duijie_follow_ups WHERE id = ? AND is_deleted = 0 LIMIT 1',
    clientMember: 'SELECT client_id FROM duijie_client_members WHERE id = ? AND is_deleted = 0 LIMIT 1',
  };
  const sql = resourceMap[resourceType];
  if (!sql) throw new Error(`Unknown resource type: ${resourceType}`);
  const [[row]] = await db.query(sql, [resourceId]);
  return row?.client_id ? Number(row.client_id) : null;
}

module.exports = {
  canAccessClient,
  canAccessProject,
  canAccessTicket,
  getClientAccessStatus,
  getEnterpriseMemberUserIds,
  getProjectAccessStatus,
  getProjectScope,
  getTicketAccessStatus,
  getUserScopedDashboardScope,
  getUserScopedClientIds,
  getUserScopedProjectIds,
  getUserActiveEnterpriseId,
  hasExternalEnterprise,
  isUserInEnterprise,
  listEnterpriseUsers,
  normalizeProjectClientId,
  resolveClientIdFromResource,
};
