import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createHttpServer } from '../src/server.js';

let server;
let baseUrl;

before(async () => {
  const database = async (strings) => {
    const query = strings.join('');
    if (query.includes('schema_migrations')) return [{ version: '001_core' }];
    return [{ id: 'kasirnusa-demo' }];
  };
  server = createHttpServer({ database });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('liveness does not depend on PostgreSQL', async () => {
  const response = await fetch(`${baseUrl}/api/health/live`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { live: true });
});

test('readiness requires the schema and a published revision', async () => {
  const response = await fetch(`${baseUrl}/api/health/ready`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ready: true,
    database: 'available',
    schemaVersion: '001_core',
    datasetRevision: 'kasirnusa-demo',
  });
});

test('readiness returns 503 and safe state when the database is unavailable', async () => {
  const unavailable = createHttpServer({ database: async () => { throw new Error('private database detail'); } });
  await new Promise((resolve) => unavailable.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${unavailable.address().port}/api/health/ready`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      ready: false,
      database: 'unavailable',
      schemaVersion: null,
      datasetRevision: null,
    });
  } finally {
    await new Promise((resolve, reject) => unavailable.close((error) => error ? reject(error) : resolve()));
  }
});

test('unknown route and unsupported method have stable HTTP errors', async () => {
  const missing = await fetch(`${baseUrl}/not-here`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'NOT_FOUND' });
  const method = await fetch(`${baseUrl}/api/health/live`, { method: 'POST' });
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'GET');
});
