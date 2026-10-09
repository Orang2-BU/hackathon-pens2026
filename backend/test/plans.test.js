import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAuth } from '../src/auth.js';
import { createPlan, decidePlan, PlanError, revisePlan, validatePlanContext } from '../src/plans.js';
import { createHttpServer } from '../src/server.js';

const context = { businessAsOf: '2026-10-01', datasetRevision: 'rev-a', graphRevision: 'graph-a', formulaVersion: 'risk-heuristic-v1', synthetic: true };

test('plan context is explicit and immutable fields reject incomplete or non-synthetic inputs', () => {
  assert.equal(validatePlanContext(context).synthetic, true);
  assert.throws(() => validatePlanContext({ ...context, synthetic: false }), (error) => error instanceof PlanError && error.code === 'INVALID_CONTEXT');
});

test('plan/decision validators fail before touching storage on invalid input', async () => {
  const database = { begin: async () => { throw new Error('storage must not be called'); } };
  await assert.rejects(createPlan({ database, accountNodeId: 'C01', body: '', actorId: 'demo-admin', context, evidenceHash: 'a'.repeat(64) }), { code: 'INVALID_INPUT' });
  await assert.rejects(revisePlan({ database, planId: 'p1', expectedRevision: 0, body: 'draft', actorId: 'demo-admin', context, evidenceHash: 'a'.repeat(64) }), { code: 'INVALID_INPUT' });
  await assert.rejects(decidePlan({ database, planRevisionId: 'r1', idempotencyKey: 'key1', outcome: 'approved', reason: '', actorId: 'demo-admin' }), { code: 'INVALID_INPUT' });
});

test('write routes require session and origin and derive actor from session, not request body', async () => {
  const auth = createAuth({ demoPassword: 'correct horse battery staple', userPassword: 'user password sufficiently long', sessionSecret: '0123456789abcdef0123456789abcdef', publicOrigin: 'https://demo.example' });
  let captured;
  const server = createHttpServer({ database: async () => [], auth, writeService: {
    createPlan: async (input) => { captured = input; return { id: 'created' }; },
  } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const unauth = await fetch(`${origin}/api/plans`, { method: 'POST', headers: { origin: 'https://demo.example', 'content-type': 'application/json' }, body: JSON.stringify({ accountNodeId: 'C01', body: 'Draft' }) });
    assert.equal(unauth.status, 401);
    const userToken = auth.issueSession(auth.authenticate('user password sufficiently long'));
    const forbiddenUserWrite = await fetch(`${origin}/api/plans`, { method: 'POST', headers: { origin: 'https://demo.example', cookie: `tessera_session=${userToken}`, 'content-type': 'application/json' }, body: JSON.stringify({ accountNodeId: 'C01', body: 'Draft' }) });
    assert.equal(forbiddenUserWrite.status, 403);
    const token = auth.issueSession();
    const response = await fetch(`${origin}/api/plans`, { method: 'POST', headers: { origin: 'https://demo.example', cookie: `tessera_session=${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ accountNodeId: 'C01', body: 'Draft', actorId: 'forged', context: { fake: true } }) });
    assert.equal(response.status, 201);
    assert.equal(captured.actorId, 'demo-admin');
    assert.equal('context' in captured, false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
