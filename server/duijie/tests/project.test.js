const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

let adminToken;
let projectId = null;
let clientId = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();

  const [clients] = await db.query("SELECT id FROM duijie_clients WHERE is_deleted = 0 LIMIT 1");
  if (clients[0]) clientId = clients[0].id;
});

afterAll(async () => {
  if (projectId) {
    await db.query("UPDATE duijie_projects SET is_deleted = 1 WHERE id = ?", [projectId]);
  }
  await closeDb();
});

describe('Project API', () => {
  describe('POST /api/projects', () => {
    it('should create project with client association', async () => {
      const body = {
        name: 'Jest测试项目',
        description: '自动化测试项目',
        client_id: clientId,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      };
      const res = await authPost('/api/projects', adminToken, body);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      projectId = res.body.data.id;
    });
  });

  describe('GET /api/projects', () => {
    it('should return project list', async () => {
      const res = await authGet('/api/projects', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated access', async () => {
      const request = require('supertest');
      const app = require('../app');
      const res = await request(app).get('/api/projects').set('User-Agent', 'Mozilla/5.0 (Jest Test Runner)');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project detail', async () => {
      if (!projectId) return;
      const res = await authGet(`/api/projects/${projectId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Jest测试项目');
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project', async () => {
      if (!projectId) return;
      const res = await authPut(`/api/projects/${projectId}`, adminToken, {
        name: 'Jest测试项目-更新',
        status: 'in_progress',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should soft delete project', async () => {
      if (!projectId) return;
      const res = await authDelete(`/api/projects/${projectId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      projectId = null;
    });
  });
});
