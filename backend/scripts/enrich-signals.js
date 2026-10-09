import { createDatabase } from '../src/db.js';
import { createConfiguredJevClient } from '../src/jev.js';
import { enrichPublishedInteractions } from '../src/signal-enrichment.js';

function options(args) {
  const result = { execute: false, revisionId: null, limit: null, after: 0 };
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === '--execute') result.execute = true;
    else if (['--revision', '--limit', '--after'].includes(option)) {
      const value = args[++index];
      if (!value) throw new Error(`${option} requires a value.`);
      if (option === '--revision') result.revisionId = value;
      if (option === '--limit') result.limit = Number(value);
      if (option === '--after') result.after = Number(value);
    } else throw new Error(`Unknown option: ${option}`);
  }
  return result;
}

let database;
try {
  const input = options(process.argv.slice(2));
  if (!input.execute) throw new Error('No provider call was made. Pass --execute explicitly after reviewing rubric and cost limits.');
  if (!input.revisionId?.startsWith('revision:') || !Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100) {
    throw new Error('Usage: node scripts/enrich-signals.js --revision revision:<sha256> --limit 1..100 --execute [--after record-number].');
  }
  database = createDatabase(process.env.DATABASE_URL);
  const jevClient = createConfiguredJevClient({ database });
  const report = await enrichPublishedInteractions({ database, jevClient, revisionId: input.revisionId, limit: input.limit, afterRecordNumber: input.after });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.failed > 0) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`${error?.code ?? 'ENRICHMENT_ERROR'}: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  await database?.end({ timeout: 5 });
}
