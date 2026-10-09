import assert from 'node:assert/strict';
import { test } from 'node:test';
import postgres from 'postgres';
import { createPostgresReadService } from '../src/read-repository.js';
import { createWorkspaceService } from '../src/workspace.js';

const url = process.env.TEST_DATABASE_URL;
if (!url || !/^postgres:\/\/[^/]+\/tessera_test_[a-z_]+$/u.test(url)) throw new Error('An explicitly disposable tessera_test_* database with published KasirNusa data is required.');

test('published KasirNusa workspace retains 40 accounts and the sourced C01/C03/C05/C04 paths', async () => {
  const database = postgres(url, { max: 1 });
  try {
    await database`SET ROLE tessera_runtime`;
    const read = createPostgresReadService(database);
    const workspace = createWorkspaceService(database, read);
    const accounts = await read.listAccounts();
    assert.equal(accounts.items.length, 40);
    assert(accounts.items.slice(0, 3).some(a => a.id === 'C03'));
    assert(accounts.items.every(a => a.priority.formulaVersion === 'risk-heuristic-v2'));
    const c04 = await read.getAccount('C04');
    assert.equal(c04.renewalDate, '2026-11-05');
    const c01 = await workspace.getEvidence('C01', 3);
    assert(c01.nodes.some(n => n.key === 'K017'));
    assert(c01.nodes.some(n => n.key === 'P01'));
    assert(c01.nodes.some(n => n.key === 'FEAT-07'));
    for (const id of ['C03', 'C05']) {
      const graph = await workspace.getEvidence(id, 3);
      assert(graph.nodes.some(n => n.key === 'BUG-412'), `${id} must retain its multi-hop bug candidate`);
      assert(graph.edges.some(e => e.type === 'bug_candidate' && e.relationKind === 'derived' && e.status === 'review'));
      assert(graph.nodes.length <= 60);
      const recommendation = await workspace.recommendation(id);
      assert(recommendation.sourceGroups.length >= 3);
      assert(recommendation.draft);
      for (const citation of graph.citations.filter(c => c.quote)) {
        const [source] = await database`SELECT payload FROM source_records WHERE id=${citation.id}`;
        assert.equal(source.payload[citation.field].slice(citation.span.start, citation.span.end), citation.quote);
      }
    }
  } finally { await database.end({ timeout: 5 }); }
});
