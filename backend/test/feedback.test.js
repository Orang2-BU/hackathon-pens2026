import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAuth } from '../src/auth.js';
import { replyToFeedback, submitFeedback } from '../src/feedback.js';
import { createHttpServer } from '../src/server.js';

test('feedback validates actor, context IDs, and bounded plain text before database access', async () => {
  const database = { begin: async () => { throw new Error('database must not be called'); } };
  await assert.rejects(submitFeedback({ database, accountNodeId: 'C01', body: ' 의견', actorId: 'not allowed' }), /actorId/u);
  await assert.rejects(submitFeedback({ database, accountNodeId: 'C01', body: '  ', actorId: 'demo-admin' }), /Feedback text/u);
  await assert.rejects(replyToFeedback({ database, feedbackId: 'F1', body: 'x'.repeat(4001), actorId: 'demo-admin' }), /Feedback text/u);
});

test('feedback write routes require origin/session and discard caller-supplied actor', async () => {
  const auth = createAuth({ demoPassword: 'correct horse battery staple', sessionSecret: '0123456789abcdef0123456789abcdef', publicOrigin: 'https://demo.example' });
  let captured;
  const server = createHttpServer({ database: async () => [], auth, readService: {
    listFeedback: async ({ accountNodeId }) => ({ accountNodeId, items: [] }),
  }, writeService: {
    submitFeedback: async (input) => { captured = input; return { id: 'f1', status: 'open' }; },
    replyToFeedback: async (input) => { captured = input; return { id: 'r1', feedbackId: input.feedbackId }; },
  } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const headers = { origin: 'https://demo.example', cookie: `tessera_session=${auth.issueSession()}`, 'content-type': 'application/json' };
  try {
    const privateRead = await fetch(`${origin}/api/feedback`);
    assert.equal(privateRead.status, 401);
    const authorizedRead = await fetch(`${origin}/api/feedback?accountNodeId=C01`, { headers });
    assert.deepEqual(await authorizedRead.json(), { accountNodeId: 'C01', items: [] });
    const submit = await fetch(`${origin}/api/feedback`, { method: 'POST', headers, body: JSON.stringify({ accountNodeId: 'C01', body: 'Please investigate this signal.', actorId: 'forged' }) });
    assert.equal(submit.status, 201);
    assert.equal(captured.actorId, 'demo-admin');
    const reply = await fetch(`${origin}/api/feedback/F1/replies`, { method: 'POST', headers, body: JSON.stringify({ body: 'We are reviewing it.', actorId: 'forged' }) });
    assert.equal(reply.status, 200);
    assert.equal(captured.actorId, 'demo-admin');
    assert.equal(captured.feedbackId, 'F1');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
