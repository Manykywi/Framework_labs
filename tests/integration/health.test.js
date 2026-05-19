import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp } from './helpers.js';

describe('Health endpoints', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });

  it('GET /health/details with valid api key → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/details',
      headers: { 'x-api-key': 'test-admin-key' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET /health/details without api key → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/details' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /health/details with wrong api key → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/details',
      headers: { 'x-api-key': 'wrong-key' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET unknown route → 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/not-found' });
    expect(res.statusCode).toBe(404);
  });
});
