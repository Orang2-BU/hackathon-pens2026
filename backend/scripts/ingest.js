import { resolve } from 'node:path';
import { inspectDataset } from '../src/dataset.js';
import { ingestDataset } from '../src/ingest.js';
import { createDatabase } from '../src/db.js';

const args = process.argv.slice(2);
const directoryIndex = args.indexOf('--dir');
const dryRun = args.includes('--dry-run');
const publish = args.includes('--publish');
if (directoryIndex < 0 || !args[directoryIndex + 1] || dryRun === publish || args.filter((arg) => arg === '--dry-run' || arg === '--publish').length !== 1) {
  throw new Error('Usage: node scripts/ingest.js --dir <dataset-directory> (--dry-run | --publish)');
}

const directory = resolve(args[directoryIndex + 1]);
if (dryRun) {
  const report = await inspectDataset(directory);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.issueCount > 0 || report.orphanCount > 0) process.exitCode = 1;
} else {
  if (!process.env.MIGRATION_DATABASE_URL) throw new Error('MIGRATION_DATABASE_URL is required for --publish.');
  const database = createDatabase(process.env.MIGRATION_DATABASE_URL, { max: 1 });
  try {
    const result = await ingestDataset({ database, directory });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await database.end({ timeout: 5 });
  }
}
