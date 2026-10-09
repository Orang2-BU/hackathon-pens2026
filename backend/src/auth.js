import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'tessera_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function constantTimeTextEqual(left, right) {
  const leftDigest = createHmac('sha256', 'tessera-password-compare-v1').update(left).digest();
  const rightDigest = createHmac('sha256', 'tessera-password-compare-v1').update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function createAuth({ demoPassword, csmPassword, userPassword, sessionSecret, publicOrigin, secureCookies = true, now = () => Date.now() }) {
  if (typeof demoPassword !== 'string' || demoPassword.length < 12) throw new TypeError('DEMO_PASSWORD must contain at least 12 characters.');
  if (typeof sessionSecret !== 'string' || Buffer.byteLength(sessionSecret) < 32) throw new TypeError('SESSION_SECRET must contain at least 32 bytes.');
  let origin;
  try { origin = new URL(publicOrigin).origin; } catch { throw new TypeError('PUBLIC_ORIGIN must be an absolute HTTP(S) origin.'); }
  if (!['http:', 'https:'].includes(new URL(origin).protocol)) throw new TypeError('PUBLIC_ORIGIN must use HTTP or HTTPS.');
  const identities = [
    { password: demoPassword, actorId: 'demo-admin', displayName: 'Demo Admin', role: 'admin' },
    ...(csmPassword ? [{ password: csmPassword, actorId: 'demo-csm', displayName: 'Demo CSM', role: 'csm' }] : []),
    ...(userPassword ? [{ password: userPassword, actorId: 'demo-user', displayName: 'Demo User', role: 'user' }] : []),
  ];
  if (identities.some(({ password }) => typeof password !== 'string' || password.length < 12)) throw new TypeError('Configured demo credentials must contain at least 12 characters.');
  if (new Set(identities.map(({ password }) => password)).size !== identities.length) throw new TypeError('Demo credentials must be distinct.');

  const sign = (payload) => createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return Object.freeze({
    cookieName: SESSION_COOKIE,
    authenticate(candidate) {
      if (typeof candidate !== 'string') return null;
      const matches = identities.map(({ password }) => constantTimeTextEqual(candidate, password));
      const matchIndex = matches.findIndex(Boolean);
      return matchIndex < 0 ? null : identities[matchIndex];
    },
    verifyPassword: (candidate) => typeof candidate === 'string'
      && identities.map(({ password }) => constantTimeTextEqual(candidate, password)).some(Boolean),
    issueSession(identity = identities[0]) {
      if (!identities.includes(identity)) throw new TypeError('Session identity is not configured.');
      const exp = Math.floor(now() / 1000) + SESSION_TTL_SECONDS;
      const payload = base64url(JSON.stringify({ actorId: identity.actorId, displayName: identity.displayName, role: identity.role, exp }));
      return `${payload}.${sign(payload)}`;
    },
    readSession(token) {
      if (typeof token !== 'string' || token.length > 1024) return null;
      const [payload, signature, extra] = token.split('.');
      if (!payload || !signature || extra) return null;
      const expected = Buffer.from(sign(payload));
      const actual = Buffer.from(signature);
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
      try {
        const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        const identity = identities.find(({ role, actorId }) => claims.role === role && claims.actorId === actorId);
        if (!identity || claims.displayName !== identity.displayName || !Number.isInteger(claims.exp) || claims.exp <= Math.floor(now() / 1000)) return null;
        return Object.freeze({ actorId: claims.actorId, displayName: claims.displayName, role: claims.role, exp: claims.exp });
      } catch { return null; }
    },
    cookie(token) {
      return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secureCookies ? '; Secure' : ''}`;
    },
    clearCookie() {
      return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookies ? '; Secure' : ''}`;
    },
    originAllowed(value) {
      if (typeof value !== 'string') return false;
      try { return new URL(value).origin === origin; } catch { return false; }
    },
  });
}

export function createRateLimiter({ limit, windowMs, maxKeys = 1000, now = () => Date.now() }) {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1 || !Number.isInteger(maxKeys) || maxKeys < 1) {
    throw new TypeError('Rate limiter limits must be positive integers.');
  }
  const buckets = new Map();
  return (key) => {
    const time = now();
    const current = buckets.get(key);
    if (current && current.resetAt > time) {
      if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - time) / 1000) };
      current.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (!current && buckets.size >= maxKeys) {
      const oldest = buckets.keys().next().value;
      buckets.delete(oldest);
    }
    buckets.delete(key);
    buckets.set(key, { count: 1, resetAt: time + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

export function cookieValue(header, name = SESSION_COOKIE) {
  if (typeof header !== 'string') return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim();
  }
  return null;
}
