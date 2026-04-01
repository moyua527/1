const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');
const request = require('supertest');
const app = require('../app');

let adminToken;
let userId = null;
const UA = 'Mozilla/5.0 (Jest Test Runner)';

beforeAll(async () => {
  adminToken = await loginAsAdmin();
});

afterAll(async () => {
  if (userId) await db.query("DELETE FROM voice_users WHERE id = ?", [userId]);
  await closeDb();
});

describe('User API', () => {
  describe('POST /api/users', () => {
    it('should create a user', async () => {
      const res = await authPost('/api/users', adminToken, {
        username: 'jest_test_user_' + Date.now(),
        password: 'Test@12345',
        nickname: 'Jest测试用户',
        role: 'member',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      userId = res.body.data.id;
    });

    it('should reject missing username', async () => {
      const res = await authPost('/api/users', adminToken, {
        password: 'Test@12345', nickname: '无名', role: 'member',
      });
      expect([400, 422]).toContain(res.status);
    });

    it('should reject invalid role', async () => {
      const res = await authPost('/api/users', adminToken, {
        username: 'jest_invalid_role', password: 'Test@12345', role: 'superadmin',
      });
      expect([400, 422]).toContain(res.status);
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).post('/api/users').set('User-Agent', UA)
        .send({ username: 'x', password: 'y', role: 'member' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users', () => {
    it('should return user list', async () => {
      const res = await authGet('/api/users', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/users').set('User-Agent', UA);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      if (!userId) return;
      const res = await authPut(`/api/users/${userId}`, adminToken, { nickname: 'Jest用户-已更新' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      if (!userId) return;
      const res = await authDelete(`/api/users/${userId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      userId = null;
    });
  });
});
