import { createServer as createNodeServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createDatabase } from './db.js';
import { getReadiness } from './health.js';

function sendJson(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

export function createHttpServer({ database }) {
  return createNodeServer(async (request, response) => {
    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET');
      sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
      return;
    }

    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
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

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? '8080');
  const host = process.env.HOST ?? '127.0.0.1';
  const database = createDatabase(process.env.DATABASE_URL);
  const server = createHttpServer({ database });

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
