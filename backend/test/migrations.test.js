import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';
import { discoverMigrations } from '../src/migrations.js';

const directories = new Set();

afterEach(async () => {
  await Promise.all([...directories].map((directory) => rm(directory, { recursive: true, force: true })));
  directories.clear();
});

async function makeDirectory() {
  const directory = await mkdtemp(join(tmpdir(), 'tessera-migrations-'));
  directories.add(directory);
  return directory;
}

test('migration discovery sorts valid versioned files and hashes exact bytes', async () => {
  const directory = await makeDirectory();
  await writeFile(join(directory, '002_second.sql'), 'SELECT 2;\n');
  await writeFile(join(directory, '003_jev_cache.sql'), 'SELECT 3;\n');
  await writeFile(join(directory, '001_first.sql'), 'SELECT 1;\n');
  await writeFile(join(directory, 'README.md'), 'ignored');

  const migrations = await discoverMigrations(directory);
  assert.deepEqual(migrations.map(({ version }) => version), ['001_first', '002_second', '003_jev_cache']);
  assert.equal(migrations[0].checksum.length, 64);
});

test('empty migration fails closed', async () => {
  const directory = await makeDirectory();
  await writeFile(join(directory, '001_empty.sql'), '  \n');
  await assert.rejects(discoverMigrations(directory), /is empty/);
});
