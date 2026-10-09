import { createHash, randomUUID } from 'node:crypto';
import { DATASET_SCHEMA, inspectDataset, readDatasetRows } from './dataset.js';

const ENTITY_TYPES = Object.freeze({
  'crm_accounts.csv': 'account',
  'crm_contacts.csv': 'contact',
  'employees.csv': 'employee',
  'outlets.csv': 'outlet',
  'bugs.csv': 'bug',
  'features.csv': 'feature',
  'crm_deals.csv': 'deal',
  'decision_log.csv': 'decision',
  'interactions.jsonl': 'interaction',
  'releases.csv': 'release',
  'contracts_billing.csv': 'contract',
  'support_tickets.csv': 'ticket',
});

const INSERT_COLUMNS = Object.freeze(['id', 'source_id', 'external_id', 'record_number', 'record_hash', 'occurred_at', 'payload']);
const NODE_COLUMNS = Object.freeze(['id', 'dataset_revision_id', 'type', 'external_key', 'properties', 'temporal_status']);
const USAGE_COLUMNS = Object.freeze(['dataset_revision_id', 'date', 'outlet_id', 'transactions', 'gross_sales_idr', 'source_record_id']);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function hashRow(row) {
  return createHash('sha256').update(JSON.stringify(canonical(row))).digest('hex');
}

function sourceIdFor(revisionId, fileName) {
  return `source:${revisionId}:${fileName}`;
}

export function datasetNodeId(revisionId, type, externalKey) {
  if (!revisionId || !type || !externalKey) throw new TypeError('Revision, node type and external key are required.');
  return `node:${revisionId}:${type}:${externalKey}`;
}

function occurredAt(row, schema) {
  for (const column of schema.dates ?? []) {
    if (row[column]) return `${row[column]}T00:00:00.000Z`;
  }
  return null;
}

export function createSourceRecord({ revisionId, sourceId, fileName, recordNumber, row }) {
  const schema = DATASET_SCHEMA[fileName];
  if (!schema) throw new Error(`Dataset file is not allowlisted: ${fileName}`);
  const externalId = schema.id ? row[schema.id] || null : null;
  const id = `${sourceId}:r${recordNumber}`;
  return {
    sourceRecord: {
      id,
      source_id: sourceId,
      external_id: externalId,
      record_number: recordNumber,
      record_hash: hashRow(row),
      occurred_at: occurredAt(row, schema),
      payload: row,
    },
    node: schema.id && ENTITY_TYPES[fileName] ? {
      id: datasetNodeId(revisionId, ENTITY_TYPES[fileName], externalId),
      dataset_revision_id: revisionId,
      type: ENTITY_TYPES[fileName],
      external_key: externalId,
      properties: row,
      temporal_status: (schema.dates ?? []).some((column) => Boolean(row[column])) ? 'known' : 'snapshot_only',
    } : null,
    usage: fileName === 'product_usage_daily.csv' ? {
      dataset_revision_id: revisionId,
      date: row.tanggal,
      outlet_id: datasetNodeId(revisionId, 'outlet', row.outlet_id),
      transactions: row.jumlah_transaksi === '' ? null : Number(row.jumlah_transaksi),
      gross_sales_idr: null,
      source_record_id: id,
    } : null,
  };
}

async function insertBatch(tx, table, columns, rows) {
  if (rows.length === 0) return;
  const jsonColumn = table === 'source_records' ? 'payload' : table === 'nodes' ? 'properties' : null;
  const values = jsonColumn ? rows.map(row => ({ ...row, [jsonColumn]: tx.json(row[jsonColumn]) })) : rows;
  await tx`INSERT INTO ${tx(table)} ${tx(values, columns)}`;
}

