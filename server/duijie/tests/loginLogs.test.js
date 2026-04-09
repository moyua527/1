const { loginAsAdmin, authGet, publicReq, closeDb } = require('./helpers');

afterAll(async () => { await closeDb(); });

describe('Login Logs API', () => {
  let token;
  beforeAll(async () => { token = await loginAsAdmin(); });

  it('should reject unauthenticated request', async () => {
    const res = await publicReq('get', '/api/auth/login-logs');
    expect(res.status).toBe(401);
  });

  it('should return paginated login logs', async () => {
    const res = await authGet('/api/auth/login-logs', token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('rows');
    expect(Array.isArray(res.body.data.rows)).toBe(true);
    expect(res.body.data).toHaveProperty('page', 1);
  });

  it('should respect limit parameter', async () => {
    const res = await authGet('/api/auth/login-logs?limit=5', token);
    expect(res.status).toBe(200);
    expect(res.body.data.rows.length).toBeLessThanOrEqual(5);
  });

  it('should have correct row structure', async () => {
    const res = await authGet('/api/auth/login-logs?limit=1', token);
    if (res.body.data.rows.length > 0) {
      const row = res.body.data.rows[0];
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('login_type');
      expect(row).toHaveProperty('ip');
      expect(row).toHaveProperty('device_name');
      expect(row).toHaveProperty('status');
      expect(row).toHaveProperty('created_at');
    }
  });
});
