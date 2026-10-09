import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../src/server.js';
import { buildIntentQuestions, createGraphAnswer, INTENT_CATALOG, resolveEntity, selectIntent } from '../src/intents.js';

test('intent router applies exact threshold and gap and emits Jev-compatible questions', () => {
  const questions = buildIntentQuestions();
  assert.equal(Object.keys(questions).length, 10);
  assert.ok(Object.values(questions).every(({ type }) => type === 'noul'));
  const answers = Object.fromEntries(INTENT_CATALOG.map(({ id }) => [id, { type: 'noul', noul: id === 'upcoming_renewal' ? 0.8 : 0.1 }]));
  assert.deepEqual(selectIntent(answers), { status: 'answered', intent: 'upcoming_renewal', confidence: 0.8 });
  answers.open_support_tickets = { type: 'noul', noul: 0.7 };
  assert.equal(selectIntent(answers).status, 'abstained');
});

test('entity resolution abstains on ambiguous names and answer package fails closed without citations', () => {
  const entities = [{ id: 'C01', name: 'Nusa' }, { id: 'C02', name: 'Nusa Retail' }];
  assert.equal(resolveEntity('Tell me about unknown', entities).status, 'missing');
  assert.equal(resolveEntity('Nusa', entities).status, 'ambiguous');
  assert.equal(resolveEntity('C01', entities).entity.id, 'C01');
  const context = { question: 'renewal?', businessAsOf: '2026-10-01', graphRevision: 'rev1', intent: { status: 'answered', intent: 'upcoming_renewal' } };
  const empty = createGraphAnswer({ ...context, evidence: { facts: [{ value: 'Nov 5' }], citations: [] } });
  assert.equal(empty.status, 'abstained');
  const answered = createGraphAnswer({ ...context, evidence: { facts: [{ value: 'Nov 5' }], citations: [{ source: 'contracts.csv', recordId: 'K-C04' }] } });
  assert.equal(answered.status, 'answered');
});

test('read routes validate parameters, bound questions, and return unavailable when no repository exists', async () => {
  const server = createHttpServer({ database: async () => [] });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(`${origin}/api/accounts?sort=sql`)).status, 400);
    assert.equal((await fetch(`${origin}/api/accounts`)).status, 503);
    const invalid = await fetch(`${origin}/api/accounts/%2Fetc`, { method: 'GET' });
    assert.equal(invalid.status, 400);
    const unavailable = await fetch(`${origin}/api/graph/answer`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'When is renewal?' }) });
    assert.equal(unavailable.status, 503);
    const serverWithRepository = createHttpServer({ database: async () => [], readService: {
      listAccounts: async ({ sort }) => ({ items: [], sort }),
      getAccount: async (id) => id === 'C01' ? { id } : null,
      answerGraphQuestion: async () => ({ status: 'abstained', text: 'Insufficient evidence.' }),
    } });
    await new Promise((resolve) => serverWithRepository.listen(0, '127.0.0.1', resolve));
    try {
      const account = await fetch(`http://127.0.0.1:${serverWithRepository.address().port}/api/accounts/C01`);
      assert.deepEqual(await account.json(), { id: 'C01' });
      const answer = await fetch(`http://127.0.0.1:${serverWithRepository.address().port}/api/graph/answer`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'New supported question?' }) });
      assert.deepEqual(await answer.json(), { status: 'abstained', text: 'Insufficient evidence.' });
    } finally {
      await new Promise((resolve, reject) => serverWithRepository.close((error) => error ? reject(error) : resolve()));
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
