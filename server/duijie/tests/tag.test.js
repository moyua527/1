const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

let adminToken;
let tagId = null;
let clientId = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  const [clients] = await db.query("SELECT id FROM duijie_clients WHERE is_deleted = 0 LIMIT 1");
  clientId = clients[0]?.id;
});

afterAll(async () => {
  if (tagId) await db.query("DELETE FROM duijie_tags WHERE id = ?", [tagId]);
  await closeDb();
});

describe('Tag API', () => {
  describe('POST /api/tags', () => {
    it('should create a tag', async () => {
      const uniqueName = 'Jest标签_' + Date.now();
      const res = await authPost('/api/tags', adminToken, { name: uniqueName });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      tagId = res.body.data.id;
    });

    it('should reject duplicate tag', async () => {
      if (!tagId) return;
      // 先查到刚创建的标签名
      const [rows] = await db.query("SELECT name FROM duijie_tags WHERE id = ?", [tagId]);
      const res = await authPost('/api/tags', adminToken, { name: rows[0].name });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tags', () => {
    it('should return tag list', async () => {
      const res = await authGet('/api/tags', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Client Tags', () => {
    it('should set tags for a client', async () => {
      if (!clientId || !tagId) return;
      const res = await authPut(`/api/clients/${clientId}/tags`, adminToken, { tag_ids: [tagId] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get tags for a client', async () => {
      if (!clientId) return;
      const res = await authGet(`/api/clients/${clientId}/tags`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('should delete tag', async () => {
      if (!tagId) return;
      const res = await authDelete(`/api/tags/${tagId}`, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      tagId = null;
    });
  });
});
