const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

let adminToken;
let opportunityId = null;
let clientId = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const [clients] = await db.query("SELECT id FROM duijie_clients WHERE is_deleted = 0 LIMIT 1");
  clientId = clients[0]?.id;
});

afterAll(async () => {
  if (opportunityId) await db.query("UPDATE duijie_opportunities SET is_deleted = 1 WHERE id = ?", [opportunityId]);
  await closeDb();
});

describe('Opportunity API', () => {
  describe('POST /api/opportunities', () => {
    it('should create an opportunity', async () => {
      const res = await authPost('/api/opportunities', adminToken, {
        title: 'Jest测试商机', client_id: clientId, amount: 50000,
        probability: 60, stage: 'lead',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      opportunityId = res.body.data.id;
    });
  });

  describe('GET /api/opportunities', () => {
    it('should return opportunity list', async () => {
      const res = await authGet('/api/opportunities', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/opportunities/:id', () => {
    it('should update opportunity stage', async () => {
      if (!opportunityId) return;
      const res = await authPut(`/api/opportunities/${opportunityId}`, adminToken, { stage: 'qualified', probability: 75 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/opportunities/:id', () => {
    it('should delete opportunity', async () => {
      if (!opportunityId) return;
      const res = await authDelete(`/api/opportunities/${opportunityId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      opportunityId = null;
    });
  });
});
