import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import writeAtomic from '../utils/atomicWrite.js';
import StudentModel from '../models/item.model.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');
const VERSION_FILE = path.join(process.cwd(), 'data', 'version.json');

export function computeModelHash() {
  return crypto.createHash('md5').update(JSON.stringify(StudentModel)).digest('hex');
}

async function migrate() {
  const currentHash = computeModelHash();

  let savedHash = null;
  try {
    const content = await fs.readFile(VERSION_FILE, 'utf8');
    savedHash = JSON.parse(content).hash;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (currentHash === savedHash) {
    console.log('No migration needed.');
    return;
  }

  console.log('Running migration...');

  let files = [];
  try {
    files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  for (const file of files) {
    const fp = path.join(DATA_DIR, file);
    const content = await fs.readFile(fp, 'utf8');
    const existing = JSON.parse(content);
    const migrated = { ...StudentModel, ...existing };
    await writeAtomic(fp, migrated);
    console.log(`Migrated ${file}`);
  }

  await writeAtomic(VERSION_FILE, { hash: currentHash });
  console.log('Migration complete.');
}

await migrate();
