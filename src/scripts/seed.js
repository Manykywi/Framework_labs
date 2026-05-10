import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isForce = process.argv.includes('--force');

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

if (isForce) {
  await conn.execute('DELETE FROM students');
  console.log('Cleared all students');
}

const [rows] = await conn.execute('SELECT COUNT(*) as total FROM students');
if (rows[0].total > 0 && !isForce) {
  console.log('Database already has data. Use seed:force to re-seed.');
  await conn.end();
  process.exit(0);
}

const students = [
  { name: 'Ivan', course: 2, grades: [5, 4, 5], email: 'ivan@example.com', image: null },
];

for (const s of students) {
  await conn.execute(
    'INSERT INTO students (name, course, grades, email, image) VALUES (?, ?, ?, ?, ?)',
    [s.name, s.course, JSON.stringify(s.grades), s.email, s.image]
  );
  console.log(`Seeded student: ${s.name}`);
}

console.log('Seed complete');
await conn.end();
