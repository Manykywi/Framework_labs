import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');
const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

async function* itemsNdjsonGenerator(dataDir) {
  let files;
  try {
    files = (await fs.readdir(dataDir)).filter((f) => f.endsWith('.json')).sort();
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const file of files) {
    const content = await fs.readFile(path.join(dataDir, file), 'utf8');
    yield content.trim() + '\n';
  }
}

export async function runBackup() {
  let files = [];
  try {
    files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  if (files.length === 0) return;

  await fs.mkdir(BACKUPS_DIR, { recursive: true });

  const timestamp = Date.now();
  const backupFile = path.join(BACKUPS_DIR, `${timestamp}.gz`);

  await pipeline(
    Readable.from(itemsNdjsonGenerator(DATA_DIR)),
    createGzip(),
    createWriteStream(backupFile)
  );

  const allBackups = (await fs.readdir(BACKUPS_DIR))
    .filter((f) => f.endsWith('.gz'))
    .sort();
  const toDelete = allBackups.slice(0, Math.max(0, allBackups.length - MAX_BACKUPS));
  for (const f of toDelete) {
    await fs.unlink(path.join(BACKUPS_DIR, f));
  }
}
