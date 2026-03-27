const { loginAsAdmin, loginAsUser, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

let adminToken;
let userToken;
let joinUserToken;
let testEntId = null;
let testMemberId = null;
let testDeptId = null;
let ownerUserId = null;
let joinUserId = null;
let testJoinCode = '';

beforeAll(async () => {
  adminToken = await loginAsAdmin();

  const testUsers = [
    { phone: '19900000001', username: 'test_ent_user', nickname: '测试企业用户' },
    { phone: '19900000002', username: 'test_join_user', nickname: '测试加入用户' },
  ];
  for (const testUser of testUsers) {
    const [existing] = await db.query("SELECT id FROM voice_users WHERE phone = ? AND is_deleted = 0", [testUser.phone]);
    if (!existing[0]) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Test123456', 10);
      await db.query(
        "INSERT INTO voice_users (username, nickname, phone, password, role, is_active) VALUES (?, ?, ?, ?, 'member', 1)",
        [testUser.username, testUser.nickname, testUser.phone, hash]
      );
    }
  }
  userToken = await loginAsUser('19900000001');
  joinUserToken = await loginAsUser('19900000002');

  const [ownerRows] = await db.query("SELECT id FROM voice_users WHERE phone = ?", ['19900000001']);
  const [joinRows] = await db.query("SELECT id FROM voice_users WHERE phone = ?", ['19900000002']);
  ownerUserId = ownerRows[0]?.id || null;
  joinUserId = joinRows[0]?.id || null;

  const cleanupOwnedEnterprises = async (uid) => {
    const [ents] = await db.query("SELECT id FROM duijie_clients WHERE user_id = ? AND client_type = 'company' AND is_deleted = 0", [uid]);
    for (const ent of ents) {
      await db.query("DELETE FROM duijie_join_requests WHERE client_id = ?", [ent.id]);
      await db.query("UPDATE duijie_client_members SET is_deleted = 1 WHERE client_id = ?", [ent.id]);
      await db.query("UPDATE duijie_departments SET is_deleted = 1 WHERE client_id = ?", [ent.id]);
      await db.query("UPDATE duijie_clients SET is_deleted = 1 WHERE id = ?", [ent.id]);
    }
  };

  if (ownerUserId) await cleanupOwnedEnterprises(ownerUserId);
  if (joinUserId) await cleanupOwnedEnterprises(joinUserId);
  if (ownerUserId || joinUserId) {
    await db.query("DELETE FROM duijie_join_requests WHERE user_id IN (?, ?)", [ownerUserId || 0, joinUserId || 0]);
    await db.query("UPDATE duijie_client_members SET is_deleted = 1 WHERE user_id IN (?, ?)", [ownerUserId || 0, joinUserId || 0]);
    await db.query("UPDATE voice_users SET active_enterprise_id = NULL WHERE id IN (?, ?)", [ownerUserId || 0, joinUserId || 0]);
    await db.query("DELETE FROM duijie_notifications WHERE user_id IN (?, ?) AND type = 'join_via_code'", [ownerUserId || 0, joinUserId || 0]);
    await db.query("DELETE FROM duijie_audit_logs WHERE user_id IN (?, ?) AND action IN ('join_by_code', 'regenerate_join_code')", [ownerUserId || 0, joinUserId || 0]);
  }
});

afterAll(async () => {
  // 清理测试数据
  if (testEntId) {
    await db.query("DELETE FROM duijie_join_requests WHERE client_id = ?", [testEntId]);
    await db.query("UPDATE duijie_client_members SET is_deleted = 1 WHERE client_id = ?", [testEntId]);
    await db.query("UPDATE duijie_departments SET is_deleted = 1 WHERE client_id = ?", [testEntId]);
    await db.query("UPDATE duijie_clients SET is_deleted = 1 WHERE id = ?", [testEntId]);
  }
  if (ownerUserId || joinUserId) {
    await db.query("DELETE FROM duijie_join_requests WHERE user_id IN (?, ?)", [ownerUserId || 0, joinUserId || 0]);
    await db.query("UPDATE duijie_client_members SET is_deleted = 1 WHERE user_id IN (?, ?)", [ownerUserId || 0, joinUserId || 0]);
    await db.query("UPDATE voice_users SET active_enterprise_id = NULL WHERE id IN (?, ?)", [ownerUserId || 0, joinUserId || 0]);
    await db.query("DELETE FROM duijie_notifications WHERE user_id IN (?, ?) AND type = 'join_via_code'", [ownerUserId || 0, joinUserId || 0]);
    await db.query("DELETE FROM duijie_audit_logs WHERE user_id IN (?, ?) AND action IN ('join_by_code', 'regenerate_join_code')", [ownerUserId || 0, joinUserId || 0]);
  }
  await closeDb();
});

