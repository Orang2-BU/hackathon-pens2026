import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPostgresReadService } from '../src/read-repository.js';

test('read repository returns explicit synthetic account DTO and sourced evidence without leaking raw payloads', async () => {
  const calls = [];
  const database = async (strings) => {
    const query = strings.join('?');
    calls.push(query);
    if (query.includes('FROM nodes n JOIN dataset_revisions')) return [{ id: 'node:revision:r1:account:C01', dataset_revision_id: 'revision:r1', external_key: 'C01', properties: { nama: 'Kopi Satu', nps_terakhir: '', health_score_dashboard: 'Hijau' }, annual_value_idr: '149940000', renewal_date: '2026-12-15' }];
    if (query.includes('FROM account_factors')) return [{ factor: 'usage', raw_value: { decline: 0.2 }, normalized_value: '0.2', unit: 'ratio', status: 'available', reason: null, period_start: '2026-04-01', period_end: '2026-10-01', evidence: ['source:r1'] }];
    if (query.includes('FROM plans p JOIN plan_revisions')) return [{ plan_id: 'p1', revision_id: 'r1', revision: 1, body: 'Call customer', revision_actor: 'demo-admin', revision_context: { synthetic: true }, evidence_hash: 'b'.repeat(64), revision_created_at: 'now', decision_id: 'd1', outcome: 'approved', decision_reason: 'Reviewed', decision_actor: 'demo-admin', decision_context: { outreachSent: false }, decision_created_at: 'later' }];
    if (query.includes('FROM edges e')) return [{ edge_id: 'edge:r1', type: 'account_owner', relation_kind: 'hard', reason: null, status: 'active', valid_from: null, valid_to: null,
      source_node_id: 'node:employee:E01', source_type: 'employee', source_key: 'E01', target_node_id: 'node:account:C01', target_type: 'account', target_key: 'C01',
      source_record_id: 'source:r1', record_hash: 'a'.repeat(64), occurred_at: null, file_name: 'crm_accounts.csv', synthetic: true }];
    throw new Error(`Unexpected query: ${query}`);
  };
  const account = await createPostgresReadService(database).getAccount('C01');
  assert.equal(account.name, 'Kopi Satu');
  assert.equal(account.priority.status, 'unscored');
  assert.equal(account.nps, null);
  assert.equal(account.annualValueIdr, 149940000);
  assert.equal(account.renewalDate, '2026-12-15');
  assert.equal(account.dashboardHealth, 'Hijau');
  assert.equal(account.parameters[0].normalizedValue, '0.2');
  assert.equal(account.evidence[0].sourceRecordIds[0], 'source:r1');
  assert.equal(account.citations[0].synthetic, true);
  assert.equal(account.plans[0].revision.body, 'Call customer');
  assert.equal(account.plans[0].decision.outreachSent, false);
  assert.equal(Object.hasOwn(account, 'raw'), false);
  assert.ok(calls.every((query) => query.includes('?')));
});

test('read repository returns null for an unknown account and abstains when the router is not available', async () => {
  const database = async (strings) => strings.join('?').includes('FROM nodes n JOIN dataset_revisions') ? [] : [];
  const service = createPostgresReadService(database);
  assert.equal(await service.getAccount('unknown'), null);
  assert.equal((await service.answerGraphQuestion('question')).status, 'abstained');
});

test('account ranking endpoint lists only the 40 customer accounts, not graph-only prospects', async () => {
  let accountQuery = '';
  const database = async (strings) => {
    const query = strings.join('?');
    if (query.includes('FROM dataset_revisions')) return [{ id: 'revision:r1' }];
    accountQuery = query;
    return Array.from({ length: 40 }, (_, index) => ({ id: `node:${index}`, dataset_revision_id: 'revision:r1',
      external_key: `C${String(index + 1).padStart(2, '0')}`, properties: { nama: `Customer ${index + 1}`, tipe: 'pelanggan' },
      annual_value_idr: null, renewal_date: null, priority_score: 40 - index, priority_status: 'complete',
      priority_coverage: '100', formula_version: 'risk-heuristic-v1', score_run_id: 'score-run:1',
      weighted_value_idr: String((40 - index) * 1000) }));
  };
  const result = await createPostgresReadService(database).listAccounts({ sort: 'priority' });
  assert.equal(result.items.length, 40);
  assert.ok(result.items.every((account) => account.type === 'customer'));
  assert.equal(result.items[0].id, 'C01');
  assert.equal(result.items[0].priority.score, 40);
  assert.equal(result.items[0].priority.formulaVersion, 'risk-heuristic-v1');
  assert.equal(result.items[0].weightedValueIdr, 40000);
  assert.match(accountQuery, /n\.properties->>'tipe' = 'pelanggan'/u);
  assert.match(accountQuery, /score_run_results/u);
});