async function ingestTransaction(tx, { directory, report, batchSize, revisionId }) {
  await tx`SET LOCAL ROLE tessera_migrator`;
  await tx`SELECT pg_advisory_xact_lock(hashtextextended(${revisionId}, 0))`;
  const [existing] = await tx`SELECT id, status FROM dataset_revisions WHERE id = ${revisionId} FOR UPDATE`;
  if (existing?.status === 'published') return { revisionId, alreadyPublished: true, rowCounts: Object.fromEntries(report.files.map(({ file, records }) => [file, records])) };
  if (existing) {
    await tx`UPDATE dataset_revisions SET status = 'staging', published_at = NULL WHERE id = ${revisionId}`;
  } else {
    await tx`INSERT INTO dataset_revisions (id, source_hash, status) VALUES (${revisionId}, ${report.datasetHash}, 'staging')`;
  }

  const runId = randomUUID();
  await tx`INSERT INTO ingest_runs (id, dataset_revision_id, status, report) VALUES (${runId}, ${revisionId}, 'running', ${tx.json({ datasetHash: report.datasetHash })})`;
  const rowCounts = {};

  for (const file of report.files) {
    const fileName = file.file;
    const sourceId = sourceIdFor(revisionId, fileName);
    await tx`INSERT INTO sources (id, dataset_revision_id, file_name, sha256, row_count, synthetic)
      VALUES (${sourceId}, ${revisionId}, ${fileName}, ${file.sha256}, ${file.records}, true)`;
    const sourceRecords = [];
    const nodes = [];
    const usageRows = [];
    let recordNumber = 0;

    for await (const row of readDatasetRows(directory, fileName)) {
      recordNumber += 1;
      const transformed = createSourceRecord({ revisionId, sourceId, fileName, recordNumber, row });
      sourceRecords.push(transformed.sourceRecord);
      if (transformed.node) nodes.push(transformed.node);
      if (transformed.usage) usageRows.push(transformed.usage);
      if (sourceRecords.length >= batchSize) {
        await insertBatch(tx, 'source_records', INSERT_COLUMNS, sourceRecords.splice(0));
        if (nodes.length) await insertBatch(tx, 'nodes', NODE_COLUMNS, nodes.splice(0));
        if (usageRows.length) await insertBatch(tx, 'usage_daily', USAGE_COLUMNS, usageRows.splice(0));
      }
    }
    await insertBatch(tx, 'source_records', INSERT_COLUMNS, sourceRecords);
    await insertBatch(tx, 'nodes', NODE_COLUMNS, nodes);
    await insertBatch(tx, 'usage_daily', USAGE_COLUMNS, usageRows);
    if (recordNumber !== file.records) throw new Error(`Row count changed while ingesting ${fileName}.`);
    rowCounts[fileName] = recordNumber;
  }

  const publishedReport = { datasetHash: report.datasetHash, rowCounts, issueCount: 0, orphanCount: 0, synthetic: true };
  await tx`UPDATE ingest_runs SET status = 'published', finished_at = now(), report = ${tx.json(publishedReport)} WHERE id = ${runId}`;
  await tx`UPDATE dataset_revisions SET status = 'published', published_at = now() WHERE id = ${revisionId}`;
  return { revisionId, alreadyPublished: false, rowCounts, datasetHash: report.datasetHash, synthetic: true };
}

export async function ingestDataset({ database, directory, batchSize = 500 }) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5000) throw new RangeError('batchSize must be between 1 and 5000.');
  const report = await inspectDataset(directory);
  if (report.issueCount > 0 || report.orphanCount > 0 || report.files.length !== Object.keys(DATASET_SCHEMA).length) {
    const error = new Error('Dataset validation failed; nothing was published.');
    error.code = 'DATASET_INVALID';
    error.report = report;
    throw error;
  }
  const revisionId = `revision:${report.datasetHash}`;
  try {
    return await database.begin((tx) => ingestTransaction(tx, { directory, report, batchSize, revisionId }));
  } catch (error) {
    try {
      await database.begin(async (tx) => {
        await tx`SET LOCAL ROLE tessera_migrator`;
        await tx`INSERT INTO dataset_revisions (id, source_hash, status)
          VALUES (${revisionId}, ${report.datasetHash}, 'failed')
          ON CONFLICT (id) DO UPDATE SET status = 'failed', published_at = NULL
          WHERE dataset_revisions.status <> 'published'`;
        await tx`INSERT INTO ingest_runs (id, dataset_revision_id, status, finished_at, report)
          VALUES (${randomUUID()}, ${revisionId}, 'failed', now(), ${tx.json({ code: 'INGEST_FAILED' })})`;
      });
    } catch { /* Preserve the original ingest error if recording the failure also fails. */ }
    throw error;
  }
}
