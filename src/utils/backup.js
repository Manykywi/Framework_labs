import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');
const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

export async function runBackup() {
  let files = [];
  try {
    files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  if (files.length === 0) return;

  const timestamp = Date.now();
  const backupDir = path.join(BACKUPS_DIR, String(timestamp));
  await fs.mkdir(backupDir, { recursive: true });

  for (const file of files) {
    await fs.copyFile(path.join(DATA_DIR, file), path.join(backupDir, file));
  }

  const allBackups = (await fs.readdir(BACKUPS_DIR)).sort();
  const toDelete = allBackups.slice(0, Math.max(0, allBackups.length - MAX_BACKUPS));
  for (const dir of toDelete) {
    await fs.rm(path.join(BACKUPS_DIR, dir), { recursive: true });
  }
}
