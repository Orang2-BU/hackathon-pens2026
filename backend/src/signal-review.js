import { createHash, randomUUID } from 'node:crypto';

export class SignalReviewError extends Error {
  constructor(code, message) { super(message); this.name = 'SignalReviewError'; this.code = code; }
}

function token(value, field) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9:_-]{1,160}$/u.test(value)) throw new SignalReviewError('INVALID_INPUT', `${field} is invalid.`);
  return value;
}

function reviewDto(row) {
  return { id: row.id, signalId: row.signal_id, actorId: row.actor_id, decision: row.decision,
    reason: row.reason, createdAt: row.created_at };
}

export async function reviewSignal({ database, signalId, actorId, idempotencyKey, decision, reason = null }) {
  token(signalId, 'signalId');
  token(actorId, 'actorId');
  token(idempotencyKey, 'idempotencyKey');
  if (!['accepted', 'rejected'].includes(decision)) throw new SignalReviewError('INVALID_INPUT', 'Decision must be accepted or rejected.');
  if (reason !== null && (typeof reason !== 'string' || !reason.trim() || reason.length > 2000)) throw new SignalReviewError('INVALID_INPUT', 'Reason must contain 1–2000 characters.');
  const cleanReason = reason?.trim() ?? null;
  const payloadHash = createHash('sha256').update(JSON.stringify({ signalId, decision, reason: cleanReason })).digest('hex');
  return database.begin(async (tx) => {
    const [existing] = await tx`SELECT id, signal_id, actor_id, decision, reason, created_at, payload_hash FROM signal_reviews WHERE actor_id = ${actorId} AND idempotency_key = ${idempotencyKey}`;
    if (existing) {
      if (existing.payload_hash !== payloadHash) throw new SignalReviewError('CONFLICT', 'Idempotency key was used with a different review.');
      return reviewDto(existing);
    }
    const [signal] = await tx`SELECT id, status FROM signals WHERE id = ${signalId} FOR UPDATE`;
    if (!signal) throw new SignalReviewError('NOT_FOUND', 'Signal does not exist.');
    if (signal.status !== 'review') throw new SignalReviewError('CONFLICT', 'Only review candidates can be decided.');
    const id = randomUUID();
    await tx`INSERT INTO signal_reviews (id, signal_id, actor_id, decision, reason, idempotency_key, payload_hash)
      VALUES (${id}, ${signalId}, ${actorId}, ${decision}, ${cleanReason}, ${idempotencyKey}, ${payloadHash})
      ON CONFLICT (actor_id, idempotency_key) DO NOTHING`;
    const [stored] = await tx`SELECT id, signal_id, actor_id, decision, reason, created_at, payload_hash FROM signal_reviews WHERE actor_id = ${actorId} AND idempotency_key = ${idempotencyKey}`;
    if (!stored || stored.payload_hash !== payloadHash) throw new SignalReviewError('CONFLICT', 'Concurrent request used this idempotency key with a different review.');
    await tx`UPDATE signals SET status = ${decision === 'accepted' ? 'active' : 'discarded'} WHERE id = ${signalId} AND status = 'review'`;
    return reviewDto(stored);
  });
}

export function createSignalReviewService(database) {
  return Object.freeze({
    reviewSignal: (input) => reviewSignal({ database, ...input }),
    async listSignalReviews() {
      const rows = await database`SELECT s.id, s.dataset_revision_id, s.node_id, s.jev_run_id, s.label, s.score, s.confidence, s.quote, s.span_start, s.span_end
        FROM signals s WHERE s.status = 'review' ORDER BY s.id LIMIT 200`;
      return { items: rows.map((row) => ({ id: row.id, datasetRevisionId: row.dataset_revision_id, nodeId: row.node_id,
        jevRunId: row.jev_run_id, label: row.label, score: row.score, confidence: row.confidence,
        quote: row.quote, spanStart: row.span_start, spanEnd: row.span_end })) };
    },
  });
}
