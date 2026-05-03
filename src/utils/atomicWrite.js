import fs from 'fs/promises';
import path from 'path';

const writeAtomic = async (filePath, data) => {
  const tmp = `${filePath}.tmp`;
  const dir = path.dirname(filePath);

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, filePath);
  } catch (error) {
    try {
      await fs.unlink(tmp);
    } catch (unlinkError) {
      if (unlinkError.code !== 'ENOENT') {
        console.error('Failed to cleanup tmp file:', unlinkError);
      }
    }
    throw error;
  }
};

export default writeAtomic;
