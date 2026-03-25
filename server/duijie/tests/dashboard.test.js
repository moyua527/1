const { loginAsAdmin, authGet, publicReq, closeDb } = require('./helpers');

let adminToken;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
});

afterAll(async () => {
  await closeDb();
});

describe('Dashboard API', () => {
  describe('GET /api/dashboard/stats', () => {
    it('should reject unauthenticated request', async () => {
      const res = await publicReq('get', '/api/dashboard/stats');
      expect(res.status).toBe(401);
    });

    it('should return stats for admin', async () => {
      const res = await authGet('/api/dashboard/stats', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/dashboard/report', () => {
    it('should return report data', async () => {
      const res = await authGet('/api/dashboard/report', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/chart', () => {
    it('should return chart data with default days', async () => {
      const res = await authGet('/api/dashboard/chart', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should accept days parameter', async () => {
      const res = await authGet('/api/dashboard/chart?days=30', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
