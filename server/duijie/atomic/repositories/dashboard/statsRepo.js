const db = require('../../../config/db');

function buildProjectFilter(auth) {
  const isMember = '(p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';
  if (auth.role === 'admin') {
    if (auth.activeEnterpriseId) {
      return { where: 'AND (p.internal_client_id = ? OR p.client_id = ?)', params: [auth.activeEnterpriseId, auth.activeEnterpriseId] };
    }
    return { where: '', params: [] };
  }
  if (auth.userId) {
    if (auth.activeEnterpriseId) {
      return { where: `AND ${isMember} AND (p.internal_client_id = ? OR p.client_id = ?)`, params: [auth.userId, auth.userId, auth.activeEnterpriseId, auth.activeEnterpriseId] };
    }
    return { where: `AND ${isMember}`, params: [auth.userId, auth.userId] };
  }
  return { where: '', params: [] };
}

module.exports = async (auth = {}) => {
  const pf = buildProjectFilter(auth);
  const showClientData = true;

  const [[projects]] = await db.query(
    `SELECT COUNT(*) as total, SUM(status = 'in_progress') as active, SUM(status = 'completed') as completed
     FROM duijie_projects p WHERE p.is_deleted = 0 ${pf.where}`, pf.params
  );

  let clientsTotal = 0, stageMap = {}, contractStats = { total: 0, totalAmount: 0, activeCount: 0, activeAmount: 0 };
  let overdueCount = 0, upcomingCount = 0, recentFollowUps = [], recentContracts = [];

  if (showClientData) {
    let cf = '', cfParams = [];
    if (auth.activeEnterpriseId) {
      cf = `AND c.id IN (SELECT DISTINCT CASE WHEN p.client_id = ? THEN p.internal_client_id ELSE p.client_id END FROM duijie_projects p WHERE p.is_deleted = 0 AND (p.internal_client_id = ? OR p.client_id = ?)) AND c.id != ?`;
      cfParams = [auth.activeEnterpriseId, auth.activeEnterpriseId, auth.activeEnterpriseId, auth.activeEnterpriseId];
    } else if (auth.role !== 'admin' && auth.userId) {
      cf = `AND c.id IN (SELECT DISTINCT p.client_id FROM duijie_projects p WHERE p.is_deleted = 0 AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?)))`;
      cfParams = [auth.userId, auth.userId];
    }

    const [[clients]] = await db.query(`SELECT COUNT(*) as total FROM duijie_clients c WHERE c.is_deleted = 0 ${cf}`, cfParams);
    clientsTotal = clients.total || 0;
    const [stageDist] = await db.query(`SELECT COALESCE(c.stage, "potential") as stage, COUNT(*) as count FROM duijie_clients c WHERE c.is_deleted = 0 ${cf} GROUP BY COALESCE(c.stage, "potential")`, cfParams);
    for (const row of stageDist) stageMap[row.stage] = row.count;

    const [[cs]] = await db.query(
      `SELECT COUNT(*) as total, COALESCE(SUM(co.amount), 0) as totalAmount,
       SUM(co.status = 'active') as activeCount, COALESCE(SUM(CASE WHEN co.status = 'active' THEN co.amount ELSE 0 END), 0) as activeAmount
       FROM duijie_contracts co INNER JOIN duijie_clients c ON co.client_id = c.id WHERE c.is_deleted = 0 ${cf}`, cfParams
    );
    contractStats = cs;

    const [[of]] = await db.query(
      `SELECT COUNT(DISTINCT f.client_id) as count FROM duijie_follow_ups f
       INNER JOIN duijie_clients c ON f.client_id = c.id AND c.is_deleted = 0
       INNER JOIN (SELECT client_id, MAX(id) as max_id FROM duijie_follow_ups GROUP BY client_id) latest ON f.id = latest.max_id
       WHERE f.next_follow_date IS NOT NULL AND f.next_follow_date < CURDATE() ${cf}`, cfParams
    );
    overdueCount = of.count || 0;
    const [[uf]] = await db.query(
      `SELECT COUNT(DISTINCT f.client_id) as count FROM duijie_follow_ups f
       INNER JOIN duijie_clients c ON f.client_id = c.id AND c.is_deleted = 0
       INNER JOIN (SELECT client_id, MAX(id) as max_id FROM duijie_follow_ups GROUP BY client_id) latest ON f.id = latest.max_id
       WHERE f.next_follow_date IS NOT NULL AND f.next_follow_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) ${cf}`, cfParams
    );
    upcomingCount = uf.count || 0;

    [recentFollowUps] = await db.query(
      `SELECT f.id, f.content, f.follow_type, f.created_at, c.name as client_name, c.id as client_id
       FROM duijie_follow_ups f INNER JOIN duijie_clients c ON c.id = f.client_id AND c.is_deleted = 0 ${cf.replace(/\bc\./g, 'c.')}
       ORDER BY f.created_at DESC LIMIT 5`, cfParams
    );
    [recentContracts] = await db.query(
      `SELECT co.id, co.title, co.amount, co.status, co.created_at, c.name as client_name, c.id as client_id
       FROM duijie_contracts co INNER JOIN duijie_clients c ON c.id = co.client_id AND c.is_deleted = 0 ${cf}
       ORDER BY co.created_at DESC LIMIT 5`, cfParams
    );
  }

  let taskWhere = '', taskParams = [];
  const entProjectFilter = auth.activeEnterpriseId
    ? 'AND t.project_id IN (SELECT id FROM duijie_projects WHERE is_deleted = 0 AND (internal_client_id = ? OR client_id = ?))'
    : '';
  const entTaskParams = auth.activeEnterpriseId ? [auth.activeEnterpriseId, auth.activeEnterpriseId] : [];
  if (auth.role === 'admin') {
    taskWhere = entProjectFilter;
    taskParams = [...entTaskParams];
  } else if (auth.role === 'member' && auth.userId) {
    taskWhere = `AND (t.assignee_id = ? OR t.project_id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?) OR t.project_id IN (SELECT id FROM duijie_projects WHERE created_by = ?)) ${entProjectFilter}`;
    taskParams = [auth.userId, auth.userId, auth.userId, ...entTaskParams];
  } else if (auth.userId) {
    taskWhere = `AND (t.assignee_id = ? OR t.project_id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?) OR t.project_id IN (SELECT id FROM duijie_projects WHERE created_by = ?)) ${entProjectFilter}`;
    taskParams = [auth.userId, auth.userId, auth.userId, ...entTaskParams];
  }
  const [[tasks]] = await db.query(
    `SELECT COUNT(*) as total, SUM(t.status = 'todo') as pending, SUM(t.status = 'accepted') as done
     FROM duijie_tasks t WHERE t.is_deleted = 0 ${taskWhere}`, taskParams
  );

  return {
    totalProjects: projects.total || 0,
    activeProjects: Number(projects.active) || 0,
    completedProjects: Number(projects.completed) || 0,
    totalClients: clientsTotal,
    totalTasks: tasks.total || 0,
    pendingTasks: Number(tasks.pending) || 0,
    completedTasks: Number(tasks.done) || 0,
    clientStages: {
      potential: stageMap.potential || 0,
      intent: stageMap.intent || 0,
      signed: stageMap.signed || 0,
      active: stageMap.active || 0,
      lost: stageMap.lost || 0,
    },
    contracts: {
      total: contractStats.total || 0,
      totalAmount: Number(contractStats.totalAmount) || 0,
      activeCount: Number(contractStats.activeCount) || 0,
      activeAmount: Number(contractStats.activeAmount) || 0,
    },
    followUpAlerts: {
      overdue: overdueCount,
      upcoming: upcomingCount,
    },
    recentFollowUps,
    recentContracts,
  };
};
