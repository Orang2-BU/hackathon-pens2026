import { randomUUID } from 'node:crypto';
import { PlanError } from './plans.js';

function text(value, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new PlanError('INVALID_INPUT', 'Action text is invalid.');
  return value.trim();
}
export function validateAction(input) {
  const owner = text(input.owner, 120), note = text(input.note, 4000);
  const date = new Date(`${input.dueDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(input.dueDate ?? '') || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== input.dueDate
    || !['planned','in_progress','blocked','completed','cancelled'].includes(input.status)) throw new PlanError('INVALID_INPUT', 'Action date or status is invalid.');
  const outcome = input.outcome ? text(input.outcome, 4000) : null;
  if (input.status === 'completed' && !outcome) throw new PlanError('INVALID_INPUT', 'Completion requires an observed outcome.');
  return { owner, note, dueDate: input.dueDate, status: input.status, outcome };
}
export function actionDto(row) {
  return { id: row.id, decisionId: row.decision_id, accountId: row.external_key, accountName: row.account_name,
    plan: row.body, revision: row.revision, owner: row.owner, dueDate: row.due_date, status: row.status,
    note: row.note, outcome: row.outcome, actorId: row.actor_id, updatedAt: row.created_at,
    stuck: row.status === 'blocked' || (!['completed','cancelled'].includes(row.status) && row.due_date < new Date().toISOString().slice(0,10)) };
}
export function createActionService(database) {
  async function append(tx, actionId, revision, value, actorId) {
    await tx`INSERT INTO action_events (id,action_id,revision,actor_id,owner,due_date,status,note,outcome)
      VALUES (${randomUUID()},${actionId},${revision},${actorId},${value.owner},${value.dueDate},${value.status},${value.note},${value.outcome})`;
    return { id: actionId, revision };
  }
  return {
    async listActions() {
      const rows = await database`SELECT a.id,a.decision_id,n.external_key,n.properties->>'nama' AS account_name,pr.body,
        ev.revision,ev.owner,ev.due_date::text,ev.status,ev.note,ev.outcome,ev.actor_id,ev.created_at
        FROM actions a JOIN decisions d ON d.id=a.decision_id JOIN plan_revisions pr ON pr.id=d.plan_revision_id
        JOIN plans p ON p.id=pr.plan_id JOIN nodes n ON n.id=p.account_node_id
        JOIN LATERAL (SELECT * FROM action_events WHERE action_id=a.id ORDER BY revision DESC LIMIT 1) ev ON true
        ORDER BY ev.due_date,a.id LIMIT 200`;
      return { items: rows.map(actionDto) };
    },
    async createAction(input) {
      const value = validateAction(input);
      if (typeof input.decisionId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/u.test(input.decisionId)) throw new PlanError('INVALID_INPUT','Invalid decision.');
      return database.begin(async tx => {
        await tx`SELECT pg_advisory_xact_lock(hashtextextended(${input.decisionId}, 0))`;
        const [decision] = await tx`SELECT id,outcome FROM decisions WHERE id=${input.decisionId}`;
        if (!decision) throw new PlanError('NOT_FOUND','Decision not found.');
        if (decision.outcome !== 'approved') throw new PlanError('CONFLICT','Only approved plans can be executed.');
        const [existing] = await tx`SELECT id FROM actions WHERE decision_id=${input.decisionId}`;
        if (existing) throw new PlanError('CONFLICT','This decision already has an action.');
        const id=randomUUID();
        await tx`INSERT INTO actions(id,decision_id) VALUES (${id},${input.decisionId})`;
        return append(tx,id,1,value,input.actorId);
      });
    },
    async updateAction(input) {
      const value=validateAction(input);
      if (!Number.isInteger(input.expectedRevision) || input.expectedRevision<1) throw new PlanError('INVALID_INPUT','Invalid revision.');
      return database.begin(async tx => {
        await tx`SELECT pg_advisory_xact_lock(hashtextextended(${input.actionId}, 0))`;
        const [action]=await tx`SELECT id FROM actions WHERE id=${input.actionId}`;
        if (!action) throw new PlanError('NOT_FOUND','Action not found.');
        const [event]=await tx`SELECT revision,status FROM action_events WHERE action_id=${input.actionId} ORDER BY revision DESC LIMIT 1`;
        if (event.revision!==input.expectedRevision) throw new PlanError('CONFLICT','Action changed; refresh before saving.');
        if (['completed','cancelled'].includes(event.status)) throw new PlanError('CONFLICT','Closed actions are immutable.');
        return append(tx,input.actionId,event.revision+1,value,input.actorId);
      });
    },
    async actionHistory(actionId) {
      const rows=await database`SELECT id,revision,actor_id,owner,due_date::text,status,note,outcome,created_at FROM action_events WHERE action_id=${actionId} ORDER BY revision`;
      return { items: rows.map(r=>({id:r.id,revision:r.revision,actorId:r.actor_id,owner:r.owner,dueDate:r.due_date,status:r.status,note:r.note,outcome:r.outcome,createdAt:r.created_at})) };
    },
  };
}
