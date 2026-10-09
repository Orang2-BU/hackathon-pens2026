import { createHash } from 'node:crypto';
import { createPlan, decidePlan, revisePlan } from './plans.js';

const BUSINESS_AS_OF = '2026-10-01';
const DEFAULT_FORMULA_VERSION = 'risk-heuristic-v1';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

export function createPlanContext({ datasetRevision, formulaVersion = DEFAULT_FORMULA_VERSION }) {
  if (typeof datasetRevision !== 'string' || !datasetRevision.startsWith('revision:')) throw new TypeError('A published dataset revision is required.');
  return Object.freeze({ businessAsOf: BUSINESS_AS_OF, datasetRevision,
    graphRevision: `graph-v1:${datasetRevision}`, formulaVersion, synthetic: true });
}

async function planInputs(database, accountIdentifier) {
  const [account] = await database`
    SELECT n.id, n.external_key, n.dataset_revision_id, latest_score.id AS score_run_id,
      COALESCE(latest_score.formula_version, ${DEFAULT_FORMULA_VERSION}) AS formula_version
    FROM nodes n JOIN dataset_revisions dr ON dr.id = n.dataset_revision_id
    LEFT JOIN LATERAL (
      SELECT sr.id, sr.formula_version FROM score_runs sr
      WHERE sr.dataset_revision_id = n.dataset_revision_id ORDER BY sr.created_at DESC, sr.id DESC LIMIT 1
    ) latest_score ON true
    WHERE n.type = 'account' AND (n.id = ${accountIdentifier} OR n.external_key = ${accountIdentifier}) AND dr.status = 'published'
    ORDER BY dr.published_at DESC LIMIT 1
  `;
  if (!account) return null;
  const evidence = await database`
    SELECT DISTINCT 'source'::text AS item_type, sr.id AS source_record_id, sr.record_hash, NULL::jsonb AS detail
    FROM edges e JOIN edge_sources es ON es.edge_id = e.id JOIN source_records sr ON sr.id = es.source_record_id
    WHERE e.dataset_revision_id = ${account.dataset_revision_id}
      AND (e.source_node_id = ${account.id} OR e.target_node_id = ${account.id})
      AND e.status = 'active'
      AND (e.valid_from IS NULL OR e.valid_from <= ${BUSINESS_AS_OF})
      AND (e.valid_to IS NULL OR ${BUSINESS_AS_OF} < e.valid_to)
    UNION ALL
    SELECT 'factor'::text, NULL::text, NULL::text,
      jsonb_build_object('factor', af.factor, 'rawValue', af.raw_value, 'normalizedValue', af.normalized_value, 'evidence', af.evidence)
    FROM account_factors af
    WHERE af.dataset_revision_id = ${account.dataset_revision_id} AND af.account_node_id = ${account.id}
      AND af.score_run_id = ${account.score_run_id}
    ORDER BY item_type, source_record_id
  `;
  const evidenceHash = createHash('sha256').update(JSON.stringify(stable(evidence.map(({ item_type, source_record_id, record_hash, detail }) => ({ itemType: item_type, sourceRecordId: source_record_id, recordHash: record_hash, detail }))))).digest('hex');
  return { accountNodeId: account.id, externalKey: account.external_key,
    context: createPlanContext({ datasetRevision: account.dataset_revision_id, formulaVersion: account.formula_version }), evidenceHash };
}

export function createPlanService(database) {
  return Object.freeze({
    async createPlan({ accountNodeId, body, actorId }) {
      const inputs = await planInputs(database, accountNodeId);
      if (!inputs) {
        const error = new Error('Account does not exist in a published dataset.');
        error.code = 'NOT_FOUND';
        throw error;
      }
      return createPlan({ database, accountNodeId: inputs.accountNodeId, body, actorId, context: inputs.context, evidenceHash: inputs.evidenceHash });
    },
    async revisePlan({ planId, expectedRevision, body, actorId, deviationReason = null }) {
      const [plan] = await database`
        SELECT n.external_key
        FROM plans p JOIN nodes n ON n.id = p.account_node_id
        WHERE p.id = ${planId} AND n.type = 'account'
      `;
      if (!plan) {
        const error = new Error('Plan does not exist.');
        error.code = 'NOT_FOUND';
        throw error;
      }
      const inputs = await planInputs(database, plan.external_key);
      if (!inputs) {
        const error = new Error('Account no longer exists in a published dataset.');
        error.code = 'NOT_FOUND';
        throw error;
      }
      return revisePlan({ database, planId, expectedRevision, body, actorId, context: inputs.context, evidenceHash: inputs.evidenceHash, deviationReason });
    },
    decidePlan: (input) => decidePlan({ database, ...input }),
  });
}
