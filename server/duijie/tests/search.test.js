const { loginAsAdmin, authGet, publicReq, closeDb } = require('./helpers');

afterAll(async () => { await closeDb(); });

describe('Search API', () => {
  let token;
  beforeAll(async () => { token = await loginAsAdmin(); });

  it('should reject unauthenticated request', async () => {
    const res = await publicReq('get', '/api/search?q=test');
    expect(res.status).toBe(401);
  });

  it('should return empty results for empty query', async () => {
    const res = await authGet('/api/search?q=', token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('projects');
  });

  it('should return structured results', async () => {
    const res = await authGet('/api/search?q=test', token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { data } = res.body;
    expect(data).toHaveProperty('projects');
    expect(data).toHaveProperty('clients');
    expect(data).toHaveProperty('tasks');
    expect(data).toHaveProperty('files');
    expect(Array.isArray(data.projects)).toBe(true);
  });

  it('should filter by type', async () => {
    const res = await authGet('/api/search?q=a&type=projects', token);
    expect(res.status).toBe(200);
    expect(res.body.data.clients).toBeUndefined();
  });

  it('should respect limit parameter', async () => {
    const res = await authGet('/api/search?q=a&limit=2', token);
    expect(res.status).toBe(200);
    for (const key of Object.keys(res.body.data)) {
      expect(res.body.data[key].length).toBeLessThanOrEqual(2);
    }
  });
});
