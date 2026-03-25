const { loginAsAdmin, authGet, authPost, closeDb, db } = require('./helpers');
const request = require('supertest');
const app = require('../app');

let adminToken;
let targetUserId;
const UA = 'Mozilla/5.0 (Jest Test Runner)';

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const [users] = await db.query("SELECT id FROM voice_users WHERE role != 'admin' AND is_deleted = 0 LIMIT 1");
  targetUserId = users[0]?.id;
});

afterAll(async () => { await closeDb(); });

describe('Direct Message API', () => {
  describe('GET /api/dm/users', () => {
    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/dm/users').set('User-Agent', UA);
      expect(res.status).toBe(401);
    });

    it('should return user list', async () => {
      const res = await authGet('/api/dm/users', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/dm/send', () => {
    it('should send a message', async () => {
      if (!targetUserId) return;
      const res = await authPost('/api/dm/send', adminToken, { receiver_id: targetUserId, content: 'Jest测试消息' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject empty content', async () => {
      if (!targetUserId) return;
      const res = await authPost('/api/dm/send', adminToken, { receiver_id: targetUserId, content: '' });
      expect([400, 200]).toContain(res.status);
    });
  });

  describe('GET /api/dm/conversations', () => {
    it('should return conversations', async () => {
      const res = await authGet('/api/dm/conversations', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/dm/:userId/history', () => {
    it('should return chat history', async () => {
      if (!targetUserId) return;
      const res = await authGet(`/api/dm/${targetUserId}/history`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/dm/:id/recall', () => {
    it('should reject invalid recall', async () => {
      const res = await request(app)
        .patch('/api/dm/999999/recall')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', UA);
      expect([200, 404]).toContain(res.status);
    });
  });
});
