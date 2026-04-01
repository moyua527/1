const { loginAsAdmin, authGet, authPost, authDelete, closeDb, db } = require('./helpers');
const request = require('supertest');
const app = require('../app');

let adminToken;
let inviteLinkId = null;
let inviteToken = null;
const UA = 'Mozilla/5.0 (Jest Test Runner)';

beforeAll(async () => {
  adminToken = await loginAsAdmin();
});

afterAll(async () => {
  if (inviteLinkId) await db.query("DELETE FROM duijie_invite_links WHERE id = ?", [inviteLinkId]);
  await closeDb();
});

describe('Invite Links API', () => {
  describe('POST /api/invite-links', () => {
    it('should create an invite link', async () => {
      const res = await authPost('/api/invite-links', adminToken, {
        expires_hours: 24,
        note: 'Jest测试邀请链接',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      inviteLinkId = res.body.data.id;
      inviteToken = res.body.data.token;
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).post('/api/invite-links').set('User-Agent', UA)
        .send({ expires_hours: 24 });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/invite-links', () => {
    it('should return invite links list', async () => {
      const res = await authGet('/api/invite-links', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/invite-links/:token/validate', () => {
    it('should validate a valid token', async () => {
      if (!inviteToken) return;
      const res = await request(app).get(`/api/invite-links/${inviteToken}/validate`).set('User-Agent', UA);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid token', async () => {
      const res = await request(app).get('/api/invite-links/invalid_token_xyz/validate').set('User-Agent', UA);
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data?.valid).toBeFalsy();
      }
    });
  });

  describe('DELETE /api/invite-links/:id', () => {
    it('should delete invite link', async () => {
      if (!inviteLinkId) return;
      const res = await authDelete(`/api/invite-links/${inviteLinkId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      inviteLinkId = null;
    });
  });
});
