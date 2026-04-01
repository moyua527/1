const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

let adminToken;
let contactId = null;
let clientId = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const [clients] = await db.query("SELECT id FROM duijie_clients WHERE is_deleted = 0 LIMIT 1");
  clientId = clients[0]?.id;
});

afterAll(async () => {
  if (contactId) await db.query("DELETE FROM duijie_contacts WHERE id = ?", [contactId]);
  await closeDb();
});

describe('Contact API', () => {
  describe('POST /api/contacts', () => {
    it('should create a contact', async () => {
      const res = await authPost('/api/contacts', adminToken, {
        client_id: clientId, name: 'Jest测试联系人',
        phone: '13800001111', email: 'jest@test.com',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      contactId = res.body.data.id;
    });

    it('should reject without name', async () => {
      const res = await authPost('/api/contacts', adminToken, { client_id: clientId });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/clients/:clientId/contacts', () => {
    it('should return contact list for client', async () => {
      const res = await authGet(`/api/clients/${clientId}/contacts`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('should update contact', async () => {
      if (!contactId) return;
      const res = await authPut(`/api/contacts/${contactId}`, adminToken, { name: 'Jest更新联系人' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete contact', async () => {
      if (!contactId) return;
      const res = await authDelete(`/api/contacts/${contactId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      contactId = null;
    });
  });
});
