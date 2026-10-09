import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import postgres from 'postgres';
import { ingestDataset } from '../../src/ingest.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is required for disposable PostgreSQL integration tests.');
const datasetDirectory = process.env.TEST_DATASET_DIR;
if (!datasetDirectory) throw new Error('TEST_DATASET_DIR must point to the local KasirNusa directory for ingest integration tests.');

test('dataset publish is atomic, records every source row, and is idempotent by revision hash', async () => {
  const sql = postgres(url, { max: 1 });
  try {
    const first = await ingestDataset({ database: sql, directory: datasetDirectory });
    assert.equal(first.alreadyPublished, false);
    assert.equal(first.synthetic, true);
    assert.equal(Object.values(first.rowCounts).reduce((total, count) => total + count, 0), 229627);
    const [revision] = await sql`SELECT status, source_hash FROM dataset_revisions WHERE id = ${first.revisionId}`;
    assert.equal(revision.status, 'published');
    assert.equal(revision.source_hash, first.datasetHash);
    const [counts] = await sql`
      SELECT
        (SELECT count(*)::integer FROM sources WHERE dataset_revision_id = ${first.revisionId}) AS source_count,
        (SELECT count(*)::integer FROM source_records sr JOIN sources s ON s.id = sr.source_id WHERE s.dataset_revision_id = ${first.revisionId}) AS record_count,
        (SELECT count(*)::integer FROM nodes WHERE dataset_revision_id = ${first.revisionId}) AS node_count,
        (SELECT count(*)::integer FROM usage_daily WHERE dataset_revision_id = ${first.revisionId}) AS usage_count
    `;
    assert.deepEqual(counts, { source_count: 15, record_count: 229627, node_count: 1932, usage_count: 226300 });
    const second = await ingestDataset({ database: sql, directory: datasetDirectory });
    assert.equal(second.alreadyPublished, true);
    const [runCount] = await sql`SELECT count(*)::integer AS count FROM ingest_runs WHERE dataset_revision_id = ${first.revisionId}`;
    assert.equal(runCount.count, 1);
  } finally {
    await sql.end({ timeout: 5 });
  }
});

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
