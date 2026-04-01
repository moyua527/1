const { loginAsAdmin, authGet, authPost, closeDb, db } = require('./helpers');
const request = require('supertest');
const app = require('../app');

let adminToken;
let messageId = null;
let projectId = null;
const UA = 'Mozilla/5.0 (Jest Test Runner)';

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const [projects] = await db.query("SELECT id FROM duijie_projects WHERE is_deleted = 0 LIMIT 1");
  projectId = projects[0]?.id;
});

afterAll(async () => {
  if (messageId) await db.query("DELETE FROM duijie_messages WHERE id = ?", [messageId]);
  await closeDb();
});

describe('Message API', () => {
  describe('POST /api/messages', () => {
    it('should send a message', async () => {
      if (!projectId) return;
      const res = await authPost('/api/messages', adminToken, {
        project_id: projectId,
        content: 'Jest测试消息',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      messageId = res.body.data?.id;
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).post('/api/messages').set('User-Agent', UA)
        .send({ project_id: 1, content: 'test' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/messages', () => {
    it('should return message list', async () => {
      const res = await authGet(`/api/messages?project_id=${projectId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/messages').set('User-Agent', UA);
      expect(res.status).toBe(401);
    });
  });
});
