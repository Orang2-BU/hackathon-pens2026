import { createServer as createNodeServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createDatabase } from './db.js';
import { getReadiness } from './health.js';
import { cookieValue, createRateLimiter } from './auth.js';
import { createFeedbackService } from './feedback.js';
import { createSignalReviewService } from './signal-review.js';
import { createPostgresReadService } from './read-repository.js';
import { createPlanService } from './plan-service.js';
import { createActionService } from './actions.js';
import { createWorkspaceService } from './workspace.js';
import { createConfiguredJevClient } from './jev.js';

function sendJson(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

export function createHttpServer({ database, auth = null, readService = null, writeService = null }) {
  const loginLimit = createRateLimiter({ limit: 5, windowMs: 5 * 60 * 1000 });
  const queryLimit = createRateLimiter({ limit: 20, windowMs: 60 * 1000 });
  const writeLimit = createRateLimiter({ limit: 30, windowMs: 60 * 1000 });
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
      const identity = auth.authenticate(body.password);
      if (!identity) { sendJson(response, 401, { error: 'INVALID_CREDENTIALS' }); return; }
      response.setHeader('set-cookie', auth.cookie(auth.issueSession(identity)));
      sendJson(response, 200, { authenticated: true, role: identity.role });
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
      sendJson(response, 200, session ? { authenticated: true, actorId: session.actorId, displayName: session.displayName, role: session.role, expiresAt: session.exp } : { authenticated: false });
      return;
    }

    if (path === '/api/graph/answer' && request.method === 'POST') {
      const limit = queryLimit(request.socket.remoteAddress ?? 'unknown');
      if (!limit.allowed) {
        response.setHeader('retry-after', String(limit.retryAfterSeconds));
        sendJson(response, 429, { error: 'RATE_LIMITED' });
        return;
      }
      let body;
      try { body = await readJson(request, 8192); } catch (error) {
        sendJson(response, error.message === 'BODY_TOO_LARGE' ? 413 : 400, { error: error.message === 'BODY_TOO_LARGE' ? 'BODY_TOO_LARGE' : 'INVALID_JSON' });
        return;
      }
      if (typeof body.question !== 'string' || body.question.trim().length < 3 || body.question.length > 2000) {
        sendJson(response, 400, { error: 'INVALID_QUESTION' });
        return;
      }
      if (!readService?.answerGraphQuestion) { sendJson(response, 503, { error: 'GRAPH_UNAVAILABLE' }); return; }
      try {
        const answer = await readService.answerGraphQuestion(body.question.trim());
        sendJson(response, 200, answer);
      } catch {
        sendJson(response, 503, { error: 'GRAPH_UNAVAILABLE' });
      }
      return;
    }

    const evidenceMatch=path.match(/^\/api\/accounts\/([A-Za-z0-9_-]{1,80})\/(evidence|recommendation)$/u);
    const actionHistoryMatch=path.match(/^\/api\/actions\/([A-Za-z0-9_-]{1,128})\/history$/u);
    if (request.method === 'GET' && (path === '/api/data/status' || path === '/api/actions' || path === '/api/graph/evidence' || evidenceMatch || actionHistoryMatch)) {
      if ((path === '/api/actions' || actionHistoryMatch) && !auth?.readSession(cookieValue(request.headers.cookie))) { sendJson(response,401,{error:'UNAUTHENTICATED'});return; }
      const url=new URL(request.url,'http://localhost');
      const depth=Number(url.searchParams.get('depth')??2);
      const graphEntity=path==='/api/graph/evidence'?url.searchParams.get('entity'):null;
      if(path==='/api/graph/evidence' && (typeof graphEntity!=='string'||! /^[A-Za-z0-9:_.-]{1,256}$/u.test(graphEntity))) {sendJson(response,400,{error:'INVALID_QUERY'});return;}
      if ((evidenceMatch || graphEntity) && (!Number.isInteger(depth)||depth<1||depth>4)) {sendJson(response,400,{error:'INVALID_QUERY'});return;}
      const operation=path==='/api/data/status'?'dataStatus':path==='/api/actions'?'listActions':actionHistoryMatch?'actionHistory':evidenceMatch?.[2]==='recommendation'?'recommendation':'getEvidence';
      if(!readService?.[operation]){sendJson(response,503,{error:'DATA_UNAVAILABLE'});return;}
      try {sendJson(response,200,await readService[operation](actionHistoryMatch?.[1]??evidenceMatch?.[1]??graphEntity,depth));}
      catch(error){sendJson(response,error.code==='NOT_FOUND'?404:503,{error:error.code==='NOT_FOUND'?'NOT_FOUND':'DATA_UNAVAILABLE'});}
      return;
    }

    const feedbackReplyMatch = path.match(/^\/api\/feedback\/([A-Za-z0-9_-]{1,128})\/replies$/u);
    const signalReviewMatch = path.match(/^\/api\/signals\/([A-Za-z0-9:_-]{1,160})\/review$/u);
    if (['/api/plans', '/api/decisions', '/api/feedback', '/api/actions'].includes(path) && request.method === 'POST'
      || /^\/api\/plans\/[A-Za-z0-9_-]+$/u.test(path) && request.method === 'PATCH'
      || /^\/api\/actions\/[A-Za-z0-9_-]+$/u.test(path) && request.method === 'PATCH'
      || feedbackReplyMatch && request.method === 'POST'
      || signalReviewMatch && request.method === 'POST') {
      if (!auth) { sendJson(response, 503, { error: 'AUTH_NOT_CONFIGURED' }); return; }
      if (!auth.originAllowed(request.headers.origin)) { sendJson(response, 403, { error: 'ORIGIN_FORBIDDEN' }); return; }
      const session = auth.readSession(cookieValue(request.headers.cookie));
      if (!session) { sendJson(response, 401, { error: 'UNAUTHENTICATED' }); return; }
      const feedbackSubmission = path === '/api/feedback';
      if (!['admin', 'csm'].includes(session.role) && !(feedbackSubmission && session.role === 'user')) {
        sendJson(response, 403, { error: 'FORBIDDEN' }); return;
      }
      const limit = writeLimit(request.socket.remoteAddress ?? 'unknown');
      if (!limit.allowed) { response.setHeader('retry-after', String(limit.retryAfterSeconds)); sendJson(response, 429, { error: 'RATE_LIMITED' }); return; }
      let body;
      try { body = await readJson(request, 16_384); } catch (error) {
        sendJson(response, error.message === 'BODY_TOO_LARGE' ? 413 : 400, { error: error.message === 'BODY_TOO_LARGE' ? 'BODY_TOO_LARGE' : 'INVALID_JSON' });
        return;
      }
      const operation = path === '/api/actions' ? 'createAction' : path.startsWith('/api/actions/') ? 'updateAction' : path === '/api/plans' ? 'createPlan'
        : path === '/api/decisions' ? 'decidePlan'
          : path === '/api/feedback' ? 'submitFeedback'
            : feedbackReplyMatch ? 'replyToFeedback' : signalReviewMatch ? 'reviewSignal' : 'revisePlan';
      if (!writeService?.[operation]) { sendJson(response, 503, { error: 'WRITE_UNAVAILABLE' }); return; }
      try {
        const payload = ['createAction','updateAction'].includes(operation) ? {decisionId:body.decisionId,actionId:path.split('/').at(-1),expectedRevision:body.expectedRevision,owner:body.owner,dueDate:body.dueDate,status:body.status,note:body.note,outcome:body.outcome} : operation === 'createPlan'
          ? { accountNodeId: body.accountNodeId, body: body.body }
          : operation === 'revisePlan'
            ? { planId: path.split('/').at(-1), expectedRevision: body.expectedRevision, body: body.body, deviationReason: body.deviationReason }
            : operation === 'decidePlan'
              ? { planRevisionId: body.planRevisionId, idempotencyKey: body.idempotencyKey, outcome: body.outcome, reason: body.reason }
              : operation === 'submitFeedback'
                ? { accountNodeId: body.accountNodeId, planRevisionId: body.planRevisionId ?? null, body: body.body }
                : feedbackReplyMatch ? { feedbackId: feedbackReplyMatch[1], body: body.body }
                  : { signalId: signalReviewMatch[1], idempotencyKey: body.idempotencyKey, decision: body.decision, reason: body.reason ?? null };
        const result = await writeService[operation]({ ...payload, actorId: session.actorId });
        sendJson(response, ['createPlan', 'submitFeedback'].includes(operation) ? 201 : 200, result);
      } catch (error) {
        const mapping = { INVALID_INPUT: 400, INVALID_CONTEXT: 400, NOT_FOUND: 404, CONFLICT: 409 };
        const status = mapping[error.code] ?? 503;
        sendJson(response, status, { error: mapping[error.code] ? error.code : 'WRITE_UNAVAILABLE' });
      }
      return;
    }

    if (path === '/api/accounts' && request.method === 'GET') {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const search = url.searchParams.get('search') ?? '';
      const sort = url.searchParams.get('sort') ?? 'priority';
      if (search.length > 100 || !['priority', 'weighted', 'renewal'].includes(sort)) {
        sendJson(response, 400, { error: 'INVALID_QUERY' });
        return;
      }
      if (!readService?.listAccounts) { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); return; }
      try { sendJson(response, 200, await readService.listAccounts({ search, sort })); }
      catch { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); }
      return;
    }

    if (path === '/api/feedback' && request.method === 'GET') {
      if (!auth?.readSession(cookieValue(request.headers.cookie))) { sendJson(response, 401, { error: 'UNAUTHENTICATED' }); return; }
      const accountNodeId = new URL(request.url ?? '/', 'http://localhost').searchParams.get('accountNodeId');
      if (accountNodeId && !/^[A-Za-z0-9:_-]{1,256}$/u.test(accountNodeId)) { sendJson(response, 400, { error: 'INVALID_QUERY' }); return; }
      if (!readService?.listFeedback) { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); return; }
      const session = auth.readSession(cookieValue(request.headers.cookie));
      try { sendJson(response, 200, await readService.listFeedback({ accountNodeId, actorId: session.role === 'user' ? session.actorId : null })); }
      catch { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); }
      return;
    }

    if (path === '/api/signals/review' && request.method === 'GET') {
      const session = auth?.readSession(cookieValue(request.headers.cookie));
      if (!session) { sendJson(response, 401, { error: 'UNAUTHENTICATED' }); return; }
      if (session.role !== 'admin') { sendJson(response, 403, { error: 'FORBIDDEN' }); return; }
      if (!readService?.listSignalReviews) { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); return; }
      try { sendJson(response, 200, await readService.listSignalReviews()); }
      catch { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); }
      return;
    }

    const feedbackReadMatch = path.match(/^\/api\/feedback\/([A-Za-z0-9_-]{1,128})$/u);
    if (feedbackReadMatch && request.method === 'GET') {
      if (!auth?.readSession(cookieValue(request.headers.cookie))) { sendJson(response, 401, { error: 'UNAUTHENTICATED' }); return; }
      if (!readService?.getFeedback) { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); return; }
      try {
        const session = auth.readSession(cookieValue(request.headers.cookie));
        const thread = await readService.getFeedback(feedbackReadMatch[1], { actorId: session.role === 'user' ? session.actorId : null });
        if (!thread) { sendJson(response, 404, { error: 'NOT_FOUND' }); return; }
        sendJson(response, 200, thread);
      } catch { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); }
      return;
    }

    if (path.startsWith('/api/accounts/') && request.method === 'GET') {
      let accountId;
      try { accountId = decodeURIComponent(path.slice('/api/accounts/'.length)); } catch { sendJson(response, 400, { error: 'INVALID_ACCOUNT_ID' }); return; }
      if (!/^[A-Za-z0-9_-]{1,80}$/u.test(accountId)) { sendJson(response, 400, { error: 'INVALID_ACCOUNT_ID' }); return; }
      if (!readService?.getAccount) { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); return; }
      try {
        const account = await readService.getAccount(accountId);
        if (!account) { sendJson(response, 404, { error: 'NOT_FOUND' }); return; }
        sendJson(response, 200, account);
      } catch { sendJson(response, 503, { error: 'DATA_UNAVAILABLE' }); }
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
      csmPassword: process.env.DEMO_CSM_PASSWORD,
      userPassword: process.env.DEMO_USER_PASSWORD,
      sessionSecret: process.env.SESSION_SECRET,
      publicOrigin: process.env.PUBLIC_ORIGIN,
      secureCookies: process.env.NODE_ENV !== 'development',
    });
  }
  const feedbackService = createFeedbackService(database);
  const signalReviewService = createSignalReviewService(database);
  const planService = createPlanService(database);
  const postgresReadService = createPostgresReadService(database);
  const actions=createActionService(database);
  const jev=process.env.JEV_API_KEY?createConfiguredJevClient({database}):null;
  const workspace=createWorkspaceService(database,postgresReadService,jev);
  const readService = Object.freeze({ ...postgresReadService, ...feedbackService, ...signalReviewService, ...workspace, ...actions });
  const writeService = Object.freeze({ ...planService, ...feedbackService, ...signalReviewService, ...actions });
  const server = createHttpServer({ database, auth, readService, writeService });

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
