import { randomUUID } from 'node:crypto';

export class FeedbackError extends Error {
  constructor(code, message) { super(message); this.name = 'FeedbackError'; this.code = code; }
}

function text(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4000) throw new FeedbackError('INVALID_INPUT', 'Feedback text must contain 1–4000 characters.');
  return value.trim();
}

function token(value, field) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/u.test(value)) throw new FeedbackError('INVALID_INPUT', `${field} is invalid.`);
  return value;
}

export async function submitFeedback({ database, accountNodeId, planRevisionId = null, body, actorId }) {
  token(accountNodeId, 'accountNodeId');
  token(actorId, 'actorId');
  if (planRevisionId !== null) token(planRevisionId, 'planRevisionId');
  const content = text(body);
  return database.begin(async (tx) => {
    const [account] = await tx`SELECT id FROM nodes WHERE id = ${accountNodeId} AND type = 'account'`;
    if (!account) throw new FeedbackError('NOT_FOUND', 'Account does not exist.');
    if (planRevisionId) {
      const [revision] = await tx`SELECT r.id FROM plan_revisions r JOIN plans p ON p.id = r.plan_id WHERE r.id = ${planRevisionId} AND p.account_node_id = ${accountNodeId}`;
      if (!revision) throw new FeedbackError('INVALID_CONTEXT', 'Plan revision does not belong to this account.');
    }
    const id = randomUUID();
    const [row] = await tx`
      INSERT INTO feedback (id, account_node_id, plan_revision_id, actor_id, body)
      VALUES (${id}, ${accountNodeId}, ${planRevisionId}, ${actorId}, ${content})
      RETURNING id, account_node_id, plan_revision_id, actor_id, body, status, created_at
    `;
    return feedbackDto(row);
  });
}

export async function replyToFeedback({ database, feedbackId, body, actorId }) {
  token(feedbackId, 'feedbackId');
  token(actorId, 'actorId');
  const content = text(body);
  return database.begin(async (tx) => {
    const [feedback] = await tx`SELECT id FROM feedback WHERE id = ${feedbackId} FOR UPDATE`;
    if (!feedback) throw new FeedbackError('NOT_FOUND', 'Feedback does not exist.');
    const [reply] = await tx`
      INSERT INTO feedback_replies (id, feedback_id, actor_id, body)
      VALUES (${randomUUID()}, ${feedbackId}, ${actorId}, ${content})
      RETURNING id, feedback_id, actor_id, body, created_at
    `;
    await tx`UPDATE feedback SET status = 'responded' WHERE id = ${feedbackId}`;
    return { id: reply.id, feedbackId: reply.feedback_id, actorId: reply.actor_id, body: reply.body, createdAt: reply.created_at };
  });
}

export function createFeedbackService(database) {
  return Object.freeze({
    submitFeedback: (input) => submitFeedback({ database, ...input }),
    replyToFeedback: (input) => replyToFeedback({ database, ...input }),
    async listFeedback({ accountNodeId = null }) {
      const rows = accountNodeId
        ? await database`SELECT id, account_node_id, plan_revision_id, actor_id, body, status, created_at FROM feedback WHERE account_node_id = ${accountNodeId} ORDER BY created_at DESC LIMIT 100`
        : await database`SELECT id, account_node_id, plan_revision_id, actor_id, body, status, created_at FROM feedback ORDER BY created_at DESC LIMIT 100`;
      return { items: rows.map(feedbackDto) };
    },
    async getFeedback(feedbackId) {
      const [row] = await database`SELECT id, account_node_id, plan_revision_id, actor_id, body, status, created_at FROM feedback WHERE id = ${feedbackId}`;
      if (!row) return null;
      const replies = await database`SELECT id, feedback_id, actor_id, body, created_at FROM feedback_replies WHERE feedback_id = ${feedbackId} ORDER BY created_at, id`;
      return { ...feedbackDto(row), replies: replies.map((reply) => ({ id: reply.id, feedbackId: reply.feedback_id, actorId: reply.actor_id, body: reply.body, createdAt: reply.created_at })) };
    },
  });
}

function feedbackDto(row) {
  return { id: row.id, accountNodeId: row.account_node_id, planRevisionId: row.plan_revision_id,
    actorId: row.actor_id, body: row.body, status: row.status, createdAt: row.created_at };
}
