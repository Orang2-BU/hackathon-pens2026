import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAuth } from '../src/auth.js';
import { createFeedbackService, replyToFeedback, submitFeedback } from '../src/feedback.js';
import { createHttpServer } from '../src/server.js';

test('feedback validates actor, context IDs, and bounded plain text before database access', async () => {
  const database = { begin: async () => { throw new Error('database must not be called'); } };
  await assert.rejects(submitFeedback({ database, accountNodeId: 'C01', body: ' 의견', actorId: 'not allowed' }), /actorId/u);
  await assert.rejects(submitFeedback({ database, accountNodeId: 'C01', body: '  ', actorId: 'demo-admin' }), /Feedback text/u);
  await assert.rejects(replyToFeedback({ database, feedbackId: 'F1', body: 'x'.repeat(4001), actorId: 'demo-admin' }), /Feedback text/u);
});

test('feedback user reads are scoped to the authenticated actor in parameterized SQL', async () => {
  const calls = [];
  const database = async (strings, ...values) => {
    const query = strings.join('?');
    calls.push({ query, values });
    if (query.includes('FROM feedback_replies')) return [];
    return [{ id: 'F1', account_node_id: 'C01', plan_revision_id: null, actor_id: 'demo-user', body: 'Opinion', status: 'open', created_at: 'now' }];
  };
  const service = createFeedbackService(database);
  await service.listFeedback({ actorId: 'demo-user' });
  await service.getFeedback('F1', { actorId: 'demo-user' });
  const reads = calls.filter(({ query }) => query.includes('FROM feedback\n'));
  assert.equal(reads.length, 2);
  assert.ok(reads.every(({ query, values }) => query.includes('actor_id = ?') && values.includes('demo-user')));
});

test('feedback write routes require origin/session and discard caller-supplied actor', async () => {
  const auth = createAuth({ demoPassword: 'correct horse battery staple', userPassword: 'user password sufficiently long', sessionSecret: '0123456789abcdef0123456789abcdef', publicOrigin: 'https://demo.example' });
  let captured;
  let readActor;
  const server = createHttpServer({ database: async () => [], auth, readService: {
    listFeedback: async ({ accountNodeId, actorId }) => { readActor = actorId; return { accountNodeId, items: [] }; },
  }, writeService: {
    submitFeedback: async (input) => { captured = input; return { id: 'f1', status: 'open' }; },
    replyToFeedback: async (input) => { captured = input; return { id: 'r1', feedbackId: input.feedbackId }; },
  } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const headers = { origin: 'https://demo.example', cookie: `tessera_session=${auth.issueSession()}`, 'content-type': 'application/json' };
  const userHeaders = { ...headers, cookie: `tessera_session=${auth.issueSession(auth.authenticate('user password sufficiently long'))}` };
  try {
    const privateRead = await fetch(`${origin}/api/feedback`);
    assert.equal(privateRead.status, 401);
    const authorizedRead = await fetch(`${origin}/api/feedback?accountNodeId=C01`, { headers });
    assert.deepEqual(await authorizedRead.json(), { accountNodeId: 'C01', items: [] });
    const submit = await fetch(`${origin}/api/feedback`, { method: 'POST', headers, body: JSON.stringify({ accountNodeId: 'C01', body: 'Please investigate this signal.', actorId: 'forged' }) });
    assert.equal(submit.status, 201);
    assert.equal(captured.actorId, 'demo-admin');
    const userList = await fetch(`${origin}/api/feedback`, { headers: userHeaders });
    assert.equal(userList.status, 200);
    assert.equal(readActor, 'demo-user');
    const userSubmit = await fetch(`${origin}/api/feedback`, { method: 'POST', headers: userHeaders, body: JSON.stringify({ accountNodeId: 'C01', body: 'I noticed this issue.', actorId: 'forged' }) });
    assert.equal(userSubmit.status, 201);
    assert.equal(captured.actorId, 'demo-user');
    const userReply = await fetch(`${origin}/api/feedback/F1/replies`, { method: 'POST', headers: userHeaders, body: JSON.stringify({ body: 'Attempted unauthorized reply.' }) });
    assert.equal(userReply.status, 403);
    const reply = await fetch(`${origin}/api/feedback/F1/replies`, { method: 'POST', headers, body: JSON.stringify({ body: 'We are reviewing it.', actorId: 'forged' }) });
    assert.equal(reply.status, 200);
    assert.equal(captured.actorId, 'demo-admin');
    assert.equal(captured.feedbackId, 'F1');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
