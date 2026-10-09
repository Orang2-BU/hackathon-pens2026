import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSignalCandidate, classifyEntityMatch, classifySignal } from '../src/signals.js';

test('Noul thresholds route exact boundaries to write, review, and discard', () => {
  assert.equal(classifySignal({ type: 'noul', noul: 0.85 }), 'active');
  assert.equal(classifySignal({ type: 'noul', noul: 0.5 }), 'review');
  assert.equal(classifySignal({ type: 'noul', noul: 0.4999 }), 'discarded');
});

test('Score thresholds send uncertain labels to review before severity cutoff', () => {
  assert.equal(classifySignal({ type: 'score', score: 2, confidence: 0.8 }), 'active');
  assert.equal(classifySignal({ type: 'score', score: 3, confidence: 0.79 }), 'review');
  assert.equal(classifySignal({ type: 'score', score: 1.99, confidence: 0.9 }), 'discarded');
  assert.throws(() => classifySignal({ type: 'choice', choice: 'yes' }), /Choice and confidence/);
});

test('Choice sentiment writes only high-confidence negative as a candidate and reviews ambiguous output', () => {
  assert.equal(classifySignal({ type: 'choice', choice: 'negative', confidence: 0.8 }), 'active');
  assert.equal(classifySignal({ type: 'choice', choice: 'negative', confidence: 0.79 }), 'review');
  assert.equal(classifySignal({ type: 'choice', choice: 'neutral', confidence: 0.9 }), 'discarded');
});

test('signal candidate uses an exact UTF-16 source quote and stable provenance ID', () => {
  const sourceText = 'Note 🧾 says: call customer before renewal.';
  const start = sourceText.indexOf('call');
  const candidate = buildSignalCandidate({
    sourceText,
    chunk: { text: sourceText.slice(start), start, end: sourceText.length },
    sourceRecordId: 'I-1',
    sourceHash: 'a'.repeat(64),
    label: 'mentions_churn_intent',
    answer: { type: 'noul', noul: 0.91 },
    jevRunId: 'J-1',
    model: 'jev-1.13.0',
    rubricVersion: 'signals-v1',
  });
  assert.equal(candidate.quote, 'call customer before renewal.');
  assert.equal(sourceText.slice(candidate.spanStart, candidate.spanEnd), candidate.quote);
  assert.equal(candidate.status, 'active');
  assert.equal(candidate.id, buildSignalCandidate({
    sourceText,
    chunk: { text: sourceText.slice(start), start, end: sourceText.length },
    sourceRecordId: 'I-1', sourceHash: 'a'.repeat(64), label: 'mentions_churn_intent',
    answer: { type: 'noul', noul: 0.2 }, jevRunId: 'J-2', model: 'jev-1.13.0', rubricVersion: 'signals-v1',
  }).id);
  assert.throws(() => buildSignalCandidate({ sourceText, chunk: { text: 'invented quote', start, end: start + 14 }, sourceRecordId: 'I-1', sourceHash: 'a'.repeat(64), label: 'x', answer: { type: 'noul', noul: 0.9 }, jevRunId: 'J-1', model: 'jev', rubricVersion: 'v1' }), /exact source-text span/);
});

test('entity merge thresholds cannot override hard identifier conflicts', () => {
  assert.equal(classifyEntityMatch(0.95, false), 'merge');
  assert.equal(classifyEntityMatch(0.6, false), 'review');
  assert.equal(classifyEntityMatch(0.59, false), 'separate');
  assert.equal(classifyEntityMatch(0.999, true), 'blocked');
});
