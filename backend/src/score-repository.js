import { createHash } from 'node:crypto';
import { SCORING_EXPERIMENT } from './scoring.js';

const FACTOR_COLUMNS = Object.freeze(['id', 'score_run_id', 'dataset_revision_id', 'account_node_id', 'factor',
  'raw_value', 'normalized_value', 'unit', 'status', 'reason', 'period_start', 'period_end', 'evidence']);
const RESULT_COLUMNS = Object.freeze(['id', 'score_run_id', 'account_node_id', 'score', 'status', 'coverage', 'level',
  'level_reason', 'annual_value_idr', 'weighted_value_idr', 'context']);
const UNITS = Object.freeze({ usage: 'ratio', service: 'tickets_and_days', champion: 'boolean', promiseEngagement: 'mixed', payment: 'late_payment_count' });

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function factorId(scoreRunId, accountNodeId, factorName) {
  return `factor:${hash(`${scoreRunId}\0${accountNodeId}\0${factorName}`)}`;
}

function resultId(scoreRunId, accountNodeId) {
  return `score:${hash(`${scoreRunId}\0${accountNodeId}`)}`;
}

function shiftDate(value, days) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function insertRows(tx, table, columns, rows) {
  for (let offset = 0; offset < rows.length; offset += 500) {
    await tx`INSERT INTO ${tx(table)} ${tx(rows.slice(offset, offset + 500), columns)}`;
  }
}

export async function persistScoreReport({ database, revisionId, report }) {
  if (!database || typeof revisionId !== 'string' || !revisionId.startsWith('revision:')
    || !report || report.synthetic !== true || report.customerCount !== 40
    || revisionId !== `revision:${report.datasetHash}` || !Array.isArray(report.ranking) || report.ranking.length !== 40) {
    throw new TypeError('A validated 40-customer synthetic score report matching the published revision is required.');
  }
  const runParameters = stable({ synthetic: true, datasetHash: report.datasetHash, businessAsOf: report.businessAsOf,
    formulaVersion: report.formulaVersion, experiment: report.experiment, sensitivity: report.sensitivity, qa: report.qa });
  const scoreRunId = `score-run:${hash(JSON.stringify(runParameters))}`;

  return database.begin(async (tx) => {
    await tx`SET LOCAL ROLE tessera_runtime`;
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${scoreRunId}, 0))`;
    const [published] = await tx`SELECT id FROM dataset_revisions WHERE id = ${revisionId} AND status = 'published'`;
    if (!published) throw new Error('Score persistence requires the matching published dataset revision.');
    const [existing] = await tx`SELECT id FROM score_runs WHERE id = ${scoreRunId}`;
    if (existing) return { scoreRunId, revisionId, alreadyPersisted: true, customerCount: 40, factorCount: 200 };

    const accounts = await tx`SELECT id, external_key FROM nodes WHERE dataset_revision_id = ${revisionId} AND type = 'account'`;
    const accountNodeByExternalId = new Map(accounts.map(({ id, external_key }) => [external_key, id]));
    const factorRows = [];
    const resultRows = [];
    for (const result of report.ranking) {
      const accountNodeId = accountNodeByExternalId.get(result.accountId);
      if (!accountNodeId) throw new Error(`Score report account ${result.accountId} is not in the published graph.`);
      for (const [factorName, factor] of Object.entries(result.factors)) {
        if (!(factorName in SCORING_EXPERIMENT.weights)) continue;
        factorRows.push({
          id: factorId(scoreRunId, accountNodeId, factorName), score_run_id: scoreRunId,
          dataset_revision_id: revisionId, account_node_id: accountNodeId, factor: factorName,
          raw_value: tx.json(factor.raw), normalized_value: factor.normalized, unit: UNITS[factorName],
          status: factor.status, reason: factor.reason, period_start: factorName === 'usage' ? shiftDate(report.businessAsOf, -180)
            : factorName === 'payment' ? shiftDate(report.businessAsOf, -365) : null,
          period_end: ['usage', 'payment'].includes(factorName) ? report.businessAsOf : null,
          evidence: tx.json(factor.evidence ?? []),
        });
      }
      resultRows.push({
        id: resultId(scoreRunId, accountNodeId), score_run_id: scoreRunId, account_node_id: accountNodeId,
        score: result.score, status: result.status, coverage: result.coverage, level: result.level,
        level_reason: result.levelReason, annual_value_idr: result.annualValue, weighted_value_idr: result.weightedValue,
        context: tx.json({ ...result.context, synthetic: true, businessAsOf: report.businessAsOf }),
      });
    }
    if (resultRows.length !== 40 || factorRows.length !== 200) throw new Error('Score report must contain exactly five measured factors per customer.');
    await tx`INSERT INTO score_runs (id, dataset_revision_id, formula_version, parameters)
      VALUES (${scoreRunId}, ${revisionId}, ${report.formulaVersion}, ${tx.json(runParameters)})`;
    await insertRows(tx, 'account_factors', FACTOR_COLUMNS, factorRows);
    await insertRows(tx, 'score_run_results', RESULT_COLUMNS, resultRows);
    return { scoreRunId, revisionId, alreadyPersisted: false, customerCount: resultRows.length, factorCount: factorRows.length };
  });
}
