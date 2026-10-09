import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SCORING_EXPERIMENT } from '../src/scoring.js';
import { persistScoreReport } from '../src/score-repository.js';

function report() {
  const factorNames = Object.keys(SCORING_EXPERIMENT.weights);
  return {
    synthetic: true, datasetHash: 'a'.repeat(64), businessAsOf: '2026-10-01', formulaVersion: SCORING_EXPERIMENT.formulaVersion,
    customerCount: 40, experiment: SCORING_EXPERIMENT, sensitivity: { scenarios: [] }, qa: { c03InTopThree: true },
    ranking: Array.from({ length: 40 }, (_, index) => ({ accountId: `C${String(index + 1).padStart(2, '0')}`,
      score: 40, status: 'complete', coverage: 100, level: null, levelReason: 'Unapproved cutoff.', annualValue: 1000,
      weightedValue: 400, context: { renewalDate: null }, factors: Object.fromEntries(factorNames.map((name) => [name,
        { raw: { value: 1 }, normalized: 0.4, status: 'available', reason: null, coverage: 1, evidence: [{ file: 'fixture.csv', recordId: 'r1' }] }])) })),
  };
}

function mockDatabase() {
  const state = { runs: new Set(), factors: [], results: [], sql: [] };
  const database = { begin: (callback) => {
    const tx = (strings, ...values) => {
      if (typeof strings === 'string') return { identifier: strings };
      if (Array.isArray(strings) && strings.length && typeof strings[0] === 'object') return { rows: strings, columns: values[0] };
      return (async () => {
        const query = strings.join('?');
        state.sql.push(query);
        if (query.includes('FROM dataset_revisions')) return [{ id: `revision:${'a'.repeat(64)}` }];
        if (query.includes('FROM score_runs')) {
          const [id] = values;
          return state.runs.has(id) ? [{ id }] : [];
        }
        if (query.includes('FROM nodes')) return Array.from({ length: 40 }, (_, index) => ({
          id: `node:revision:r1:account:C${String(index + 1).padStart(2, '0')}`, external_key: `C${String(index + 1).padStart(2, '0')}`,
        }));
        if (query.includes('INSERT INTO score_runs')) { state.runs.add(values[0]); return []; }
        const batch = values.find((value) => value?.rows && value?.columns);
        if (batch?.columns.includes('factor')) { state.factors.push(...batch.rows); return []; }
        if (batch?.columns.includes('weighted_value_idr')) { state.results.push(...batch.rows); return []; }
        return [];
      })();
    };
    tx.json = (value) => value;
    tx.begin = async (fn) => fn(tx);
    return callback(tx);
  } };
  return { database, state };
}

test('score persistence writes one versioned run, 200 parameter rows, 40 results, and is idempotent', async () => {
  const { database, state } = mockDatabase();
  const input = { database, revisionId: `revision:${'a'.repeat(64)}`, report: report() };
  const first = await persistScoreReport(input);
  assert.equal(first.alreadyPersisted, false);
  assert.equal(first.customerCount, 40);
  assert.equal(first.factorCount, 200);
  assert.equal(state.factors.length, 200);
  assert.equal(state.results.length, 40);
  assert.ok(state.factors.every(({ score_run_id }) => score_run_id === first.scoreRunId));
  assert.ok(state.factors.some(({ factor, period_start, period_end }) => factor === 'usage' && period_start === '2026-04-04' && period_end === '2026-10-01'));
  const repeated = await persistScoreReport(input);
  assert.equal(repeated.scoreRunId, first.scoreRunId);
  assert.equal(repeated.alreadyPersisted, true);
  assert.equal(state.factors.length, 200);
});

test('score persistence refuses incomplete reports before database access', async () => {
  let touched = false;
  const database = { begin() { touched = true; throw new Error('must not begin'); } };
  const invalid = report();
  invalid.customerCount = 39;
  await assert.rejects(persistScoreReport({ database, revisionId: `revision:${'a'.repeat(64)}`, report: invalid }), /40-customer/u);
  assert.equal(touched, false);
});
