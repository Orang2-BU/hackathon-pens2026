import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import postgres from 'postgres';
import { ingestDataset } from '../../src/ingest.js';
import { compilePublishedGraph } from '../../src/graph-compiler.js';
import { enrichInteraction, SIGNAL_QUESTIONS, SIGNAL_RUBRIC_VERSION } from '../../src/signal-enrichment.js';
import { reviewSignal } from '../../src/signal-review.js';
import { scoreDataset } from '../../src/dataset-scoring.js';
import { persistScoreReport } from '../../src/score-repository.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is required for disposable PostgreSQL integration tests.');
const datasetDirectory = process.env.TEST_DATASET_DIR;
if (!datasetDirectory) throw new Error('TEST_DATASET_DIR must point to the local KasirNusa directory for ingest integration tests.');

test('dataset publish, graph compile, Jev signal persistence, and human review are repeatable', async () => {
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
    const [source] = await sql`SELECT sr.payload FROM source_records sr JOIN sources s ON s.id=sr.source_id
      WHERE s.dataset_revision_id=${first.revisionId} AND s.file_name='crm_accounts.csv' AND sr.external_id='C01'`;
    const [account] = await sql`SELECT properties FROM nodes WHERE dataset_revision_id=${first.revisionId} AND type='account' AND external_key='C01'`;
    assert.equal(source.payload.account_id, 'C01');
    assert.equal(account.properties.tipe, 'pelanggan');
    const second = await ingestDataset({ database: sql, directory: datasetDirectory });
    assert.equal(second.alreadyPublished, true);
    const [runCount] = await sql`SELECT count(*)::integer AS count FROM ingest_runs WHERE dataset_revision_id = ${first.revisionId}`;
    assert.equal(runCount.count, 1);
    const compiled = await compilePublishedGraph({ database: sql, revisionId: first.revisionId });
    assert.equal(compiled.status, 'compiled');
    assert.ok(compiled.edgeCount >= 4000);
    assert.ok(compiled.factCount > 0);
    const repeated = await compilePublishedGraph({ database: sql, revisionId: first.revisionId });
    assert.equal(repeated.edgeCount, compiled.edgeCount);
    assert.equal(repeated.factCount, compiled.factCount);
    const [candidateCount] = await sql`SELECT count(*)::integer AS count FROM edges WHERE dataset_revision_id = ${first.revisionId} AND type = 'bug_candidate' AND status = 'review'`;
    assert.equal(candidateCount.count, 5);

    const [interaction] = await sql`
      SELECT sr.id, sr.record_hash, sr.payload
      FROM source_records sr JOIN sources s ON s.id = sr.source_id
      WHERE s.dataset_revision_id = ${first.revisionId} AND s.file_name = 'interactions.jsonl'
        AND NULLIF(sr.payload->>'isi', '') IS NOT NULL
      ORDER BY sr.record_number LIMIT 1
    `;
    assert.ok(interaction);
    const jevRunId = randomUUID();
    const model = `integration-${randomUUID()}`;
    await sql`
      INSERT INTO jev_runs (id, input_hash, primitive, model, model_requested, rubric_version, status, response)
      VALUES (${jevRunId}, ${createHash('sha256').update(jevRunId).digest('hex')}, 'noul', ${model}, ${model}, ${SIGNAL_RUBRIC_VERSION}, 'succeeded', ${sql.json({ fixture: true })})
    `;
    const answers = Object.fromEntries(Object.entries(SIGNAL_QUESTIONS).map(([label, question]) => [label,
      question.type === 'noul'
        ? { type: 'noul', noul: label === 'mentions_competitor' ? 0.99 : 0.01 }
        : question.type === 'score'
          ? { type: 'score', score: 0, confidence: 0.99, probabilities: { '0': 0.99, '1': 0.003, '2': 0.003, '3': 0.004 } }
          : { type: 'choice', choice: 'neutral', confidence: 0.99, probabilities: { positive: 0.003, neutral: 0.99, negative: 0.003, mixed: 0.004 },
          },
    ]));
    const jevClient = { evaluate: async () => ({ runId: jevRunId, model, answers, usage: { input_tokens: 1, output_tokens: 1 }, metrics: { cached: false, latencyMs: 1, inputTokens: 1, outputTokens: 1 } }) };
    const enrichment = await enrichInteraction({ database: sql, jevClient, revisionId: first.revisionId, record: interaction });
    assert.equal(enrichment.signalCount, 1);
    const [signal] = await sql`SELECT id, status, jev_run_id, quote, span_start, span_end, source_record_id, source_hash, source_field FROM signals WHERE jev_run_id = ${jevRunId}`;
    assert.equal(signal.status, 'review');
    assert.equal(signal.quote, interaction.payload.isi);
    assert.equal(interaction.payload.isi.slice(signal.span_start, signal.span_end), signal.quote);
    assert.equal(signal.source_record_id, interaction.id);
    assert.equal(signal.source_hash, interaction.record_hash);
    assert.equal(signal.source_field, 'isi');
    const decision = await reviewSignal({ database: sql, signalId: signal.id, actorId: 'integration', idempotencyKey: `review-${randomUUID()}`, decision: 'accepted', reason: 'Integration fixture review' });
    assert.equal(decision.decision, 'accepted');
    const [approved] = await sql`SELECT status FROM signals WHERE id = ${signal.id}`;
    assert.equal(approved.status, 'active');

    const scoreReport = await scoreDataset(datasetDirectory);
    const c01Score = scoreReport.ranking.find(r => r.accountId === 'C01');
    assert.equal(c01Score.metrics.promiseEngagement.unmetPromiseCount, 1);
    assert(c01Score.metrics.promiseEngagement.evidence.some(e => e.file === 'decision_log.csv'));
    const scoreRun = await persistScoreReport({ database: sql, revisionId: first.revisionId, report: scoreReport });
    assert.equal(scoreRun.customerCount, 40);
    assert.equal(scoreRun.factorCount, 200);
    const repeatedScoreRun = await persistScoreReport({ database: sql, revisionId: first.revisionId, report: scoreReport });
    assert.equal(repeatedScoreRun.alreadyPersisted, true);
    const [storedScoreCounts] = await sql`
      SELECT (SELECT count(*)::integer FROM account_factors WHERE score_run_id = ${scoreRun.scoreRunId}) AS factor_count,
        (SELECT count(*)::integer FROM score_run_results WHERE score_run_id = ${scoreRun.scoreRunId}) AS result_count
    `;
    assert.deepEqual(storedScoreCounts, { factor_count: 200, result_count: 40 });
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
