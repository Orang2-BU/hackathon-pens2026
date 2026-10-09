import { createServer as createNodeServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createDatabase } from './db.js';
import { getReadiness } from './health.js';
import { cookieValue, createRateLimiter } from './auth.js';

function sendJson(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

export function createHttpServer({ database, auth = null }) {
  const loginLimit = createRateLimiter({ limit: 5, windowMs: 5 * 60 * 1000 });
  return createNodeServer(async (request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (path === '/api/auth/login' && request.method === 'POST') {
      if (!auth) { sendJson(response, 503, { error: 'AUTH_NOT_CONFIGURED' }); return; }
      if (!auth.originAllowed(request.headers.origin)) { sendJson(response, 403, { error: 'ORIGIN_FORBIDDEN' }); return; }
      const limit = loginLimit(request.socket.remoteAddress ?? 'unknown');
      if (!limit.allowed) {
        response.setHeader('retry-after', String(limit.retryAfterSeconds));
        sendJson(response, 429, { error: 'RATE_LIMITED' });
        return;
      }
      let body;
      try { body = await readJson(request, 4096); } catch (error) {
        sendJson(response, error.message === 'BODY_TOO_LARGE' ? 413 : 400, { error: error.message === 'BODY_TOO_LARGE' ? 'BODY_TOO_LARGE' : 'INVALID_JSON' });
        return;
      }
      if (!auth.verifyPassword(body.password)) { sendJson(response, 401, { error: 'INVALID_CREDENTIALS' }); return; }
      response.setHeader('set-cookie', auth.cookie(auth.issueSession()));
      sendJson(response, 200, { authenticated: true, role: 'admin' });
      return;
    }

    if (path === '/api/auth/logout' && request.method === 'POST') {
      if (!auth) { sendJson(response, 503, { error: 'AUTH_NOT_CONFIGURED' }); return; }
      if (!auth.originAllowed(request.headers.origin)) { sendJson(response, 403, { error: 'ORIGIN_FORBIDDEN' }); return; }
      response.setHeader('set-cookie', auth.clearCookie());
      sendJson(response, 200, { authenticated: false });
      return;
    }

    if (path === '/api/auth/session' && request.method === 'GET') {
      const session = auth?.readSession(cookieValue(request.headers.cookie));
      sendJson(response, 200, session ? { authenticated: true, role: session.role, expiresAt: session.exp } : { authenticated: false });
      return;
    }

    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET');
      sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
      return;
    }
    if (path === '/api/health/live') {
      sendJson(response, 200, { live: true });
      return;
    }

    if (path === '/api/health/ready') {
      const readiness = await getReadiness(database);
      sendJson(response, readiness.ready ? 200 : 503, readiness);
      return;
    }

    sendJson(response, 404, { error: 'NOT_FOUND' });
  });
}

async function readJson(request, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  } catch { throw new Error('INVALID_JSON'); }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? '8080');
  const host = process.env.HOST ?? '127.0.0.1';
  const database = createDatabase(process.env.DATABASE_URL);
  let auth = null;
  if (process.env.DEMO_PASSWORD && process.env.SESSION_SECRET && process.env.PUBLIC_ORIGIN) {
    const { createAuth } = await import('./auth.js');
    auth = createAuth({
      demoPassword: process.env.DEMO_PASSWORD,
      sessionSecret: process.env.SESSION_SECRET,
      publicOrigin: process.env.PUBLIC_ORIGIN,
      secureCookies: process.env.NODE_ENV !== 'development',
    });
  }
  const server = createHttpServer({ database, auth });

  server.listen(port, host, () => {
    process.stdout.write(`Tessera backend listening on http://${host}:${port}\n`);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      server.close(async () => {
        await database.end({ timeout: 5 });
        process.exit(0);
      });
    });
  }
}
