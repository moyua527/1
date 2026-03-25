const { loginAsAdmin, authGet, authPost, authPut, closeDb, db } = require('./helpers');
const request = require('supertest');
const app = require('../app');

let adminToken;
let taskId = null;
let projectId = null;
const UA = 'Mozilla/5.0 (Jest Test Runner)';

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const [projects] = await db.query("SELECT id FROM duijie_projects WHERE is_deleted = 0 LIMIT 1");
  projectId = projects[0]?.id;
});

afterAll(async () => {
  if (taskId) await db.query("UPDATE duijie_tasks SET is_deleted = 1 WHERE id = ?", [taskId]);
  await closeDb();
});

describe('Task API', () => {
  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const res = await authPost('/api/tasks', adminToken, {
        project_id: projectId, title: 'Jest测试任务', description: '测试', priority: 'medium', status: 'todo',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      taskId = res.body.data?.id;
    });
  });

  describe('GET /api/tasks', () => {
    it('should return task list', async () => {
      const res = await authGet('/api/tasks', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/tasks').set('User-Agent', UA);
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/tasks/:id/move', () => {
    it('should move task status', async () => {
      if (!taskId) return;
      const res = await request(app).patch(`/api/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${adminToken}`).set('User-Agent', UA)
        .send({ status: 'in_progress' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task', async () => {
      if (!taskId) return;
      const res = await authPut(`/api/tasks/${taskId}`, adminToken, { title: 'Jest任务-已更新', priority: 'high' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('Milestone API', () => {
  let msId;

  it('should create milestone', async () => {
    if (!projectId) return;
    const res = await authPost('/api/milestones', adminToken, { project_id: projectId, title: 'Jest里程碑', due_date: '2026-12-31' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    msId = res.body.data?.id;
  });

  it('should list milestones', async () => {
    const res = await authGet(`/api/milestones?project_id=${projectId}`, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should toggle milestone', async () => {
    if (!msId) return;
    const res = await request(app).patch(`/api/milestones/${msId}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`).set('User-Agent', UA);
    expect(res.status).toBe(200);
  });

  it('should delete milestone', async () => {
    if (!msId) return;
    const res = await request(app).delete(`/api/milestones/${msId}`)
      .set('Authorization', `Bearer ${adminToken}`).set('User-Agent', UA);
    expect(res.status).toBe(200);
  });
});
