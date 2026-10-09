import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPostgresReadService } from '../src/read-repository.js';

test('read repository returns explicit synthetic account DTO and sourced evidence without leaking raw payloads', async () => {
  const calls = [];
  const database = async (strings) => {
    const query = strings.join('?');
    calls.push(query);
    if (query.includes('FROM nodes n JOIN dataset_revisions')) return [{ id: 'node:revision:r1:account:C01', dataset_revision_id: 'revision:r1', external_key: 'C01', properties: { nama: 'Kopi Satu', nps: '' } }];
    if (query.includes('FROM account_factors')) return [{ factor: 'usage', raw_value: { decline: 0.2 }, normalized_value: '0.2', unit: 'ratio', status: 'available', reason: null, period_start: '2026-04-01', period_end: '2026-10-01', evidence: ['source:r1'] }];
    if (query.includes('FROM edges e')) return [{ edge_id: 'edge:r1', type: 'account_owner', relation_kind: 'hard', reason: null, status: 'active', valid_from: null, valid_to: null,
      source_node_id: 'node:employee:E01', source_type: 'employee', source_key: 'E01', target_node_id: 'node:account:C01', target_type: 'account', target_key: 'C01',
      source_record_id: 'source:r1', record_hash: 'a'.repeat(64), occurred_at: null, file_name: 'crm_accounts.csv', synthetic: true }];
    throw new Error(`Unexpected query: ${query}`);
  };
  const account = await createPostgresReadService(database).getAccount('C01');
  assert.equal(account.name, 'Kopi Satu');
  assert.equal(account.priority.status, 'unscored');
  assert.equal(account.nps, null);
  assert.equal(account.parameters[0].normalizedValue, '0.2');
  assert.equal(account.evidence[0].sourceRecordIds[0], 'source:r1');
  assert.equal(account.citations[0].synthetic, true);
  assert.equal(Object.hasOwn(account, 'raw'), false);
  assert.ok(calls.every((query) => query.includes('?')));
});

test('read repository returns null for an unknown account and abstains when the router is not available', async () => {
  const database = async (strings) => strings.join('?').includes('FROM nodes n JOIN dataset_revisions') ? [] : [];
  const service = createPostgresReadService(database);
  assert.equal(await service.getAccount('unknown'), null);
  assert.equal((await service.answerGraphQuestion('question')).status, 'abstained');
});
