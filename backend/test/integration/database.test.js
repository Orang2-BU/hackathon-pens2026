import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import postgres from 'postgres';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is required for disposable PostgreSQL integration tests.');

test('Decision rows reject update/delete and failed transactions roll back', async () => {
  const sql = postgres(url, { max: 1 });
  try {
    const suffix = randomUUID();
    const revisionId = `integration-${suffix}`;
    const accountId = `account-${suffix}`;
    const planId = `plan-${suffix}`;
    const planRevisionId = `plan-revision-${suffix}`;
    const decisionId = `decision-${suffix}`;
    await sql`INSERT INTO dataset_revisions (id, source_hash, status) VALUES (${revisionId}, ${'a'.repeat(64)}, 'staging')`;
    await sql`INSERT INTO nodes (id, dataset_revision_id, type, external_key) VALUES (${accountId}, ${revisionId}, 'account', ${accountId})`;
    await sql`INSERT INTO plans (id, account_node_id) VALUES (${planId}, ${accountId})`;
    await sql`INSERT INTO plan_revisions (id, plan_id, revision, body, actor_id, context, evidence_hash)
      VALUES (${planRevisionId}, ${planId}, 1, 'test', 'integration', '{}', 'test')`;
    await sql`INSERT INTO decisions (id, plan_revision_id, actor_id, idempotency_key, payload_hash, outcome, context)
      VALUES (${decisionId}, ${planRevisionId}, 'integration', ${suffix}, 'test', 'approved', '{}')`;
    await assert.rejects(sql`UPDATE decisions SET reason = 'mutation' WHERE id = ${decisionId}`);
    await assert.rejects(sql`DELETE FROM decisions WHERE id = ${decisionId}`);

    const marker = `rollback-${suffix}`;
    await assert.rejects(sql.begin(async (transaction) => {
      await transaction`INSERT INTO dataset_revisions (id, source_hash, status) VALUES (${marker}, 'test', 'staging')`;
      throw new Error('force rollback');
    }), /force rollback/);
    const [row] = await sql`SELECT id FROM dataset_revisions WHERE id = ${marker}`;
    assert.equal(row, undefined);
  } finally {
    await sql.end({ timeout: 5 });
  }
});
