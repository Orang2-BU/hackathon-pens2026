import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { after, before, test } from 'node:test';
import { cookieValue, createAuth, createRateLimiter } from '../src/auth.js';
import { createHttpServer } from '../src/server.js';

const config = { demoPassword: 'correct horse battery staple', sessionSecret: '0123456789abcdef0123456789abcdef', publicOrigin: 'https://demo.example' };

test('signed sessions are tamper-proof, expire, and cookies are protected', () => {
  let now = 1_800_000_000_000;
  const auth = createAuth({ ...config, now: () => now });
  assert.equal(auth.verifyPassword(config.demoPassword), true);
  assert.equal(auth.verifyPassword('wrong'), false);
  const token = auth.issueSession();
  assert.equal(auth.readSession(token).role, 'admin');
  assert.equal(auth.readSession(`${token}x`), null);
  const nonAdminPayload = Buffer.from(JSON.stringify({ actorId: 'demo-user', displayName: 'Demo User', role: 'user', exp: Math.floor(now / 1000) + 60 })).toString('base64url');
  const forgedRoleToken = `${nonAdminPayload}.${createHmac('sha256', config.sessionSecret).update(nonAdminPayload).digest('base64url')}`;
  assert.equal(auth.readSession(forgedRoleToken), null);
  assert.match(auth.cookie(token), /HttpOnly; SameSite=Lax; Max-Age=28800; Secure/u);
  assert.equal(cookieValue(`x=1; tessera_session=${token}`), token);
  now += 8 * 60 * 60 * 1000;
  assert.equal(auth.readSession(token), null);
  assert.throws(() => createAuth({ ...config, sessionSecret: 'short' }), /32 bytes/u);
});

test('origin check and bounded rate limiter reject unsafe or excessive requests', () => {
  const auth = createAuth(config);
  assert.equal(auth.originAllowed('https://demo.example/path'), true);
  assert.equal(auth.originAllowed('https://attacker.example'), false);
  let now = 0;
  const allow = createRateLimiter({ limit: 2, windowMs: 1000, maxKeys: 1, now: () => now });
  assert.equal(allow('a').allowed, true);
  assert.equal(allow('a').allowed, true);
  assert.deepEqual(allow('a'), { allowed: false, retryAfterSeconds: 1 });
  now = 1000;
  assert.equal(allow('b').allowed, true);
});

test('optional CSM and user credentials map to fixed identities and reject duplicates or weak secrets', () => {
  const auth = createAuth({ ...config, csmPassword: 'csm password sufficiently long', userPassword: 'user password sufficiently long' });
  const csm = auth.authenticate('csm password sufficiently long');
  const user = auth.authenticate('user password sufficiently long');
  assert.deepEqual({ actorId: csm.actorId, role: csm.role }, { actorId: 'demo-csm', role: 'csm' });
  assert.deepEqual({ actorId: user.actorId, role: user.role }, { actorId: 'demo-user', role: 'user' });
  assert.equal(auth.readSession(auth.issueSession(user)).role, 'user');
  assert.throws(() => createAuth({ ...config, userPassword: config.demoPassword }), /distinct/u);
  assert.throws(() => createAuth({ ...config, csmPassword: 'short' }), /12 characters/u);
});

let server;
let baseUrl;
const auth = createAuth(config);
before(async () => {
  server = createHttpServer({ database: async () => [], auth });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

test('login enforces origin and password, session endpoint reads signed cookie, logout clears it', async () => {
  const forbidden = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' }, body: JSON.stringify({ password: config.demoPassword }) });
  assert.equal(forbidden.status, 403);
  const invalid = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { origin: config.publicOrigin, 'content-type': 'application/json' }, body: JSON.stringify({ password: 'wrong' }) });
  assert.equal(invalid.status, 401);
  const login = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { origin: config.publicOrigin, 'content-type': 'application/json' }, body: JSON.stringify({ password: config.demoPassword }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/u);
  const session = await fetch(`${baseUrl}/api/auth/session`, { headers: { cookie: cookie.split(';')[0] } });
  const sessionBody = await session.json();
  assert.equal(sessionBody.authenticated, true);
  assert.equal(sessionBody.role, 'admin');
  assert.equal(sessionBody.actorId, 'demo-admin');
  assert.equal(sessionBody.displayName, 'Demo Admin');
  assert.ok(Number.isInteger(sessionBody.expiresAt));
  const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { origin: config.publicOrigin } });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/u);
});
