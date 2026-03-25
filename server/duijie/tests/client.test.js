const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

let adminToken;
let clientId = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
});

afterAll(async () => {
  if (clientId) await db.query("UPDATE duijie_clients SET is_deleted = 1 WHERE id = ?", [clientId]);
  await closeDb();
});

describe('Client API', () => {
  describe('POST /api/clients', () => {
    it('should create a client', async () => {
      const res = await authPost('/api/clients', adminToken, {
        name: 'Jest测试客户', company: 'Jest公司', email: 'jest@test.com',
        phone: '13800000099', channel: '微信', stage: 'potential',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      clientId = res.body.data.id;
    });
  });

  describe('GET /api/clients', () => {
    it('should return client list', async () => {
      const res = await authGet('/api/clients', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated access', async () => {
      const request = require('supertest');
      const app = require('../app');
      const res = await request(app).get('/api/clients').set('User-Agent', 'Mozilla/5.0 (Jest Test Runner)');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return client detail', async () => {
      if (!clientId) return;
      const res = await authGet(`/api/clients/${clientId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Jest测试客户');
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update client', async () => {
      if (!clientId) return;
      const res = await authPut(`/api/clients/${clientId}`, adminToken, { name: 'Jest测试客户-已更新', stage: 'intent' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/clients/:id/score', () => {
    it('should return client score', async () => {
      if (!clientId) return;
      const res = await authGet(`/api/clients/${clientId}/score`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('label');
    });
  });

  describe('Contacts', () => {
    let contactId;
    it('should create a contact', async () => {
      if (!clientId) return;
      const res = await authPost('/api/contacts', adminToken, { client_id: clientId, name: 'Jest联系人', phone: '13900000001' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      contactId = res.body.data?.id;
    });

    it('should list contacts', async () => {
      if (!clientId) return;
      const res = await authGet(`/api/clients/${clientId}/contacts`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should delete contact', async () => {
      if (!contactId) return;
      const res = await authDelete(`/api/contacts/${contactId}`, adminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('Contracts', () => {
    let contractId;
    it('should create a contract', async () => {
      if (!clientId) return;
      const res = await authPost('/api/contracts', adminToken, { client_id: clientId, title: 'Jest合同', amount: 10000, status: 'draft' });
      expect(res.status).toBe(200);
      contractId = res.body.data?.id;
    });

    it('should list contracts', async () => {
      if (!clientId) return;
      const res = await authGet(`/api/clients/${clientId}/contracts`, adminToken);
      expect(res.status).toBe(200);
    });

    it('should delete contract', async () => {
      if (!contractId) return;
      const res = await authDelete(`/api/contracts/${contractId}`, adminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('Follow-ups', () => {
    let followUpId;
    it('should create a follow-up', async () => {
      if (!clientId) return;
      const res = await authPost('/api/follow-ups', adminToken, { client_id: clientId, content: 'Jest跟进', follow_type: 'phone' });
      expect(res.status).toBe(200);
      followUpId = res.body.data?.id;
    });

    it('should list follow-ups', async () => {
      if (!clientId) return;
      const res = await authGet(`/api/clients/${clientId}/follow-ups`, adminToken);
      expect(res.status).toBe(200);
    });

    it('should delete follow-up', async () => {
      if (!followUpId) return;
      const res = await authDelete(`/api/follow-ups/${followUpId}`, adminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('Tags', () => {
    let tagId;
    it('should create a tag', async () => {
      const res = await authPost('/api/tags', adminToken, { name: 'Jest标签', color: '#2563eb' });
      expect(res.status).toBe(200);
      tagId = res.body.data?.id;
    });

    it('should list tags', async () => {
      const res = await authGet('/api/tags', adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should set client tags', async () => {
      if (!clientId || !tagId) return;
      const res = await authPut(`/api/clients/${clientId}/tags`, adminToken, { tagIds: [tagId] });
      expect(res.status).toBe(200);
    });

    it('should delete tag', async () => {
      if (!tagId) return;
      const res = await authDelete(`/api/tags/${tagId}`, adminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should soft delete client', async () => {
      if (!clientId) return;
      const res = await authDelete(`/api/clients/${clientId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      clientId = null;
    });
  });
});
