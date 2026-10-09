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

export function createAuth({ demoPassword, sessionSecret, publicOrigin, secureCookies = true, now = () => Date.now() }) {
  if (typeof demoPassword !== 'string' || demoPassword.length < 12) throw new TypeError('DEMO_PASSWORD must contain at least 12 characters.');
  if (typeof sessionSecret !== 'string' || Buffer.byteLength(sessionSecret) < 32) throw new TypeError('SESSION_SECRET must contain at least 32 bytes.');
  let origin;
  try { origin = new URL(publicOrigin).origin; } catch { throw new TypeError('PUBLIC_ORIGIN must be an absolute HTTP(S) origin.'); }
  if (!['http:', 'https:'].includes(new URL(origin).protocol)) throw new TypeError('PUBLIC_ORIGIN must use HTTP or HTTPS.');

  const sign = (payload) => createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return Object.freeze({
    cookieName: SESSION_COOKIE,
    verifyPassword: (candidate) => typeof candidate === 'string' && constantTimeTextEqual(candidate, demoPassword),
    issueSession() {
      const exp = Math.floor(now() / 1000) + SESSION_TTL_SECONDS;
      const payload = base64url(JSON.stringify({ role: 'admin', exp }));
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
        if (claims.role !== 'admin' || !Number.isInteger(claims.exp) || claims.exp <= Math.floor(now() / 1000)) return null;
        return Object.freeze({ role: claims.role, exp: claims.exp });
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
