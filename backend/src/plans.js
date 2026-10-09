import { createHash, randomUUID } from 'node:crypto';

export class PlanError extends Error {
  constructor(code, message) { super(message); this.name = 'PlanError'; this.code = code; }
}

function requiredText(value, field, max = 8000) {
  if (typeof value !== 'string' || value.trim().length < 1 || value.length > max) throw new PlanError('INVALID_INPUT', `${field} is required and must be at most ${max} characters.`);
  return value.trim();
}

function validToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9:_-]{1,256}$/u.test(value);
}

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJson(value[key])]));
  return value;
}

export function validatePlanContext(context) {
  if (!context || typeof context !== 'object' || typeof context.businessAsOf !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/u.test(context.businessAsOf) || typeof context.datasetRevision !== 'string'
    || typeof context.graphRevision !== 'string' || typeof context.formulaVersion !== 'string' || context.synthetic !== true) {
    throw new PlanError('INVALID_CONTEXT', 'Plan context must include the snapshot, revisions, formula and synthetic marker.');
  }
  return Object.freeze({
    contractVersion: '1', businessAsOf: context.businessAsOf,
    datasetRevision: context.datasetRevision, graphRevision: context.graphRevision,
    formulaVersion: context.formulaVersion, synthetic: true,
    scoreRunId: typeof context.scoreRunId === 'string' ? context.scoreRunId : null,
    conditions: Array.isArray(context.conditions) ? context.conditions : [],
    sourceRefs: Array.isArray(context.sourceRefs) ? context.sourceRefs : [],
    leadFactor: ['usage','service','champion','promiseEngagement','payment'].includes(context.leadFactor) ? context.leadFactor : null,
  });
}

export async function createPlan({ database, accountNodeId, body, actorId, context, evidenceHash }) {
  if (!validToken(accountNodeId) || !validToken(actorId)) throw new PlanError('INVALID_INPUT', 'Account and session actor IDs must be valid tokens.');
  const text = requiredText(body, 'body');
  const planContext = validatePlanContext(context);
  if (!/^[0-9a-f]{64}$/u.test(evidenceHash ?? '')) throw new PlanError('INVALID_INPUT', 'Evidence hash must be SHA-256.');
  const planId = randomUUID();
  const revisionId = randomUUID();
  return database.begin(async (tx) => {
    const [account] = await tx`SELECT id FROM nodes WHERE id = ${accountNodeId} AND type = 'account'`;
    if (!account) throw new PlanError('NOT_FOUND', 'Account does not exist.');
    await tx`INSERT INTO plans (id, account_node_id) VALUES (${planId}, ${accountNodeId})`;
    const [revision] = await tx`
      INSERT INTO plan_revisions (id, plan_id, revision, body, actor_id, context, evidence_hash)
      VALUES (${revisionId}, ${planId}, 1, ${text}, ${actorId}, ${tx.json(planContext)}, ${evidenceHash})
      RETURNING id, plan_id, revision, body, actor_id, context, evidence_hash, created_at
    `;
    return { planId, revision: revisionDto(revision) };
  });
}