describe('Enterprise CRUD', () => {
  describe('GET /api/my-enterprise (no enterprise)', () => {
    it('should return null when user has no enterprise', async () => {
      const res = await authGet('/api/my-enterprise', userToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });
  });

  describe('POST /api/my-enterprise', () => {
    it('should reject creation without name', async () => {
      const res = await authPost('/api/my-enterprise', userToken, { name: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create enterprise successfully', async () => {
      const res = await authPost('/api/my-enterprise', userToken, {
        name: 'Jest测试企业',
        company: 'Jest测试有限公司',
        industry: '互联网/IT',
        scale: '1-10人',
        email: 'test@jest.com',
        phone: '13800000000',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      testEntId = res.body.data.id;
    });

    it('should reject duplicate creation', async () => {
      const res = await authPost('/api/my-enterprise', userToken, { name: '重复企业' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/my-enterprise (with enterprise)', () => {
    it('should return enterprise with members and departments', async () => {
      const res = await authGet('/api/my-enterprise', userToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('enterprise');
      expect(res.body.data.enterprise.name).toBe('Jest测试企业');
      expect(res.body.data.enterprise.join_code).toMatch(/^[A-F0-9]{10}$/);
      testJoinCode = res.body.data.enterprise.join_code;
      expect(res.body.data).toHaveProperty('members');
      expect(res.body.data).toHaveProperty('departments');
      // 创建者应在成员列表中
      expect(res.body.data.members.length).toBeGreaterThanOrEqual(1);
      // 创建者角色应为 creator
      const creatorMember = res.body.data.members.find(m => m.role === 'creator');
      expect(creatorMember).toBeTruthy();
    });

    it('should allow enterprise creator to regenerate join code', async () => {
      const previousCode = testJoinCode;
      const res = await authPost('/api/my-enterprise/join-code/regenerate', userToken, {});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.join_code).toMatch(/^[A-F0-9]{10}$/);
      expect(res.body.data.join_code).not.toBe(previousCode);
      testJoinCode = res.body.data.join_code;
    });
  });

  describe('PUT /api/my-enterprise', () => {
    it('should update enterprise info', async () => {
      const res = await authPut('/api/my-enterprise', userToken, {
        name: 'Jest测试企业-已更新',
        company: 'Jest测试更新有限公司',
        industry: '金融',
        credit_code: '91110000MA0ABCDE1X',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should verify updated data', async () => {
      const res = await authGet('/api/my-enterprise', userToken);
      expect(res.body.data.enterprise.name).toBe('Jest测试企业-已更新');
      expect(res.body.data.enterprise.industry).toBe('金融');
      expect(res.body.data.enterprise.credit_code).toBe('91110000MA0ABCDE1X');
    });
  });

  describe('Department CRUD', () => {
    it('should create a department', async () => {
      const res = await authPost('/api/my-enterprise/departments', userToken, { name: '测试技术部' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      testDeptId = res.body.data.id;
    });

    it('should create a child department', async () => {
      const res = await authPost('/api/my-enterprise/departments', userToken, { name: '测试前端组', parent_id: testDeptId });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update department', async () => {
      const res = await authPut(`/api/my-enterprise/departments/${testDeptId}`, userToken, { name: '测试技术部-更新' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Member CRUD', () => {
    it('should add a member', async () => {
      const res = await authPost('/api/my-enterprise/members', userToken, {
        name: '测试成员A',
        position: '工程师',
        phone: '13900000001',
        department_id: testDeptId,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      testMemberId = res.body.data.id;
    });

    it('should reject member without name', async () => {
      const res = await authPost('/api/my-enterprise/members', userToken, { name: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should update member', async () => {
      const res = await authPut(`/api/my-enterprise/members/${testMemberId}`, userToken, {
        name: '测试成员A-更新',
        position: '高级工程师',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should delete member', async () => {
      const res = await authDelete(`/api/my-enterprise/members/${testMemberId}`, userToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Enterprise Join Code', () => {
    it('should list recommended enterprises for non-member users', async () => {
      const res = await authGet('/api/my-enterprise/recommended', joinUserToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((ent) => ent.id === testEntId)).toBe(true);
    });

    it('should reject invalid join code', async () => {
      const res = await authPost('/api/my-enterprise/join', joinUserToken, {
        enterprise_id: testEntId,
        join_code: 'INVALID001',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should allow direct join with valid join code', async () => {
      const res = await authPost('/api/my-enterprise/join', joinUserToken, {
        enterprise_id: testEntId,
        join_code: testJoinCode,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.joinedDirectly).toBe(true);
    });

    it('should hide join code from ordinary members after joining', async () => {
      const res = await authGet('/api/my-enterprise', joinUserToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enterprise.id).toBe(testEntId);
      expect(res.body.data.enterprise.join_code).toBeNull();
    });

    it('should write notification and audit log after direct join', async () => {
      const [notifications] = await db.query(
        "SELECT id FROM duijie_notifications WHERE user_id = ? AND type = 'join_via_code' ORDER BY id DESC LIMIT 1",
        [ownerUserId]
      );
      const [logs] = await db.query(
        "SELECT id FROM duijie_audit_logs WHERE user_id = ? AND action = 'join_by_code' AND entity_id = ? ORDER BY id DESC LIMIT 1",
        [joinUserId, testEntId]
      );
      expect(notifications[0]).toBeTruthy();
      expect(logs[0]).toBeTruthy();
    });
  });

  describe('System Admin - GET /api/my-enterprise/all', () => {
    it('should allow admin to get all enterprises', async () => {
      const res = await authGet('/api/my-enterprise/all', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject non-admin access', async () => {
      const res = await authGet('/api/my-enterprise/all', userToken);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/my-enterprise', () => {
    it('should delete enterprise', async () => {
      const res = await authDelete('/api/my-enterprise', userToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      testEntId = null; // 已删除，无需afterAll再清理
    });

    it('should return null after deletion', async () => {
      const res = await authGet('/api/my-enterprise', userToken);
      expect(res.body.data).toBeNull();
    });
  });
});
