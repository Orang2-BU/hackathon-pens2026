import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findEvidencePaths, hasSourceGroupCoverage } from '../src/graph.js';

const nodes = [
  { id: 'C05', type: 'account' },
  { id: 'O5', type: 'outlet' },
  { id: 'T5', type: 'ticket' },
  { id: 'B412', type: 'bug' },
  { id: 'B415', type: 'bug' },
];
const edges = [
  { id: 'E1', sourceNodeId: 'C05', targetNodeId: 'O5', relationKind: 'hard', status: 'active', sourceRecordIds: ['crm-1'] },
  { id: 'E2', sourceNodeId: 'O5', targetNodeId: 'T5', relationKind: 'hard', status: 'active', sourceRecordIds: ['support-1'] },
  { id: 'E3', sourceNodeId: 'T5', targetNodeId: 'B412', relationKind: 'derived', reason: 'Ticket text and affected version match.', status: 'active', validFrom: '2026-01-01', sourceRecordIds: ['ticket-1', 'bug-1'] },
  { id: 'E4', sourceNodeId: 'T5', targetNodeId: 'B415', relationKind: 'derived', reason: 'Future evidence.', status: 'active', validFrom: '2026-10-01', sourceRecordIds: ['ticket-1', 'bug-2'] },
  { id: 'E5', sourceNodeId: 'C05', targetNodeId: 'B415', relationKind: 'hard', status: 'rejected', sourceRecordIds: ['crm-1'] },
];

test('graph traversal returns bounded, sourced paths at the requested business date', () => {
  const paths = findEvidencePaths({ nodes, edges, startId: 'C05', targetType: 'bug', businessAsOf: '2026-09-30' });
  assert.equal(paths.length, 1);
  assert.deepEqual(paths[0].nodes.map(({ id }) => id), ['C05', 'O5', 'T5', 'B412']);
  assert.deepEqual(paths[0].edges.map(({ relationKind }) => relationKind), ['hard', 'hard', 'derived']);
  assert.equal(paths[0].edges.at(-1).reason, 'Ticket text and affected version match.');
  assert.equal(hasSourceGroupCoverage(paths[0], { 'crm-1': 'crm', 'support-1': 'support', 'ticket-1': 'support', 'bug-1': 'product' }), true);
});

test('graph traversal supports reverse hops and enforces depth/cycle bounds', () => {
  const reverse = findEvidencePaths({ nodes, edges, startId: 'B412', targetType: 'account', businessAsOf: '2026-09-30' });
  assert.deepEqual(reverse[0].nodes.map(({ id }) => id), ['B412', 'T5', 'O5', 'C05']);
  assert.equal(reverse[0].edges[0].direction, 'reverse');
  assert.throws(() => findEvidencePaths({ nodes, edges, startId: 'C05', targetType: 'bug', businessAsOf: '2026-09-30', maxDepth: 5 }), /between 1 and 4/);
});

test('derived edges without explanation and edges without sources fail closed', () => {
  assert.throws(() => findEvidencePaths({ nodes, edges: [{ ...edges[2], reason: '' }], startId: 'C05', targetType: 'bug', businessAsOf: '2026-09-30' }), /require an explanation/);
  assert.throws(() => findEvidencePaths({ nodes, edges: [{ ...edges[0], sourceRecordIds: [] }], startId: 'C05', targetType: 'outlet', businessAsOf: '2026-09-30' }), /require at least one source/);
});
