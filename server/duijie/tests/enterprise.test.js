const { loginAsAdmin, loginAsUser, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

let adminToken;
let userToken;
let testEntId = null;
let testMemberId = null;
let testDeptId = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();

  // 创建一个测试用户（如果不存在）
  const testPhone = '19900000001';
  const [existing] = await db.query("SELECT id FROM voice_users WHERE phone = ? AND is_deleted = 0", [testPhone]);
  if (!existing[0]) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Test123456', 10);
    await db.query(
      "INSERT INTO voice_users (username, nickname, phone, password, role, is_active) VALUES (?, ?, ?, ?, 'member', 1)",
      ['test_ent_user', '测试企业用户', testPhone, hash]
    );
  }
  userToken = await loginAsUser(testPhone);

  // 清理该测试用户可能残留的企业数据
  const [u] = await db.query("SELECT id FROM voice_users WHERE phone = ?", [testPhone]);
  if (u[0]) {
    const uid = u[0].id;
    const [ents] = await db.query("SELECT id FROM duijie_clients WHERE user_id = ? AND client_type = 'company' AND is_deleted = 0", [uid]);
    for (const ent of ents) {
      await db.query("UPDATE duijie_client_members SET is_deleted = 1 WHERE client_id = ?", [ent.id]);
      await db.query("UPDATE duijie_departments SET is_deleted = 1 WHERE client_id = ?", [ent.id]);
      await db.query("UPDATE duijie_clients SET is_deleted = 1 WHERE id = ?", [ent.id]);
    }
  }
});

afterAll(async () => {
  // 清理测试数据
  if (testEntId) {
    await db.query("UPDATE duijie_client_members SET is_deleted = 1 WHERE client_id = ?", [testEntId]);
    await db.query("UPDATE duijie_departments SET is_deleted = 1 WHERE client_id = ?", [testEntId]);
    await db.query("UPDATE duijie_clients SET is_deleted = 1 WHERE id = ?", [testEntId]);
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
      expect(res.body.data).toHaveProperty('members');
      expect(res.body.data).toHaveProperty('departments');
      // 创建者应在成员列表中
      expect(res.body.data.members.length).toBeGreaterThanOrEqual(1);
      // 创建者角色应为 creator
      const creatorMember = res.body.data.members.find(m => m.role === 'creator');
      expect(creatorMember).toBeTruthy();
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
