const request = require('supertest');
const { loginAsAdmin, authGet, publicReq, closeDb, app, UA } = require('./helpers');

afterAll(async () => { await closeDb(); });

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should reject empty credentials', async () => {
      const res = await publicReq('post', '/api/auth/login').send({});
      expect([400, 401]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject wrong password', async () => {
      const res = await publicReq('post', '/api/auth/login').send({ username: 'admin', password: 'wrongpassword123' });
      expect([400, 401]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject unauthenticated request', async () => {
      const res = await publicReq('get', '/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user info with valid token', async () => {
      const token = await loginAsAdmin();
      const res = await authGet('/api/auth/me', token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('username');
      expect(res.body.data).toHaveProperty('role');
    });
  });

  describe('Authorization guards', () => {
    it('should reject unauthenticated access to admin endpoints', async () => {
      const res = await publicReq('get', '/api/users');
      expect(res.status).toBe(401);
    });

    it('should allow admin to access admin endpoints', async () => {
      const token = await loginAsAdmin();
      const res = await authGet('/api/users', token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
