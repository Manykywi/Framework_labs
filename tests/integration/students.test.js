import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestApp, cleanDb, registerAndLogin, VALID_STUDENT } from './helpers.js';

describe('Students API', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = await createTestApp();
    token = await registerAndLogin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await app.mysql.query('DELETE FROM students');
    await app.redis.flushdb();
  });

  describe('GET /api/v1/students', () => {
    it('returns 200 with empty list initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/students' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ count: 0, items: [] });
    });

    it('returns students after creation', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: VALID_STUDENT,
      });
      const res = await app.inject({ method: 'GET', url: '/api/v1/students' });
      expect(res.statusCode).toBe(200);
      expect(res.json().count).toBe(1);
    });

    it('filters by course', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: VALID_STUDENT,
      });
      const res = await app.inject({ method: 'GET', url: '/api/v1/students?course=99' });
      expect(res.statusCode).toBe(200);
      expect(res.json().count).toBe(0);
    });
  });

  describe('POST /api/v1/students', () => {
    it('returns 401 without token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/students',
        payload: VALID_STUDENT,
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 201 with created student on valid data', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: VALID_STUDENT,
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.student.name).toBe(VALID_STUDENT.name);
      expect(body.student).toHaveProperty('id');
    });

    it('returns 400 on missing required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Only Name' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/v1/students/:id', () => {
    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'PATCH', url: '/api/v1/students/1', payload: { name: 'X' } });
      expect(res.statusCode).toBe(401);
    });

    it('returns 200 and updates existing student', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: VALID_STUDENT,
      });
      const { id } = created.json().student;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/students/${id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Updated Name' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().student.name).toBe('Updated Name');
    });

    it('returns 404 for non-existing student', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/students/99999',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'X' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/v1/students/:id', () => {
    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/v1/students/1' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 200 and deletes existing student', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: VALID_STUDENT,
      });
      const { id } = created.json().student;

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/students/${id}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 for non-existing student', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/students/99999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/v2/students (pagination + cache)', () => {
    it('returns 200 with pagination meta', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v2/students?page=1&limit=5' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty('meta');
      expect(body.meta).toMatchObject({ page: 1, limit: 5 });
    });

    it('returns same data from cache on second request', async () => {
      const first = await app.inject({ method: 'GET', url: '/api/v2/students?page=1&limit=10' });
      const second = await app.inject({ method: 'GET', url: '/api/v2/students?page=1&limit=10' });
      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(200);
      expect(first.json().meta.total).toBe(second.json().meta.total);
    });

    it('invalidates cache after student creation', async () => {
      const before = await app.inject({ method: 'GET', url: '/api/v2/students' });
      await app.inject({
        method: 'POST',
        url: '/api/v1/students',
        headers: { authorization: `Bearer ${token}` },
        payload: VALID_STUDENT,
      });
      const after = await app.inject({ method: 'GET', url: '/api/v2/students' });
      expect(after.json().meta.total).toBe(before.json().meta.total + 1);
    });
  });
});
