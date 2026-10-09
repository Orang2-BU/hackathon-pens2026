import assert from 'node:assert/strict';
import { test } from 'node:test';
import { enrichInteraction, SIGNAL_QUESTIONS } from '../src/signal-enrichment.js';

function mockDatabase() {
  const state = { signals: new Map(), accountLookup: 0 };
  const database = async () => { state.accountLookup += 1; return [{ id: 'node:revision:r1:account:C01' }]; };
  database.begin = (callback) => {
    const tx = async (strings, ...values) => {
      const query = strings.join('?');
      assert.match(query, /INSERT INTO signals/u);
      const id = values[0];
      if (state.signals.has(id)) return [];
      state.signals.set(id, { id, revisionId: values[1], nodeId: values[2], runId: values[3], label: values[4],
        probability: values[5], quote: values[8], spanStart: values[9], spanEnd: values[10], status: 'review',
        sourceRecordId: values[11], sourceHash: values[12] });
      return [{ id }];
    };
    return callback(tx);
  };
  return { database, state };
}

test('Jev signals retain exact source spans and remain review-only until human approval', async () => {
  const { database, state } = mockDatabase();
  const text = 'Kami mempertimbangkan pindah ke KompetitorX karena layanan lambat.';
  const answers = Object.fromEntries(Object.keys(SIGNAL_QUESTIONS).map((name) => [name, { type: 'noul', noul: name === 'mentions_competitor' ? 0.97 : 0.02 }]));
  const jevClient = { async evaluate(input) {
    assert.equal(input.state.text, text);
    return { model: 'jev-test', runId: 'run-1', answers, usage: { input_tokens: 30, output_tokens: 5 }, metrics: { cached: false, latencyMs: 8, inputTokens: 30, outputTokens: 5 } };
  } };
  const record = { id: 'source:revision:r1:interactions.jsonl:r1', record_hash: 'a'.repeat(64), payload: { account_id: 'C01', isi: text, tanggal: '2026-09-01' } };
  const result = await enrichInteraction({ database, jevClient, revisionId: 'revision:r1', record });
  assert.equal(result.signalCount, 1);
  assert.equal(result.metrics.providerCalls, 1);
  const [signal] = state.signals.values();
  assert.equal(signal.label, 'mentions_competitor');
  assert.equal(signal.status, 'review');
  assert.equal(signal.quote, text);
  assert.equal(signal.spanStart, 0);
  assert.equal(signal.spanEnd, text.length);
  assert.equal(signal.nodeId, 'node:revision:r1:account:C01');
  assert.equal(signal.runId, 'run-1');
  assert.equal(signal.sourceRecordId, record.id);
  assert.equal(signal.sourceHash, record.record_hash);

  const repeated = await enrichInteraction({ database, jevClient, revisionId: 'revision:r1', record });
  assert.equal(repeated.signalCount, 0);
  assert.equal(state.signals.size, 1);
});

test('unlinked interactions do not call Jev', async () => {
  const { database } = mockDatabase();
  database.query = database;
  const notFound = async () => [];
  notFound.begin = database.begin;
  const result = await enrichInteraction({ database: notFound, jevClient: { evaluate() { throw new Error('must not call Jev'); } },
    revisionId: 'revision:r1', record: { id: 'r1', record_hash: 'b'.repeat(64), payload: { account_id: 'missing', isi: 'text' } } });
  assert.equal(result.status, 'unlinked');
});
