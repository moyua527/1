const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

let adminToken;
let contractId = null;
let clientId = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const [clients] = await db.query("SELECT id FROM duijie_clients WHERE is_deleted = 0 LIMIT 1");
  clientId = clients[0]?.id;
});

afterAll(async () => {
  if (contractId) await db.query("DELETE FROM duijie_contracts WHERE id = ?", [contractId]);
  await closeDb();
});

describe('Contract API', () => {
  describe('POST /api/contracts', () => {
    it('should create a contract', async () => {
      const res = await authPost('/api/contracts', adminToken, {
        client_id: clientId, title: 'Jest测试合同', amount: '100000.00',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      contractId = res.body.data.id;
    });

    it('should reject without title', async () => {
      const res = await authPost('/api/contracts', adminToken, { client_id: clientId });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/clients/:clientId/contracts', () => {
    it('should return contract list for client', async () => {
      const res = await authGet(`/api/clients/${clientId}/contracts`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/contracts/:id', () => {
    it('should update contract', async () => {
      if (!contractId) return;
      const res = await authPut(`/api/contracts/${contractId}`, adminToken, { title: 'Jest更新合同', amount: '200000.00' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/contracts/:id', () => {
    it('should delete contract', async () => {
      if (!contractId) return;
      const res = await authDelete(`/api/contracts/${contractId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      contractId = null;
    });
  });
});