export async function revisePlan({ database, planId, expectedRevision, body, actorId, context, evidenceHash, deviationReason = null }) {
  if (!validToken(planId) || !validToken(actorId) || !Number.isInteger(expectedRevision) || expectedRevision < 1) throw new PlanError('INVALID_INPUT', 'Plan, actor and expected revision are invalid.');
  const text = requiredText(body, 'body');
  const reason = deviationReason === null ? null : requiredText(deviationReason, 'deviationReason', 4000);
  const planContext = validatePlanContext({ ...context, deviationReason: reason });
  if (!/^[0-9a-f]{64}$/u.test(evidenceHash ?? '')) throw new PlanError('INVALID_INPUT', 'Evidence hash must be SHA-256.');
  return database.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${planId}, 0))`;
    const [plan] = await tx`SELECT id FROM plans WHERE id = ${planId}`;
    if (!plan) throw new PlanError('NOT_FOUND', 'Plan does not exist.');
    const [current] = await tx`SELECT id, revision FROM plan_revisions WHERE plan_id = ${planId} ORDER BY revision DESC LIMIT 1`;
    if (!current) throw new PlanError('NOT_FOUND', 'Plan does not exist.');
    if (current.revision !== expectedRevision) throw new PlanError('CONFLICT', 'Plan revision is stale.');
    const id = randomUUID();
    const [revision] = await tx`
      INSERT INTO plan_revisions (id, plan_id, revision, body, actor_id, context, evidence_hash)
      VALUES (${id}, ${planId}, ${expectedRevision + 1}, ${text}, ${actorId}, ${tx.json({ ...planContext, deviationReason: reason })}, ${evidenceHash})
      RETURNING id, plan_id, revision, body, actor_id, context, evidence_hash, created_at
    `;
    return revisionDto(revision);
  });
}

export async function decidePlan({ database, planRevisionId, idempotencyKey, outcome, reason, actorId }) {
  if (!validToken(planRevisionId) || !validToken(idempotencyKey) || !validToken(actorId)
    || !['approved', 'rejected'].includes(outcome)) throw new PlanError('INVALID_INPUT', 'Decision fields are invalid.');
  const decisionReason = requiredText(reason, 'reason', 4000);
  const payload = { planRevisionId, outcome, reason: decisionReason };
  const payloadHash = createHash('sha256').update(JSON.stringify(stableJson(payload))).digest('hex');
  return database.begin(async (tx) => {
    const [revision] = await tx`SELECT id, plan_id, context, evidence_hash FROM plan_revisions WHERE id = ${planRevisionId}`;
    if (!revision) throw new PlanError('NOT_FOUND', 'Plan revision does not exist.');
    const [existing] = await tx`SELECT id, plan_revision_id, actor_id, outcome, reason, context, created_at, payload_hash FROM decisions WHERE actor_id = ${actorId} AND idempotency_key = ${idempotencyKey}`;
    if (existing) {
      if (existing.payload_hash !== payloadHash) throw new PlanError('CONFLICT', 'Idempotency key was already used with a different payload.');
      return decisionDto(existing);
    }
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${revision.plan_id}, 0))`;
    const [latest] = await tx`SELECT id FROM plan_revisions WHERE plan_id = ${revision.plan_id} ORDER BY revision DESC LIMIT 1`;
    if (latest.id !== planRevisionId) throw new PlanError('CONFLICT', 'Only the latest plan revision can be decided.');
    const [decisionForRevision] = await tx`SELECT id FROM decisions WHERE plan_revision_id = ${planRevisionId}`;
    if (decisionForRevision) throw new PlanError('CONFLICT', 'This plan revision already has a Decision.');
    const id = randomUUID();
    const decisionContext = {
      ...revision.context,
      origin: 'app_decision',
      evidenceHash: revision.evidence_hash,
      outreachSent: false,
    };
    await tx`
      INSERT INTO decisions (id, plan_revision_id, actor_id, idempotency_key, payload_hash, outcome, reason, context)
      VALUES (${id}, ${planRevisionId}, ${actorId}, ${idempotencyKey}, ${payloadHash}, ${outcome}, ${decisionReason}, ${tx.json(decisionContext)})
      ON CONFLICT (actor_id, idempotency_key) DO NOTHING
    `;
    const [stored] = await tx`SELECT id, plan_revision_id, actor_id, outcome, reason, context, created_at, payload_hash FROM decisions WHERE actor_id = ${actorId} AND idempotency_key = ${idempotencyKey}`;
    if (stored.payload_hash !== payloadHash) throw new PlanError('CONFLICT', 'Concurrent request used this idempotency key with a different payload.');
    return decisionDto(stored);
  });
}

function revisionDto(row) {
  return { id: row.id, planId: row.plan_id, revision: row.revision, body: row.body, actorId: row.actor_id, context: row.context, evidenceHash: row.evidence_hash, createdAt: row.created_at };
}

function decisionDto(row) {
  return { id: row.id, planRevisionId: row.plan_revision_id, outcome: row.outcome, reason: row.reason,
    actorId: row.actor_id, decidedAt: row.created_at, origin: row.context.origin ?? 'app_decision',
    context: row.context, outreachSent: false };
}
