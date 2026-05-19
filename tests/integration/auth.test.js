import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestApp, cleanDb } from './helpers.js';

describe('Auth endpoints', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDb(app);
  });

  describe('POST /auth/register', () => {
    it('returns 201 with user on valid data', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'new@test.com', password: 'password123' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toHaveProperty('id');
      expect(body.email).toBe('new@test.com');
      expect(body).not.toHaveProperty('password');
    });

    it('returns 409 on duplicate email', async () => {
      const payload = { email: 'dup@test.com', password: 'password123' };
      await app.inject({ method: 'POST', url: '/auth/register', payload });
      const res = await app.inject({ method: 'POST', url: '/auth/register', payload });
      expect(res.statusCode).toBe(409);
    });

    it('returns 400 on invalid email format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'not-an-email', password: 'password123' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 on password shorter than 8 chars', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'valid@test.com', password: 'short' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 on missing fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'valid@test.com' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'login@test.com', password: 'password123' },
      });
    });

    it('returns 200 with accessToken and refreshToken cookie', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'login@test.com', password: 'password123' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty('accessToken');
      expect(typeof body.accessToken).toBe('string');
      const cookies = res.cookies;
      expect(cookies.some((c) => c.name === 'refreshToken')).toBe(true);
    });

    it('returns 401 on wrong password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'login@test.com', password: 'wrongpass' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 on non-existent email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'nobody@test.com', password: 'password123' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns 200 with new accessToken using valid cookie', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'refresh@test.com', password: 'password123' },
      });
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'refresh@test.com', password: 'password123' },
      });
      const cookie = loginRes.cookies.find((c) => c.name === 'refreshToken');

      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        cookies: { refreshToken: cookie.value },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty('accessToken');
    });

    it('returns 401 without refresh cookie', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/refresh' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 with invalid refresh token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        cookies: { refreshToken: 'not-a-valid-jwt' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 204 and blacklists the access token', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'logout@test.com', password: 'password123' },
      });
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'logout@test.com', password: 'password123' },
      });
      const { accessToken } = loginRes.json();

      const logoutRes = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(logoutRes.statusCode).toBe(204);

      const protectedRes = await app.inject({
        method: 'POST',
        url: '/api/v1/students',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { name: 'Test', course: 1, email: 'x@x.com', grades: [] },
      });
      expect(protectedRes.statusCode).toBe(401);
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/logout' });
      expect(res.statusCode).toBe(401);
    });
  });
});
