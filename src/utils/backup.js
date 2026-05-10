import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

async function* ndjsonLines(repo) {
  for await (const student of repo.findAllStream()) {
    yield JSON.stringify(student) + '\n';
  }
}

export async function runBackup(repo) {
  const total = await repo.count();
  if (total === 0) return;

  await fs.mkdir(BACKUPS_DIR, { recursive: true });

  const timestamp = Date.now();
  const backupFile = path.join(BACKUPS_DIR, `${timestamp}.gz`);

  await pipeline(
    Readable.from(ndjsonLines(repo)),
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
