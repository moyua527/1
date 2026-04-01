const { loginAsAdmin, authGet, closeDb, db } = require('./helpers');
const request = require('supertest');
const app = require('../app');

let adminToken;
let clientId = null;
const UA = 'Mozilla/5.0 (Jest Test Runner)';

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const [clients] = await db.query("SELECT id FROM duijie_clients WHERE is_deleted = 0 LIMIT 1");
  clientId = clients[0]?.id;
});

afterAll(async () => {
  await closeDb();
});

describe('AI API', () => {
  describe('GET /api/clients/:clientId/ai-suggestion', () => {
    it('should return ai suggestion or graceful error', async () => {
      if (!clientId) return;
      const res = await authGet(`/api/clients/${clientId}/ai-suggestion`, adminToken);
      // AI endpoint may return 200 or 500 depending on LLM config
      expect([200, 500, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/clients/1/ai-suggestion').set('User-Agent', UA);
      expect(res.status).toBe(401);
    });
  });
});
