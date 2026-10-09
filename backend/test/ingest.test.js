import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSourceRecord, datasetNodeId } from '../src/ingest.js';

test('source records and entity nodes have stable IDs, hashes, and explicit snapshot status', () => {
  const input = { revisionId: 'revision:abc', sourceId: 'source:revision:abc:crm_accounts.csv', fileName: 'crm_accounts.csv', recordNumber: 1,
    row: { account_id: 'C01', nama: 'Kopi Contoh', tipe: 'pelanggan' } };
  const first = createSourceRecord(input);
  const second = createSourceRecord(input);
  assert.equal(first.sourceRecord.id, 'source:revision:abc:crm_accounts.csv:r1');
  assert.equal(first.sourceRecord.external_id, 'C01');
  assert.equal(first.sourceRecord.record_hash.length, 64);
  assert.equal(first.sourceRecord.record_hash, second.sourceRecord.record_hash);
  assert.equal(first.node.id, datasetNodeId('revision:abc', 'account', 'C01'));
  assert.notEqual(first.node.id, datasetNodeId('revision:def', 'account', 'C01'));
  assert.equal(first.node.temporal_status, 'snapshot_only');
  assert.equal(first.usage, null);
});

test('usage rows preserve nullable transaction values and reference the outlet node', () => {
  const result = createSourceRecord({ revisionId: 'revision:abc', sourceId: 'source:usage', fileName: 'product_usage_daily.csv', recordNumber: 9,
    row: { tanggal: '2026-09-30', outlet_id: 'C01-O01', account_id: 'C01', versi_aplikasi: '4.12', jumlah_transaksi: '', transaksi_offline_tersinkron: '3' } });
  assert.equal(result.node, null);
  assert.equal(result.usage.date, '2026-09-30');
  assert.equal(result.usage.outlet_id, 'node:revision:abc:outlet:C01-O01');
  assert.equal(result.usage.transactions, null);
  assert.equal(result.usage.gross_sales_idr, null);
  assert.equal(result.usage.source_record_id, result.sourceRecord.id);
});

test('ingest transformation refuses a source filename outside the allowlist', () => {
  assert.throws(() => createSourceRecord({ revisionId: 'r', sourceId: 's', fileName: 'arbitrary.csv', recordNumber: 1, row: {} }), /not allowlisted/u);
});
