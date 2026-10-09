import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSignalReviewService, reviewSignal, SignalReviewError } from '../src/signal-review.js';

function databaseWithReviewCandidate() {
  const state = { signal: { id: 'ab'.repeat(32), status: 'review' }, reviews: [] };
  const db = { begin: (callback) => callback(async (strings, ...values) => {
    const query = strings.join('?');
    if (query.includes('FROM signal_reviews') && query.includes('payload_hash')) {
      return state.reviews.filter((row) => row.actor_id === values[0] && row.idempotency_key === values[1]);
    }
    if (query.includes('FROM signals')) return state.signal.id === values[0] ? [state.signal] : [];
    if (query.includes('INSERT INTO signal_reviews')) {
      const [id, signal_id, actor_id, decision, reason, idempotency_key, payload_hash] = values;
      const row = { id, signal_id, actor_id, decision, reason, idempotency_key, payload_hash, created_at: 'now' };
      if (!state.reviews.some((item) => item.actor_id === actor_id && item.idempotency_key === idempotency_key)) state.reviews.push(row);
      return [];
    }
    if (query.includes('UPDATE signals')) { state.signal.status = values[0]; return []; }
    throw new Error(`Unexpected query: ${query}`);
  }) };
  return { db, state };
}

test('review decision is append-only, status-gated, and idempotent', async () => {
  const { db, state } = databaseWithReviewCandidate();
  const input = { database: db, signalId: state.signal.id, actorId: 'admin-1', idempotencyKey: 'review-1', decision: 'accepted', reason: 'Quote verified' };
  const first = await reviewSignal(input);
  const repeated = await reviewSignal(input);
  assert.equal(first.id, repeated.id);
  assert.equal(state.reviews.length, 1);
  assert.equal(state.signal.status, 'active');
  await assert.rejects(reviewSignal({ ...input, idempotencyKey: 'review-2' }), (error) => error instanceof SignalReviewError && error.code === 'CONFLICT');
  await assert.rejects(reviewSignal({ ...input, decision: 'rejected' }), (error) => error instanceof SignalReviewError && error.code === 'CONFLICT');
});

test('review validates decision, key, and reason before database access', async () => {
  const database = { begin() { throw new Error('database must not be touched'); } };
  const base = { database, signalId: 'signal-1', actorId: 'admin-1', idempotencyKey: 'key-1', decision: 'accepted' };
  await assert.rejects(reviewSignal({ ...base, decision: 'pending' }), /accepted or rejected/u);
  await assert.rejects(reviewSignal({ ...base, idempotencyKey: '' }), /idempotencyKey/u);
  await assert.rejects(reviewSignal({ ...base, reason: ' '.repeat(3) }), /Reason/u);
});

test('review queue projects source citation and original Jev output without exposing raw run state', async () => {
  const database = async () => [{ id: 'signal-1', dataset_revision_id: 'revision:r1', node_id: 'node:r1:account:C01', jev_run_id: 'run-1',
    label: 'mentions_competitor', score: null, confidence: null, probability: '0.91', quote: 'KompetitorX', span_start: 10, span_end: 21,
    source_record_id: 'source:r1', source_hash: 'a'.repeat(64), source_field: 'isi', occurred_at: '2026-09-01', file_name: 'interactions.jsonl', synthetic: true,
    model: 'jev-1', rubric_version: 'rubric-v1', provider_output: { type: 'noul', noul: 0.91 } }];
  const result = await createSignalReviewService(database).listSignalReviews();
  assert.deepEqual(result.items[0].source, { recordId: 'source:r1', recordHash: 'a'.repeat(64), field: 'isi', file: 'interactions.jsonl', occurredAt: '2026-09-01', synthetic: true });
  assert.deepEqual(result.items[0].provider, { model: 'jev-1', rubricVersion: 'rubric-v1', output: { type: 'noul', noul: 0.91 } });
  assert.equal(Object.hasOwn(result.items[0], 'response'), false);
});
