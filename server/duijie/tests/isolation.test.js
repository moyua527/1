const { loginAsUser, authGet, authPost, closeDb, db, resetTokenCache } = require('./helpers');

const ISOLATION_TEST_USERS = [
  { phone: '19900000021', username: 'scope_owner_user', nickname: '隔离范围创建者' },
  { phone: '19900000022', username: 'scope_enterprise_user', nickname: '隔离范围企业成员' },
  { phone: '19900000023', username: 'scope_project_user', nickname: '隔离范围项目成员' },
  { phone: '19900000024', username: 'scope_unrelated_user', nickname: '隔离范围无关用户' },
];

let ownerToken;
let enterpriseMemberToken;
let projectMemberToken;
let unrelatedToken;
let ownerUserId;
let enterpriseMemberUserId;
let projectMemberUserId;
let unrelatedUserId;
let scopeEnterpriseId = null;
let scopedClientId = null;
let scopedProjectId = null;
let counterpartyEnterpriseId = null;
let reversePerspectiveProjectId = null;

async function ensureTestUsers() {
  for (const testUser of ISOLATION_TEST_USERS) {
    const [existing] = await db.query('SELECT id FROM voice_users WHERE phone = ? AND is_deleted = 0', [testUser.phone]);
    if (!existing[0]) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Test123456', 10);
      await db.query(
        "INSERT INTO voice_users (username, nickname, phone, password, role, is_active) VALUES (?, ?, ?, ?, 'member', 1)",
        [testUser.username, testUser.nickname, testUser.phone, hash]
      );
    }
  }

  const [ownerRows] = await db.query('SELECT id FROM voice_users WHERE phone = ?', ['19900000021']);
  const [enterpriseMemberRows] = await db.query('SELECT id FROM voice_users WHERE phone = ?', ['19900000022']);
  const [projectMemberRows] = await db.query('SELECT id FROM voice_users WHERE phone = ?', ['19900000023']);
  const [unrelatedRows] = await db.query('SELECT id FROM voice_users WHERE phone = ?', ['19900000024']);

  ownerUserId = ownerRows[0]?.id;
  enterpriseMemberUserId = enterpriseMemberRows[0]?.id;
  projectMemberUserId = projectMemberRows[0]?.id;
  unrelatedUserId = unrelatedRows[0]?.id;
}

async function cleanupIsolationFixtures() {
  const userIds = [ownerUserId || 0, enterpriseMemberUserId || 0, projectMemberUserId || 0, unrelatedUserId || 0];

  if (scopedProjectId) {
    await db.query('DELETE FROM duijie_project_members WHERE project_id = ?', [scopedProjectId]);
    await db.query('UPDATE duijie_projects SET is_deleted = 1 WHERE id = ?', [scopedProjectId]);
  }

  if (reversePerspectiveProjectId) {
    await db.query('DELETE FROM duijie_project_members WHERE project_id = ?', [reversePerspectiveProjectId]);
    await db.query('UPDATE duijie_projects SET is_deleted = 1 WHERE id = ?', [reversePerspectiveProjectId]);
  }

  if (scopedClientId) {
    await db.query('DELETE FROM duijie_opportunities WHERE client_id = ?', [scopedClientId]);
    await db.query('DELETE FROM duijie_contacts WHERE client_id = ?', [scopedClientId]);
    await db.query('DELETE FROM duijie_follow_ups WHERE client_id = ?', [scopedClientId]);
    await db.query('DELETE FROM duijie_contracts WHERE client_id = ?', [scopedClientId]);
    await db.query('UPDATE duijie_client_members SET is_deleted = 1 WHERE client_id = ?', [scopedClientId]);
    await db.query('DELETE FROM duijie_client_tags WHERE client_id = ?', [scopedClientId]);
    await db.query('UPDATE duijie_clients SET is_deleted = 1 WHERE id = ?', [scopedClientId]);
  }

  if (scopeEnterpriseId) {
    await db.query('DELETE FROM duijie_opportunities WHERE client_id = ?', [scopeEnterpriseId]);
    await db.query('UPDATE duijie_client_members SET is_deleted = 1 WHERE client_id = ?', [scopeEnterpriseId]);
    await db.query('UPDATE duijie_clients SET is_deleted = 1 WHERE id = ?', [scopeEnterpriseId]);
  }

  if (counterpartyEnterpriseId) {
    await db.query('DELETE FROM duijie_opportunities WHERE client_id = ?', [counterpartyEnterpriseId]);
    await db.query('UPDATE duijie_clients SET is_deleted = 1 WHERE id = ?', [counterpartyEnterpriseId]);
  }

  await db.query('UPDATE voice_users SET active_enterprise_id = NULL WHERE id IN (?, ?, ?, ?)', userIds);

  reversePerspectiveProjectId = null;
  counterpartyEnterpriseId = null;
  scopedProjectId = null;
  scopedClientId = null;
  scopeEnterpriseId = null;
}

