import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { students } from '../../db/schema.js';
import { count } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const isForce = process.argv.includes('--force');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

const db = drizzle(pool);

if (isForce) {
  await db.delete(students);
  console.log('Cleared all students');
}

const [{ total }] = await db.select({ total: count() }).from(students);
if (total > 0 && !isForce) {
  console.log('Database already has data. Use seed:force to re-seed.');
  await pool.end();
  process.exit(0);
}

const seedData = [
  { name: 'Ivan', course: 2, grades: JSON.stringify([5, 4, 5]), email: 'ivan@example.com', image: null },
];

await db.insert(students).values(seedData);
console.log(`Seeded ${seedData.length} students`);

await pool.end();
