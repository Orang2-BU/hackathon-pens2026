import { createDatabase } from '../src/db.js';
import { compilePublishedGraph } from '../src/graph-compiler.js';

const args = process.argv.slice(2);
const index = args.indexOf('--revision');
if (index < 0 || !args[index + 1] || args.filter((arg) => arg === '--revision').length !== 1) {
  throw new Error('Usage: node scripts/compile-graph.js --revision <revision-id>');
}
if (!process.env.MIGRATION_DATABASE_URL) throw new Error('MIGRATION_DATABASE_URL is required for graph compilation.');

const database = createDatabase(process.env.MIGRATION_DATABASE_URL, { max: 1 });
try {
  const result = await compilePublishedGraph({ database, revisionId: args[index + 1] });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await database.end({ timeout: 5 });
}
