import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const MIGRATION_NAME = /^([0-9]{3}_[a-z0-9_-]+)\.sql$/;

export async function discoverMigrations(directory) {
  const files = (await readdir(directory))
    .filter((name) => MIGRATION_NAME.test(name))
    .sort();
  const migrations = [];

  for (const file of files) {
    const match = MIGRATION_NAME.exec(file);
    const sql = await readFile(join(directory, file), 'utf8');
    if (!sql.trim()) throw new Error(`Migration ${file} is empty.`);
    migrations.push({
      version: match[1],
      file,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex'),
    });
  }

  return migrations;
}

export async function applyMigrations(database, directory) {
  const migrations = await discoverMigrations(directory);
  const connection = await database.reserve();

  try {
    await connection`SELECT pg_advisory_lock(7319426102481)`;
    await connection`SET ROLE tessera_migrator`;
    await connection`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    const appliedRows = await connection`SELECT version, checksum FROM schema_migrations`;
    const applied = new Map(appliedRows.map(({ version, checksum }) => [version, checksum]));
    const available = new Set(migrations.map(({ version }) => version));

    for (const version of applied.keys()) {
      if (!available.has(version)) throw new Error(`Applied migration ${version} is missing from disk.`);
    }

    for (const migration of migrations) {
      const previousChecksum = applied.get(migration.version);
      if (previousChecksum && previousChecksum !== migration.checksum) {
        throw new Error(`Applied migration ${migration.version} checksum mismatch.`);
      }
      if (previousChecksum) continue;

      await connection.unsafe('BEGIN');
      try {
        await connection.unsafe(migration.sql, [], { prepare: false });
        await connection`
          INSERT INTO schema_migrations (version, checksum)
          VALUES (${migration.version}, ${migration.checksum})
        `;
        await connection.unsafe('COMMIT');
      } catch (error) {
        await connection.unsafe('ROLLBACK');
        throw error;
      }
    }
  } finally {
    try {
      await connection`SELECT pg_advisory_unlock(7319426102481)`;
    } finally {
      try { await connection.unsafe('RESET ROLE'); } finally { connection.release(); }
    }
  }
}
