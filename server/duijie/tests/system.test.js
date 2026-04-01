const { loginAsAdmin, authGet, authPost, closeDb, db } = require('./helpers');
const request = require('supertest');
const app = require('../app');

let adminToken;
const UA = 'Mozilla/5.0 (Jest Test Runner)';

beforeAll(async () => {
  adminToken = await loginAsAdmin();
});

afterAll(async () => {
  await closeDb();
});

describe('System API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health').set('User-Agent', UA);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('database');
    });
  });

  describe('GET /api/system/invite-code', () => {
    it('should return invite code config', async () => {
      const res = await authGet('/api/system/invite-code', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('inviteCode');
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/system/invite-code').set('User-Agent', UA);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/system/config', () => {
    it('should return full config for admin', async () => {
      const res = await authGet('/api/system/config', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /app/version', () => {
    it('should return app version info', async () => {
      const res = await request(app).get('/api/app/version').set('User-Agent', UA);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('version');
      expect(res.body.data).toHaveProperty('versionCode');
    });
  });
});
