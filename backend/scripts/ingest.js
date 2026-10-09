import { resolve } from 'node:path';
import { inspectDataset } from '../src/dataset.js';

const args = process.argv.slice(2);
const directoryIndex = args.indexOf('--dir');
if (directoryIndex < 0 || !args[directoryIndex + 1] || !args.includes('--dry-run')) {
  throw new Error('Usage: node scripts/ingest.js --dir <dataset-directory> --dry-run');
}

const report = await inspectDataset(resolve(args[directoryIndex + 1]));
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.issueCount > 0) process.exitCode = 1;
