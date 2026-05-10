import path from 'path';
import writeAtomic from '../utils/atomicWrite.js';
import StudentModel from '../models/item.model.js';

const INITIAL_STUDENTS = [
  { id: 1, name: 'Ivan', course: 2, grades: [5, 4, 5], email: 'ivan@example.com', image: null },
];

const DATA_DIR = path.join(process.cwd(), 'data', 'items');

for (const student of INITIAL_STUDENTS) {
  const data = { ...StudentModel, ...student };
  await writeAtomic(path.join(DATA_DIR, `${student.id}.json`), data);
  console.log(`Seeded student ${student.id}`);
}

console.log('Seed complete');
