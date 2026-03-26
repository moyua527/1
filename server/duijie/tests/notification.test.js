const { loginAsAdmin, authGet, closeDb } = require('./helpers');
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

describe('Notification API', () => {
  describe('GET /api/notifications', () => {
    it('should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/notifications').set('User-Agent', UA);
      expect(res.status).toBe(401);
    });

    it('should return notification list', async () => {
      const res = await authGet('/api/notifications', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data).toHaveProperty('unreadCount');
      expect(res.body.data).toHaveProperty('unreadByCategory');
    });
  });

  describe('PATCH /api/notifications/all/read', () => {
    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/all/read')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', UA);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('Audit Log API', () => {
  describe('GET /api/audit-logs', () => {
    it('should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/audit-logs').set('User-Agent', UA);
      expect(res.status).toBe(401);
    });

    it('should return audit logs for admin', async () => {
      const res = await authGet('/api/audit-logs', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await authGet('/api/audit-logs?page=1&limit=5', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('User Management API', () => {
  describe('GET /api/users', () => {
    it('should return user list for admin', async () => {
      const res = await authGet('/api/users', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});

describe('System Config API', () => {
  describe('GET /api/system/invite-code', () => {
    it('should return invite code for authenticated user', async () => {
      const res = await authGet('/api/system/invite-code', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/system/config', () => {
    it('should return all configs for admin', async () => {
      const res = await authGet('/api/system/config', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
