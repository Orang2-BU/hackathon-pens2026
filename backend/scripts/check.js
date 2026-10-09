import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    files.push(...(entry.isDirectory() ? await filesUnder(path) : [path]));
  }
  return files;
}

const files = (await Promise.all(['src', 'scripts', 'test'].map((dir) => filesUnder(dir).catch(() => []))))
  .flat()
  .filter((file) => file.endsWith('.js'));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
