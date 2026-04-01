const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

let adminToken;
let followUpId = null;
let clientId = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const [clients] = await db.query("SELECT id FROM duijie_clients WHERE is_deleted = 0 LIMIT 1");
  clientId = clients[0]?.id;
});

afterAll(async () => {
  if (followUpId) await db.query("DELETE FROM duijie_follow_ups WHERE id = ?", [followUpId]);
  await closeDb();
});

describe('Follow-up API', () => {
  describe('POST /api/follow-ups', () => {
    it('should create a follow-up', async () => {
      const res = await authPost('/api/follow-ups', adminToken, {
        client_id: clientId, content: 'Jest测试跟进记录：电话沟通了项目需求',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      followUpId = res.body.data.id;
    });

    it('should reject without content', async () => {
      const res = await authPost('/api/follow-ups', adminToken, { client_id: clientId });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/clients/:clientId/follow-ups', () => {
    it('should return follow-up list for client', async () => {
      const res = await authGet(`/api/clients/${clientId}/follow-ups`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/follow-ups/:id', () => {
    it('should update follow-up', async () => {
      if (!followUpId) return;
      const res = await authPut(`/api/follow-ups/${followUpId}`, adminToken, { content: 'Jest更新跟进内容' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/follow-ups/:id', () => {
    it('should delete follow-up', async () => {
      if (!followUpId) return;
      const res = await authDelete(`/api/follow-ups/${followUpId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      followUpId = null;
    });
  });
});
