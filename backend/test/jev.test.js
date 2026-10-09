import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chunkText, createConfiguredJevClient, createJevClient, JevError, validateJevResponse } from '../src/jev.js';

const questions = {
  mentions_competitor: { type: 'noul', instructions: 'Does the text mention a competitor?' },
  urgency: { type: 'score', instructions: 'Rate urgency.', criteria: ['No action', 'This week', 'Today'] },
  sentiment: { type: 'choice', instructions: 'Classify sentiment.', criteria: { positive: 'Positive', neutral: 'Neutral', negative: 'Negative' } },
};

const providerResponse = {
  model: 'jev-1.13.0',
  answers: {
    mentions_competitor: { type: 'noul', noul: 0.91 },
    urgency: { type: 'score', score: 1.7, confidence: 0.88, probabilities: { 0: 0.1, 1: 0.1, 2: 0.8 }, legend: { 0: 'No action', 1: 'This week', 2: 'Today' } },
    sentiment: { type: 'choice', choice: 'negative', confidence: 0.9, probabilities: { positive: 0.02, neutral: 0.08, negative: 0.9 } },
  },
  usage: { input_tokens: 120, output_tokens: 12 },
};

function response(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function makeStore() {
  const cache = new Map();
  const saved = [];
  return {
    saved,
    async getCached(key) { return cache.get(JSON.stringify(key)) ?? null; },
    async saveRun(run) {
      saved.push(run);
      if (run.status === 'succeeded') cache.set(JSON.stringify({ inputHash: run.inputHash, modelRequested: run.modelRequested, rubricVersion: run.rubricVersion, primitive: run.primitive }), {
        response: run.response,
        latency_ms: run.latencyMs,
        input_tokens: run.inputTokens,
        output_tokens: run.outputTokens,
      });
    },
  };
}

test('typed validator accepts Noul, Score, and Choice and rejects malformed ranges', () => {
  const validated = validateJevResponse(providerResponse, questions);
  assert.equal(validated.answers.mentions_competitor.noul, 0.91);
  assert.equal(validated.answers.urgency.score, 1.7);
  assert.equal(validated.answers.sentiment.choice, 'negative');
  assert.throws(() => validateJevResponse({ ...providerResponse, answers: { ...providerResponse.answers, mentions_competitor: { type: 'noul', noul: 1.2 } } }, questions), /outside/);
  assert.throws(() => validateJevResponse({ ...providerResponse, answers: { ...providerResponse.answers, urgency: { ...providerResponse.answers.urgency, score: 3 } } }, questions), /score answer.*invalid/);
  assert.throws(() => validateJevResponse({ ...providerResponse, usage: { input_tokens: -1, output_tokens: 0 } }, questions), /usage is invalid/);
});

test('client batches typed questions and caches validated response by input/model/rubric', async () => {
  const store = makeStore();
  let calls = 0;
  const client = createJevClient({ apiKey: 'test-key', store, fetchImpl: async (url, init) => {
    calls += 1;
    assert.equal(url, 'https://api.typesafe.ai/v1/systemone');
    assert.equal(init.headers.authorization, 'Bearer test-key');
    assert.deepEqual(JSON.parse(init.body).questions, questions);
    return response(providerResponse);
  } });

  const first = await client.evaluate({ state: { text: 'Competitor named; please review today.' }, questions, rubricVersion: 'signals-v1' });
  const second = await client.evaluate({ state: { text: 'Competitor named; please review today.' }, questions, rubricVersion: 'signals-v1' });
  assert.equal(calls, 1);
  assert.equal(first.metrics.cached, false);
  assert.equal(second.metrics.cached, true);
  assert.equal(store.saved.length, 1);
  assert.equal(store.saved[0].primitive, 'mixed');
  assert.equal(store.saved[0].inputTokens, 120);
  assert.equal(first.metrics.estimatedCostUsd, null);
});

test('client retries temporary errors only and records a sanitized failure', async () => {
  const store = makeStore();
  let calls = 0;
  const delays = [];
  const client = createJevClient({ apiKey: 'test-key', store, wait: async (ms) => delays.push(ms), fetchImpl: async () => {
    calls += 1;
    return calls < 3 ? response({ detail: 'temporary' }, 503) : response(providerResponse);
  } });
  const result = await client.evaluate({ state: 'A short message.', questions, rubricVersion: 'signals-v1' });
  assert.equal(result.model, 'jev-1.13.0');
  assert.equal(calls, 3);
  assert.deepEqual(delays, [500, 1000]);
  assert.equal(store.saved[0].status, 'succeeded');

  const unauthorizedStore = makeStore();
  let unauthorizedCalls = 0;
  const unauthorized = createJevClient({ apiKey: 'test-key', store: unauthorizedStore, fetchImpl: async () => {
    unauthorizedCalls += 1;
    return response({ detail: 'not logged' }, 401);
  } });
  await assert.rejects(unauthorized.evaluate({ state: 'small', questions, rubricVersion: 'signals-v1' }), (error) => error instanceof JevError && error.status === 401);
  assert.equal(unauthorizedCalls, 1);
  assert.equal(unauthorizedStore.saved[0].errorCode, 'provider_http_error');
});

test('chunk offsets preserve source text and request limits count retry calls', async () => {
  const source = 'é'.repeat(21) + ' boundary ' + '🧾'.repeat(20);
  const chunks = chunkText(source, 24);
  assert.equal(chunks.map(({ text }) => text).join(''), source);
  assert.equal(chunks.every(({ start, end, text }) => source.slice(start, end) === text), true);
  assert.equal(chunks.every(({ text }) => text.length <= 24), true);
  assert.throws(() => chunkText(source, 2001), /between 2 and 2000/);
  assert.throws(() => chunkText('🧾', 1), /between 2 and 2000/);

  const store = makeStore();
  let calls = 0;
  const limited = createJevClient({ apiKey: 'test-key', store, maxRequests: 1, wait: async () => {}, fetchImpl: async () => {
    calls += 1;
    return response({ detail: 'busy' }, 429);
  } });
  await assert.rejects(limited.evaluate({ state: 'small', questions, rubricVersion: 'signals-v1' }));
  assert.equal(calls, 1);
});

test('client refuses to start without a server-side key', () => {
  assert.throws(() => createJevClient({ apiKey: '', store: makeStore() }), /JEV_API_KEY/);
  assert.throws(() => createConfiguredJevClient({ database: async () => [], env: {} }), /JEV_API_KEY/);
});
