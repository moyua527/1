const { loginAsAdmin, authGet, authPost, authPut, authDelete, closeDb, db } = require('./helpers');

afterAll(async () => { await closeDb(); });

describe('Knowledge Base API', () => {
  let token;
  let catId;
  let articleId;

  beforeAll(async () => { token = await loginAsAdmin(); });

  describe('Categories', () => {
    it('GET /api/kb/categories — should return list', async () => {
      const res = await authGet('/api/kb/categories', token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/kb/categories — should create category', async () => {
      const res = await authPost('/api/kb/categories', token, { name: 'Jest测试分类' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      catId = res.body.data.id;
    });

    it('POST /api/kb/categories — should reject empty name', async () => {
      const res = await authPost('/api/kb/categories', token, { name: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/kb/categories/:id — should update', async () => {
      const res = await authPut(`/api/kb/categories/${catId}`, token, { name: 'Jest更新分类' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Articles', () => {
    it('POST /api/kb/articles — should create article', async () => {
      const res = await authPost('/api/kb/articles', token, {
        title: 'Jest测试文章',
        content: '这是测试内容',
        category_id: catId,
        tags: '测试,jest',
        status: 'published',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      articleId = res.body.data.id;
    });

    it('POST /api/kb/articles — should reject empty title', async () => {
      const res = await authPost('/api/kb/articles', token, { title: '', content: 'test' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/kb/articles — should return list with pagination', async () => {
      const res = await authGet('/api/kb/articles', token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('rows');
      expect(Array.isArray(res.body.data.rows)).toBe(true);
    });

    it('GET /api/kb/articles — should filter by category', async () => {
      const res = await authGet(`/api/kb/articles?category_id=${catId}`, token);
      expect(res.status).toBe(200);
      expect(res.body.data.rows.every(a => a.category_id === catId)).toBe(true);
    });

    it('GET /api/kb/articles — should search by keyword', async () => {
      const res = await authGet('/api/kb/articles?search=Jest', token);
      expect(res.status).toBe(200);
      expect(res.body.data.rows.length).toBeGreaterThan(0);
    });

    it('GET /api/kb/articles/:id — should return article detail', async () => {
      const res = await authGet(`/api/kb/articles/${articleId}`, token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Jest测试文章');
      expect(res.body.data.content).toBe('这是测试内容');
    });

    it('PUT /api/kb/articles/:id — should update article', async () => {
      const res = await authPut(`/api/kb/articles/${articleId}`, token, {
        title: 'Jest更新文章',
        status: 'draft',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/kb/articles/:id — should soft delete', async () => {
      const res = await authDelete(`/api/kb/articles/${articleId}`, token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const check = await authGet(`/api/kb/articles/${articleId}`, token);
      expect(check.status).toBe(404);
    });
  });

  describe('Cleanup', () => {
    it('should delete test category', async () => {
      if (catId) {
        const res = await authDelete(`/api/kb/categories/${catId}`, token);
        expect(res.status).toBe(200);
      }
    });
  });
});
