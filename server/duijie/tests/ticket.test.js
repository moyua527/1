const { loginAsAdmin, authGet, authPost, authPut, closeDb, db } = require('./helpers');

let adminToken;
let ticketId = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
});

afterAll(async () => {
  if (ticketId) {
    await db.query("UPDATE duijie_tickets SET is_deleted = 1 WHERE id = ?", [ticketId]);
  }
  await closeDb();
});

describe('Ticket API', () => {
  describe('POST /api/tickets', () => {
    it('should reject ticket without title', async () => {
      const res = await authPost('/api/tickets', adminToken, { title: '', content: 'test' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create ticket successfully', async () => {
      const res = await authPost('/api/tickets', adminToken, {
        title: 'Jest测试工单',
        content: '这是一个测试工单',
        type: 'question',
        priority: 'medium',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      ticketId = res.body.data.id;
    });
  });

  describe('GET /api/tickets', () => {
    it('should return ticket list', async () => {
      const res = await authGet('/api/tickets', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should include created ticket in list', async () => {
      const res = await authGet('/api/tickets', adminToken);
      const found = res.body.data.find(t => t.id === ticketId);
      expect(found).toBeTruthy();
      expect(found.title).toBe('Jest测试工单');
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('should return ticket detail with replies', async () => {
      const res = await authGet(`/api/tickets/${ticketId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title', 'Jest测试工单');
      expect(res.body.data).toHaveProperty('replies');
      expect(Array.isArray(res.body.data.replies)).toBe(true);
    });

    it('should return 404 for non-existent ticket', async () => {
      const res = await authGet('/api/tickets/999999', adminToken);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/tickets/:id/reply', () => {
    it('should reject empty reply', async () => {
      const res = await authPost(`/api/tickets/${ticketId}/reply`, adminToken, { content: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should add reply successfully', async () => {
      const res = await authPost(`/api/tickets/${ticketId}/reply`, adminToken, { content: '已收到，正在处理' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('should auto-change status to processing after staff reply', async () => {
      const res = await authGet(`/api/tickets/${ticketId}`, adminToken);
      expect(res.body.data.status).toBe('processing');
    });
  });

  describe('PUT /api/tickets/:id', () => {
    it('should update ticket status', async () => {
      const res = await authPut(`/api/tickets/${ticketId}`, adminToken, { status: 'resolved' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject empty update', async () => {
      const res = await authPut(`/api/tickets/${ticketId}`, adminToken, {});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/tickets/:id/rate', () => {
    it('should reject invalid rating', async () => {
      const res = await authPost(`/api/tickets/${ticketId}/rate`, adminToken, { rating: 0 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should rate ticket successfully', async () => {
      const res = await authPost(`/api/tickets/${ticketId}/rate`, adminToken, {
        rating: 5,
        rating_comment: '服务很好',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Unauthenticated access', () => {
    it('should reject unauthenticated ticket list', async () => {
      const request = require('supertest');
      const app = require('../app');
      const res = await request(app).get('/api/tickets').set('User-Agent', 'Mozilla/5.0 (Jest Test Runner)');
      expect(res.status).toBe(401);
    });
  });
});
