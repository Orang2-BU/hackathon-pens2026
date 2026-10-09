import { resolve } from 'node:path';
import { DATASET_SCHEMA, inspectDataset, readDatasetRows } from '../src/dataset.js';
import { compileGraphRows, GRAPH_SOURCE_FILES } from '../src/graph-compiler.js';

const args = process.argv.slice(2);
const dirIndex = args.indexOf('--dir');
if (dirIndex < 0 || !args[dirIndex + 1] || args.filter((arg) => arg === '--dir').length !== 1) {
  throw new Error('Usage: node scripts/graph-preview.js --dir <dataset-directory>');
}

const directory = resolve(args[dirIndex + 1]);
const validation = await inspectDataset(directory);
if (validation.issueCount > 0 || validation.orphanCount > 0 || validation.files.length !== Object.keys(DATASET_SCHEMA).length) {
  throw new Error('Dataset validation failed; graph preview stopped.');
}
const revisionId = `revision:${validation.datasetHash}`;
const records = new Map();
const sourceRows = new Map();
const candidateUsageKeys = new Set();

for await (const row of readDatasetRows(directory, 'support_tickets.csv')) {
  if (row.versi_aplikasi === '4.12' && row.dibuat && row.outlet_id) candidateUsageKeys.add(`${row.dibuat}:${row.outlet_id}`);
}

for (const fileName of GRAPH_SOURCE_FILES) {
  const fileRows = [];
  const sourceId = `source:${revisionId}:${fileName}`;
  let recordNumber = 0;
  for await (const row of readDatasetRows(directory, fileName)) {
    recordNumber += 1;
    const recordId = `${sourceId}:r${recordNumber}`;
    fileRows.push({ recordId, row });
    sourceRows.set(recordId, { fileName, row });
  }
  records.set(fileName, fileRows);
}

const usageByDateOutlet = new Map();
let recordNumber = 0;
for await (const row of readDatasetRows(directory, 'product_usage_daily.csv')) {
  recordNumber += 1;
  const key = `${row.tanggal}:${row.outlet_id}`;
  if (!candidateUsageKeys.has(key)) continue;
  const sourceRecordId = `source:${revisionId}:product_usage_daily.csv:r${recordNumber}`;
  usageByDateOutlet.set(key, { sourceRecordId, payload: row });
}

const graph = compileGraphRows({ revisionId, records, usageByDateOutlet });
const candidates = graph.edges.filter(({ edge }) => edge.relation_kind === 'derived').map(({ edge, sources }) => {
  const ticket = sourceRows.get(sources[0].source_record_id)?.row;
  return { ticketId: ticket?.ticket_id ?? null, accountId: ticket?.account_id ?? null,
    bugId: edge.target_node_id.split(':').at(-1), status: edge.status, sourceFileCount: new Set(sources.map(({ source_record_id }) => sourceRows.get(source_record_id)?.fileName ?? 'product_usage_daily.csv')).size };
});

process.stdout.write(`${JSON.stringify({ synthetic: true, revisionId, sourceFileCount: graph.sourceFileCount,
  hardEdgeCount: graph.edges.filter(({ edge }) => edge.relation_kind === 'hard').length,
  derivedReviewCount: candidates.length, candidates, factCount: graph.facts.length }, null, 2)}\n`);
