import { resolve } from 'node:path';
import { createDatabase } from '../src/db.js';
import { scoreDataset } from '../src/dataset-scoring.js';
import { persistScoreReport } from '../src/score-repository.js';

function options(args) {
  const values = { dir: null, revisionId: null, persist: false };
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === '--persist') values.persist = true;
    else if (option === '--dir' || option === '--revision') {
      const value = args[++index];
      if (!value) throw new Error(`${option} requires a value.`);
      if (option === '--dir') values.dir = value;
      if (option === '--revision') values.revisionId = value;
    } else throw new Error(`Unknown option: ${option}`);
  }
  return values;
}

let database;
try {
  const input = options(process.argv.slice(2));
  if (!input.persist) throw new Error('No database write was made. Pass --persist only after reviewing the experimental formula.');
  if (!input.dir || !input.revisionId?.startsWith('revision:')) {
    throw new Error('Usage: node scripts/persist-score.js --dir <dataset-directory> --revision revision:<sha256> --persist');
  }
  const report = await scoreDataset(resolve(input.dir));
  database = createDatabase(process.env.DATABASE_URL);
  const persistence = await persistScoreReport({ database, report, revisionId: input.revisionId });
  process.stdout.write(`${JSON.stringify({ synthetic: report.synthetic, datasetHash: report.datasetHash,
    formulaVersion: report.formulaVersion, customerCount: report.customerCount,
    topThree: report.ranking.slice(0, 3).map(({ accountId, score, coverage }) => ({ accountId, score, coverage })),
    sensitivity: report.sensitivity, persistence }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error?.code ?? 'SCORE_PERSISTENCE_ERROR'}: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  await database?.end({ timeout: 5 });
}
