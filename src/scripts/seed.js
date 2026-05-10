import mongoose from 'mongoose';
import { Student } from '../../db/models/student.model.js';
import dotenv from 'dotenv';

dotenv.config();

const isForce = process.argv.includes('--force');

await mongoose.connect(process.env.MONGO_URL, {
  dbName: process.env.MONGO_DB_NAME,
});

if (isForce) {
  await Student.deleteMany({});
  console.log('Cleared all students');
}

const count = await Student.countDocuments();
if (count > 0 && !isForce) {
  console.log('Database already has data. Use seed:force to re-seed.');
  await mongoose.connection.close();
  process.exit(0);
}

const students = [
  { name: 'Ivan', course: 2, grades: [5, 4, 5], email: 'ivan@example.com', image: null },
];

await Student.insertMany(students);
console.log(`Seeded ${students.length} students`);

await mongoose.connection.close();
