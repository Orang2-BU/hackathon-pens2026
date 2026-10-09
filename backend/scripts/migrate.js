import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase } from '../src/db.js';
import { applyMigrations } from '../src/migrations.js';

const directory = resolve(fileURLToPath(new URL('../db/migrations/', import.meta.url)));
const url = process.env.MIGRATION_DATABASE_URL;
if (!url) throw new Error('MIGRATION_DATABASE_URL is required.');

const database = createDatabase(url, { max: 1 });
try {
  await applyMigrations(database, directory);
  process.stdout.write('Migrations are up to date.\n');
} finally {
  await database.end({ timeout: 5 });
}
