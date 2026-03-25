const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');
const request = require('supertest');
const app = require('../app');

let adminToken;
let partnerId = null;
let apiKey = null;
const UA = 'Mozilla/5.0 (Jest Test Runner)';

beforeAll(async () => { adminToken = await loginAsAdmin(); });

afterAll(async () => {
  if (partnerId) await db.query("DELETE FROM duijie_partner_api_keys WHERE id = ?", [partnerId]);
  await closeDb();
});

describe('Partner Management API (admin)', () => {
  describe('POST /api/partners', () => {
    it('should reject without name', async () => {
      const res = await authPost('/api/partners', adminToken, {});
      expect(res.status).toBe(400);
    });

    it('should create a partner', async () => {
      const res = await authPost('/api/partners', adminToken, {
        partner_name: 'Jest测试合作方', permissions: ['clients:read', 'projects:read'], notes: '自动化测试',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('api_key');
      partnerId = res.body.data.id;
      apiKey = res.body.data.api_key;
    });
  });

  describe('GET /api/partners', () => {
    it('should return partner list', async () => {
      const res = await authGet('/api/partners', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.find(p => p.id === partnerId);
      expect(found).toBeTruthy();
      expect(found.partner_name).toBe('Jest测试合作方');
    });
  });

  describe('PUT /api/partners/:id', () => {
    it('should update partner', async () => {
      if (!partnerId) return;
      const res = await authPut(`/api/partners/${partnerId}`, adminToken, {
        partner_name: 'Jest合作方-已更新', permissions: ['clients:read'], is_active: 1,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/partners/:id/reset-key', () => {
    it('should reset API key', async () => {
      if (!partnerId) return;
      const res = await authPost(`/api/partners/${partnerId}/reset-key`, adminToken, {});
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('api_key');
      expect(res.body.data.api_key).not.toBe(apiKey);
      apiKey = res.body.data.api_key;
    });
  });
});

describe('Partner Open API (X-API-Key)', () => {
  describe('without API key', () => {
    it('should reject /api/open/clients', async () => {
      const res = await request(app).get('/api/open/clients').set('User-Agent', UA);
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('X-API-Key');
    });
  });

  describe('with invalid API key', () => {
    it('should reject', async () => {
      const res = await request(app).get('/api/open/clients')
        .set('X-API-Key', 'dj_invalid_key_00000000')
        .set('User-Agent', UA);
      expect(res.status).toBe(401);
    });
  });

  describe('with valid API key', () => {
    it('should return clients', async () => {
      if (!apiKey) return;
      const res = await request(app).get('/api/open/clients')
        .set('X-API-Key', apiKey).set('User-Agent', UA);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return projects', async () => {
      if (!apiKey) return;
      const res = await request(app).get('/api/open/projects')
        .set('X-API-Key', apiKey).set('User-Agent', UA);
      expect([200, 403]).toContain(res.status);
    });

    it('should reject unauthorized permission', async () => {
      if (!apiKey) return;
      const res = await request(app).post('/api/open/clients')
        .set('X-API-Key', apiKey).set('User-Agent', UA)
        .send({ name: '测试' });
      expect(res.status).toBe(403);
    });
  });
});

describe('DELETE /api/partners/:id', () => {
  it('should delete partner', async () => {
    if (!partnerId) return;
    const res = await authDelete(`/api/partners/${partnerId}`, adminToken);
    expect(res.status).toBe(200);
    partnerId = null;
  });
});
