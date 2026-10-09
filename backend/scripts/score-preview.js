import { resolve } from 'node:path';
import { scoreDataset } from '../src/dataset-scoring.js';

const args = process.argv.slice(2);
const directoryIndex = args.indexOf('--dir');
if (directoryIndex < 0 || !args[directoryIndex + 1]) throw new Error('Usage: node scripts/score-preview.js --dir <dataset-directory>');
const report = await scoreDataset(resolve(args[directoryIndex + 1]));
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
