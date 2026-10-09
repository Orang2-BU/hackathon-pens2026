import { chunkText } from './jev.js';
import { buildSignalCandidate } from './signals.js';

export const SIGNAL_RUBRIC_VERSION = 'kasirnusa-signals-v1';
export const SIGNAL_QUESTIONS = Object.freeze({
  is_champion_exit: { type: 'noul', instructions: 'Does this customer interaction explicitly say the champion/contact has left the customer organization or is leaving? Score yes only for explicit evidence in this text.' },
  mentions_competitor: { type: 'noul', instructions: 'Does this text explicitly mention a competing product or provider? Do not infer a competitor from generic dissatisfaction.' },
  negative_sentiment: { type: 'noul', instructions: 'Does the customer express negative sentiment about the product or service in this text? Distinguish the customer voice from internal notes.' },
  is_urgent: { type: 'noul', instructions: 'Does the customer express an urgent problem or time-sensitive escalation in this text? Do not infer urgency from a ticket label alone.' },
  is_expansion: { type: 'noul', instructions: 'Does the customer explicitly express interest in additional outlets, users, or product capabilities? Do not treat a feature promise as customer expansion intent.' },
});

function answerValues(answer) {
  return answer.type === 'noul'
    ? { probability: answer.noul, score: null, confidence: null }
    : { probability: null, score: answer.score, confidence: answer.confidence };
}

export async function enrichInteraction({ database, jevClient, revisionId, record }) {
  if (!database || !jevClient || typeof revisionId !== 'string' || !record?.id || !record.record_hash || !record.payload) {
    throw new TypeError('Database, Jev client, published revision and source interaction are required.');
  }
  const accountId = record.payload.account_id;
  if (typeof accountId !== 'string' || !accountId) return { status: 'unlinked', signalCount: 0, chunkCount: 0 };
  const [account] = await database`
    SELECT id FROM nodes WHERE dataset_revision_id = ${revisionId} AND type = 'account' AND external_key = ${accountId}
  `;
  if (!account) return { status: 'unlinked', signalCount: 0, chunkCount: 0 };
  const sourceText = typeof record.payload.isi === 'string' ? record.payload.isi : '';
  if (!sourceText.trim()) return { status: 'empty', signalCount: 0, chunkCount: 0 };

  const chunks = chunkText(sourceText, 2000);
  let signalCount = 0;
  const metrics = { providerCalls: 0, cacheHits: 0, inputTokens: 0, outputTokens: 0, latencyMs: 0 };
  for (const chunk of chunks) {
    const result = await jevClient.evaluate({
      state: { text: chunk.text, subject: record.payload.subjek ?? '', interactionType: record.payload.tipe ?? '', date: record.payload.tanggal ?? null },
      questions: SIGNAL_QUESTIONS,
      rubricVersion: SIGNAL_RUBRIC_VERSION,
    });
    if (!result.runId) throw new Error('Jev evaluation did not return its persisted run ID.');
    if (result.metrics?.cached) metrics.cacheHits += 1;
    else metrics.providerCalls += 1;
    metrics.inputTokens += result.metrics?.inputTokens ?? result.usage.input_tokens;
    metrics.outputTokens += result.metrics?.outputTokens ?? result.usage.output_tokens;
    metrics.latencyMs += result.metrics?.latencyMs ?? 0;
    const candidates = Object.entries(result.answers).map(([label, answer]) => buildSignalCandidate({
      sourceText,
      chunk,
      sourceRecordId: record.id,
      sourceHash: record.record_hash,
      label,
      answer,
      jevRunId: result.runId,
      model: result.model,
      rubricVersion: SIGNAL_RUBRIC_VERSION,
    })).filter(({ status }) => status !== 'discarded');

    if (candidates.length) {
      const inserted = await database.begin(async (tx) => {
        const rows = [];
      for (const candidate of candidates) {
        const values = answerValues(candidate.answer);
        // High-confidence outputs still enter human review; approval is what activates a signal.
        rows.push(...await tx`
          INSERT INTO signals (
            id, dataset_revision_id, node_id, jev_run_id, label, probability, score, confidence,
            quote, span_start, span_end, status, source_record_id, source_hash, source_field
          ) VALUES (
            ${candidate.id}, ${revisionId}, ${account.id}, ${candidate.jevRunId}, ${candidate.label},
            ${values.probability}, ${values.score}, ${values.confidence}, ${candidate.quote},
            ${candidate.spanStart}, ${candidate.spanEnd}, 'review', ${candidate.sourceRecordId}, ${candidate.sourceHash}, 'isi'
          ) ON CONFLICT (id) DO NOTHING RETURNING id
        `);
      }
        return rows;
      });
      signalCount += inserted.length;
    }
  }
  return { status: 'enriched', signalCount, chunkCount: chunks.length, metrics };
}

export async function enrichPublishedInteractions({ database, jevClient, revisionId, limit = 100, afterRecordNumber = 0 }) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(afterRecordNumber) || afterRecordNumber < 0) {
    throw new RangeError('Enrichment limit must be 1–100 and cursor must be a non-negative integer.');
  }
  const [revision] = await database`SELECT id FROM dataset_revisions WHERE id = ${revisionId} AND status = 'published'`;
  if (!revision) throw new Error('A published revision is required before signal enrichment.');
  const records = await database`
    SELECT sr.id, sr.record_number, sr.record_hash, sr.payload
    FROM source_records sr JOIN sources s ON s.id = sr.source_id
    WHERE s.dataset_revision_id = ${revisionId} AND s.file_name = 'interactions.jsonl'
      AND sr.record_number > ${afterRecordNumber}
    ORDER BY sr.record_number LIMIT ${limit}
  `;
  const report = { revisionId, scanned: records.length, enriched: 0, unlinked: 0, empty: 0, failed: 0,
    signals: 0, providerCalls: 0, cacheHits: 0, inputTokens: 0, outputTokens: 0, latencyMs: 0,
    estimatedCostUsd: null, errors: [], nextAfterRecordNumber: afterRecordNumber };
  for (const record of records) {
    try {
      const result = await enrichInteraction({ database, jevClient, revisionId, record });
      report[result.status] += 1;
      report.signals += result.signalCount;
      report.providerCalls += result.metrics?.providerCalls ?? 0;
      report.cacheHits += result.metrics?.cacheHits ?? 0;
      report.inputTokens += result.metrics?.inputTokens ?? 0;
      report.outputTokens += result.metrics?.outputTokens ?? 0;
      report.latencyMs += result.metrics?.latencyMs ?? 0;
    } catch (error) {
      report.failed += 1;
      report.errors.push({ recordId: record.id, code: /^[a-z0-9_]{1,80}$/u.test(error?.code ?? '') ? error.code : 'ENRICHMENT_FAILED' });
    }
    report.nextAfterRecordNumber = record.record_number;
  }
  return report;
}
