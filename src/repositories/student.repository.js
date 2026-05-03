import fs from 'fs/promises';
import path from 'path';
import writeAtomic from '../utils/atomicWrite.js';
import StudentModel from '../models/item.model.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');

function filePath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

async function findAll() {
  try {
    const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
    const students = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
        return JSON.parse(content);
      })
    );
    return students.sort((a, b) => a.id - b.id);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function findById(id) {
  try {
    const content = await fs.readFile(filePath(id), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function create(data) {
  const all = await findAll();
  const lastId = all.length ? all[all.length - 1].id : 0;
  const id = lastId + 1;
  const newStudent = { ...StudentModel, ...data, id };
  await writeAtomic(filePath(id), newStudent);
  return newStudent;
}

async function update(id, updates) {
  const student = await findById(id);
  if (!student) return null;
  const updated = { ...student, ...updates };
  await writeAtomic(filePath(id), updated);
  return updated;
}

async function remove(id) {
  try {
    await fs.unlink(filePath(id));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function* findAllStream() {
  let files;
  try {
    files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json')).sort();
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const file of files) {
    const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
    yield JSON.parse(content);
  }
}

export default { findAll, findById, create, update, remove, findAllStream };