beforeAll(async () => {
  await ensureTestUsers();
  await cleanupIsolationFixtures();

  const [enterpriseResult] = await db.query(
    "INSERT INTO duijie_clients (user_id, client_type, name, company, created_by, stage) VALUES (?, 'company', ?, ?, ?, 'signed')",
    [ownerUserId, 'Jest隔离企业', 'Jest隔离企业', ownerUserId]
  );
  scopeEnterpriseId = enterpriseResult.insertId;

  await db.query('UPDATE voice_users SET active_enterprise_id = ? WHERE id IN (?, ?)', [scopeEnterpriseId, ownerUserId, enterpriseMemberUserId]);
  await db.query(
    'INSERT INTO duijie_client_members (client_id, user_id, name, created_by) VALUES (?, ?, ?, ?)',
    [scopeEnterpriseId, enterpriseMemberUserId, '隔离企业成员', ownerUserId]
  );

  const [clientResult] = await db.query(
    "INSERT INTO duijie_clients (client_type, name, company, created_by, stage) VALUES ('company', ?, ?, ?, 'potential')",
    ['Jest隔离客户', 'Jest隔离客户公司', ownerUserId]
  );
  scopedClientId = clientResult.insertId;

  const [counterpartyEnterpriseResult] = await db.query(
    "INSERT INTO duijie_clients (user_id, client_type, name, company, created_by, stage) VALUES (?, 'company', ?, ?, ?, 'intent')",
    [unrelatedUserId, 'Jest对方企业', 'Jest对方企业', unrelatedUserId]
  );
  counterpartyEnterpriseId = counterpartyEnterpriseResult.insertId;

  const [projectResult] = await db.query(
    'INSERT INTO duijie_projects (name, description, client_id, internal_client_id, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    ['Jest隔离项目', '用于测试企业隔离范围', scopedClientId, scopeEnterpriseId, 'in_progress', ownerUserId]
  );
  scopedProjectId = projectResult.insertId;

  const [reverseProjectResult] = await db.query(
    'INSERT INTO duijie_projects (name, description, client_id, internal_client_id, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    ['Jest反向视角项目', '用于测试活跃企业视角统计', scopeEnterpriseId, counterpartyEnterpriseId, 'in_progress', ownerUserId]
  );
  reversePerspectiveProjectId = reverseProjectResult.insertId;

  await db.query(
    "INSERT INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, 'owner', 'internal'), (?, ?, 'editor', 'internal')",
    [scopedProjectId, ownerUserId, scopedProjectId, projectMemberUserId]
  );

  await db.query(
    "INSERT INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, 'owner', 'internal')",
    [reversePerspectiveProjectId, ownerUserId]
  );

  await db.query(
    'INSERT INTO duijie_opportunities (title, client_id, amount, probability, stage, expected_close, assigned_to, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['Jest对方企业商机', counterpartyEnterpriseId, 50000, 60, 'qualify', null, null, 'dashboard scope', ownerUserId]
  );
  await db.query(
    'INSERT INTO duijie_opportunities (title, client_id, amount, probability, stage, expected_close, assigned_to, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['Jest我方企业商机', scopeEnterpriseId, 80000, 80, 'won', null, null, 'dashboard self scope', ownerUserId]
  );

  resetTokenCache();
  ownerToken = await loginAsUser('19900000021');
  enterpriseMemberToken = await loginAsUser('19900000022');
  projectMemberToken = await loginAsUser('19900000023');
  unrelatedToken = await loginAsUser('19900000024');
});

afterAll(async () => {
  await cleanupIsolationFixtures();
  await closeDb();
});

describe('Enterprise isolation guards', () => {
  describe('Client scope', () => {
    it('should allow project-related users to view linked client detail', async () => {
      const res = await authGet(`/api/clients/${scopedClientId}`, projectMemberToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.id).toBe(scopedClientId);
    });

    it('should reject unrelated users from viewing client detail', async () => {
      const res = await authGet(`/api/clients/${scopedClientId}`, unrelatedToken);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject unrelated users from creating contacts for inaccessible clients', async () => {
      const res = await authPost('/api/contacts', unrelatedToken, {
        client_id: scopedClientId,
        name: '不应创建成功的联系人',
        phone: '13900009999',
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should scope default available members to the active enterprise for non-admin users', async () => {
      const res = await authGet('/api/clients/available-members', enterpriseMemberToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const userIds = res.body.data.map(item => item.id);
      expect(userIds).toContain(ownerUserId);
      expect(userIds).toContain(enterpriseMemberUserId);
      expect(userIds).not.toContain(projectMemberUserId);
      expect(userIds).not.toContain(unrelatedUserId);
    });
  });

  describe('Project member scope', () => {
    it('should only expose internal enterprise users in project available-users', async () => {
      const res = await authGet(`/api/projects/${scopedProjectId}/available-users`, ownerToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const userIds = res.body.data.map(item => item.id);
      expect(userIds).toContain(enterpriseMemberUserId);
      expect(userIds).not.toContain(ownerUserId);
      expect(userIds).not.toContain(projectMemberUserId);
      expect(userIds).not.toContain(unrelatedUserId);
    });

    it('should reject adding a user outside the internal enterprise to the project', async () => {
      const res = await authPost(`/api/projects/${scopedProjectId}/members`, ownerToken, {
        user_id: unrelatedUserId,
        role: 'editor',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should scope team-users to the active enterprise for normal members', async () => {
      const res = await authGet('/api/projects/team-users', enterpriseMemberToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const userIds = res.body.data.map(item => item.id);
      expect(userIds).toContain(ownerUserId);
      expect(userIds).toContain(enterpriseMemberUserId);
      expect(userIds).not.toContain(projectMemberUserId);
      expect(userIds).not.toContain(unrelatedUserId);
    });
  });

  describe('Dashboard scope', () => {
    it('should exclude the active enterprise itself from the dashboard report funnel', async () => {
      const res = await authGet('/api/dashboard/report', ownerToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.funnel.potential).toBe(1);
      expect(res.body.data.funnel.intent).toBe(1);
      expect(res.body.data.funnel.signed || 0).toBe(0);
    });

    it('should scope dashboard opportunity charts to counterpart clients under the active enterprise', async () => {
      const res = await authGet('/api/dashboard/chart?days=30', ownerToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const dist = Object.fromEntries((res.body.data.oppDist || []).map(item => [item.stage, item.count]));
      expect(dist.qualify).toBe(1);
      expect(dist.won || 0).toBe(0);
    });
  });
});
