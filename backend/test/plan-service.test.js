import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPlanContext, createPlanService } from '../src/plan-service.js';

function fakeDatabase({ account = { id: 'node:revision:r1:account:C01', external_key: 'C01', dataset_revision_id: 'revision:r1', score_run_id: 'score-run:r2', formula_version: 'risk-v2' }, evidence = [] } = {}) {
  const state = { plan: null, revision: null, queries: [] };
  const database = async (strings) => {
    const query = strings.join('?');
    state.queries.push(query);
    if (query.includes('FROM nodes n JOIN dataset_revisions')) return account ? [account] : [];
    if (query.includes('FROM edges e JOIN edge_sources')) return evidence;
    if (query.includes('FROM account_factors af')) return [{ item_type: 'factor', source_record_id: null, record_hash: null,
      detail: { factor: 'usage', normalizedValue: 0.4, evidence: ['source:r2'] } }];
    throw new Error(`Unexpected query: ${query}`);
  };
  database.begin = (callback) => {
    const tx = async (strings, ...values) => {
    const query = strings.join('?');
    state.queries.push(query);
    if (query.includes('SELECT id FROM nodes')) return account ? [{ id: account.id }] : [];
    if (query.includes('INSERT INTO plans')) { state.plan = { id: values[0], accountNodeId: values[1] }; return []; }
    if (query.includes('INSERT INTO plan_revisions')) {
      state.revision = { id: values[0], plan_id: values[1], revision: 1, body: values[2], actor_id: values[3], context: values[4], evidence_hash: values[5], created_at: 'now' };
      return [state.revision];
    }
    throw new Error(`Unexpected transaction query: ${query}`);
    };
    tx.json = (value) => value;
    return callback(tx);
  };
  return { database, state };
}

test('server plan context pins published revision, formula and synthetic marker', () => {
  assert.deepEqual(createPlanContext({ datasetRevision: 'revision:r1', formulaVersion: 'risk-v2' }), {
    businessAsOf: '2026-10-01', datasetRevision: 'revision:r1', graphRevision: 'graph-v1:revision:r1', formulaVersion: 'risk-v2', synthetic: true,
  });
  assert.throws(() => createPlanContext({ datasetRevision: 'bad' }), /published dataset revision/u);
});

test('plan service derives context and evidence hash server-side before atomic plan creation', async () => {
  const { database, state } = fakeDatabase({ evidence: [{ item_type: 'source', source_record_id: 'source:r1', record_hash: 'a'.repeat(64), detail: null }] });
  const result = await createPlanService(database).createPlan({ accountNodeId: 'C01', body: 'Inspect sync issue', actorId: 'demo-admin' });
  assert.equal(state.plan.accountNodeId, 'node:revision:r1:account:C01');
  assert.equal(result.revision.context.datasetRevision, 'revision:r1');
  assert.equal(result.revision.context.formulaVersion, 'risk-v2');
  assert.equal(result.revision.context.synthetic, true);
  assert.match(result.revision.evidenceHash, /^[0-9a-f]{64}$/u);
  assert.equal(result.revision.actorId, 'demo-admin');
  assert.ok(state.queries.some((query) => query.includes('af.score_run_id = ?')));
  assert.match(state.queries.find((query) => query.includes('FROM nodes n JOIN dataset_revisions')), /LEFT JOIN LATERAL/u);
});

test('plan service rejects accounts outside a published dataset', async () => {
  const { database } = fakeDatabase({ account: null });
  await assert.rejects(createPlanService(database).createPlan({ accountNodeId: 'C01', body: 'Draft', actorId: 'demo-admin' }), { code: 'NOT_FOUND' });
});
