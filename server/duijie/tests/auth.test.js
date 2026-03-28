const request = require('supertest');
const { loginAsAdmin, authGet, publicReq, closeDb, db, app, UA } = require('./helpers');

afterAll(async () => { await closeDb(); });

describe('Auth API', () => {
  describe('POST /api/auth/send-code', () => {
    it('should not be blocked by the global api limiter after generic api quota is exhausted', async () => {
      const forwardedIp = '198.51.100.77';

      for (let i = 0; i < 300; i += 1) {
        const noise = await request(app)
          .get('/api/users')
          .set('User-Agent', UA)
          .set('X-Forwarded-For', forwardedIp);
        expect(noise.status).toBe(401);
      }

      const limited = await request(app)
        .get('/api/users')
        .set('User-Agent', UA)
        .set('X-Forwarded-For', forwardedIp);
      expect(limited.status).toBe(429);
      expect(limited.body.success).toBe(false);

      const res = await request(app)
        .post('/api/auth/send-code')
        .set('User-Agent', UA)
        .set('X-Forwarded-For', forwardedIp)
        .send({ type: 'email', target: `rate-limit-${Date.now()}@example.com` });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should login successfully by phone verification code', async () => {
      const suffix = String(Date.now()).slice(-8);
      const testPhone = `199${suffix}`;
      const username = `code_user_${suffix}`;
      const [userResult] = await db.query(
        "INSERT INTO voice_users (username, password, nickname, phone, role, is_active) VALUES (?, ?, ?, ?, 'member', 1)",
        [username, 'test123456', '验证码登录测试用户', testPhone]
      );

      try {
        const sendRes = await publicReq('post', '/api/auth/send-code').send({ type: 'phone', target: testPhone });
        expect(sendRes.status).toBe(200);
        expect(sendRes.body.success).toBe(true);
        expect(sendRes.body._dev_code).toMatch(/^\d{6}$/);

        const loginRes = await publicReq('post', '/api/auth/login-by-code').send({
          type: 'phone',
          target: testPhone,
          code: sendRes.body._dev_code,
        });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.success).toBe(true);
        expect(loginRes.body.token).toBeTruthy();
        expect(loginRes.body.data).toHaveProperty('id', userResult.insertId);
      } finally {
        await db.query('DELETE FROM verification_codes WHERE target = ?', [testPhone]);
        await db.query('UPDATE voice_users SET active_enterprise_id = NULL, client_id = NULL, is_deleted = 1 WHERE id = ?', [userResult.insertId]);
      }
    });
  });

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
