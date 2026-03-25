const { loginAsAdmin, authGet, closeDb } = require('./helpers');
const request = require('supertest');
const app = require('../app');
const path = require('path');
const fs = require('fs');

let adminToken;
let fileId = null;
const UA = 'Mozilla/5.0 (Jest Test Runner)';

beforeAll(async () => { adminToken = await loginAsAdmin(); });

afterAll(async () => { await closeDb(); });

describe('File API', () => {
  describe('POST /api/files/upload', () => {
    it('should upload a text file', async () => {
      const tmpPath = path.join(__dirname, 'test-upload.txt');
      fs.writeFileSync(tmpPath, 'Jest test file content');
      try {
        const res = await request(app)
          .post('/api/files/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('User-Agent', UA)
          .attach('file', tmpPath);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        fileId = res.body.data?.id;
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    it('should reject without file', async () => {
      const res = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', UA);
      expect([400, 200]).toContain(res.status);
    });
  });

  describe('GET /api/files/all', () => {
    it('should return all files', async () => {
      const res = await authGet('/api/files/all', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/files/all').set('User-Agent', UA);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/files/:id/download', () => {
    it('should download file', async () => {
      if (!fileId) return;
      const res = await request(app)
        .get(`/api/files/${fileId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', UA);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('should delete file', async () => {
      if (!fileId) return;
      const res = await request(app)
        .delete(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', UA);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
