import { migrate } from 'drizzle-orm/mysql2/migrator';
import { buildApp } from '../../app.js';

export async function createTestApp() {
  const app = await buildApp();
  await app.ready();
  await migrate(app.drizzle, { migrationsFolder: './drizzle' });
  return app;
}

export async function cleanDb(app) {
  await app.mysql.query('DELETE FROM students');
  await app.mysql.query('DELETE FROM users');
  await app.redis.flushdb();
}

export async function registerAndLogin(app, email = 'user@test.com', password = 'password123') {
  await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password },
  });
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
  });
  return res.json().accessToken;
}

export const VALID_STUDENT = {
  name: 'Test Student',
  course: 1,
  grades: [80, 90],
  email: 'student@test.com',
};
