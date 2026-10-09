const BUSINESS_AS_OF = '2026-10-01';

function accountName(properties, externalKey) {
  return properties?.nama ?? properties?.nama_akun ?? properties?.account_name ?? externalKey;
}

function summary(row) {
  const properties = row.properties ?? {};
  return {
    id: row.external_key,
    nodeId: row.id,
    name: accountName(properties, row.external_key),
    type: properties.tipe === 'prospek' ? 'prospect' : 'customer',
    datasetRevision: row.dataset_revision_id,
    businessAsOf: BUSINESS_AS_OF,
    synthetic: true,
    priority: { score: null, status: 'unscored', coverage: null, reason: 'Persisted score run is not available.' },
    annualValueIdr: row.annual_value_idr == null ? null : Number(row.annual_value_idr),
    renewalDate: row.renewal_date ?? null,
    nps: properties.nps_terakhir === '' || properties.nps_terakhir == null ? null : Number(properties.nps_terakhir),
    dashboardHealth: properties.health_score_dashboard ?? null,
  };
}

export function createPostgresReadService(database) {
  return Object.freeze({
    async listAccounts({ search = '', sort = 'priority' } = {}) {
      const [revision] = await database`SELECT id FROM dataset_revisions WHERE status = 'published' ORDER BY published_at DESC LIMIT 1`;
      if (!revision) return { items: [], datasetRevision: null, businessAsOf: BUSINESS_AS_OF, synthetic: true };
      const rows = await database`
        SELECT n.id, n.dataset_revision_id, n.external_key, n.properties,
          (SELECT NULLIF(sr.payload->>'nilai_tahunan', '')::numeric
           FROM source_records sr JOIN sources s ON s.id = sr.source_id
           WHERE s.dataset_revision_id = n.dataset_revision_id AND s.file_name = 'contracts_billing.csv'
             AND sr.payload->>'account_id' = n.external_key ORDER BY sr.record_number LIMIT 1) AS annual_value_idr,
          (SELECT sr.payload->>'tanggal_renewal'
           FROM source_records sr JOIN sources s ON s.id = sr.source_id
           WHERE s.dataset_revision_id = n.dataset_revision_id AND s.file_name = 'contracts_billing.csv'
             AND sr.payload->>'account_id' = n.external_key ORDER BY sr.record_number LIMIT 1) AS renewal_date
        FROM nodes n
        WHERE n.dataset_revision_id = ${revision.id} AND n.type = 'account'
          AND (${search} = '' OR n.external_key ILIKE ${`%${search}%`} OR n.properties->>'nama' ILIKE ${`%${search}%`})
        ORDER BY n.external_key
        LIMIT 100
      `;
      const items = rows.map(summary);
      if (sort === 'renewal') items.sort((a, b) => (a.renewalDate ?? '9999').localeCompare(b.renewalDate ?? '9999') || a.id.localeCompare(b.id));
      else items.sort((a, b) => a.id.localeCompare(b.id));
      return { items, datasetRevision: revision.id, businessAsOf: BUSINESS_AS_OF, synthetic: true };
    },

    async getAccount(accountId) {
      const [row] = await database`
        SELECT n.id, n.dataset_revision_id, n.external_key, n.properties,
          (SELECT NULLIF(sr.payload->>'nilai_tahunan', '')::numeric
           FROM source_records sr JOIN sources s ON s.id = sr.source_id
           WHERE s.dataset_revision_id = n.dataset_revision_id AND s.file_name = 'contracts_billing.csv'
             AND sr.payload->>'account_id' = n.external_key ORDER BY sr.record_number LIMIT 1) AS annual_value_idr,
          (SELECT sr.payload->>'tanggal_renewal'
           FROM source_records sr JOIN sources s ON s.id = sr.source_id
           WHERE s.dataset_revision_id = n.dataset_revision_id AND s.file_name = 'contracts_billing.csv'
             AND sr.payload->>'account_id' = n.external_key ORDER BY sr.record_number LIMIT 1) AS renewal_date
        FROM nodes n JOIN dataset_revisions r ON r.id = n.dataset_revision_id
        WHERE n.type = 'account' AND n.external_key = ${accountId} AND r.status = 'published'
        ORDER BY r.published_at DESC LIMIT 1
      `;
      if (!row) return null;
      const factors = await database`
        SELECT factor, raw_value, normalized_value, unit, status, reason, period_start, period_end, evidence
        FROM account_factors WHERE dataset_revision_id = ${row.dataset_revision_id} AND account_node_id = ${row.id}
        ORDER BY factor
      `;
      const sourceRows = await database`
        SELECT e.id AS edge_id, e.type, e.relation_kind, e.reason, e.status, e.valid_from, e.valid_to,
          sn.id AS source_node_id, sn.type AS source_type, sn.external_key AS source_key, sn.properties AS source_properties,
          tn.id AS target_node_id, tn.type AS target_type, tn.external_key AS target_key, tn.properties AS target_properties,
          sr.id AS source_record_id, sr.record_hash, sr.occurred_at, s.file_name, s.synthetic
        FROM edges e
        JOIN nodes sn ON sn.id = e.source_node_id
        JOIN nodes tn ON tn.id = e.target_node_id
        JOIN edge_sources es ON es.edge_id = e.id
        JOIN source_records sr ON sr.id = es.source_record_id
        JOIN sources s ON s.id = sr.source_id
        WHERE e.dataset_revision_id = ${row.dataset_revision_id}
          AND (e.source_node_id = ${row.id} OR e.target_node_id = ${row.id})
          AND e.status = 'active'
          AND (e.valid_from IS NULL OR e.valid_from <= ${BUSINESS_AS_OF})
          AND (e.valid_to IS NULL OR ${BUSINESS_AS_OF} < e.valid_to)
        ORDER BY e.valid_from NULLS FIRST, e.id, sr.record_number
        LIMIT 300
      `;
      const planRows = await database`
        SELECT p.id AS plan_id, pr.id AS revision_id, pr.revision, pr.body, pr.actor_id AS revision_actor,
          pr.context AS revision_context, pr.evidence_hash, pr.created_at AS revision_created_at,
          d.id AS decision_id, d.outcome, d.reason AS decision_reason, d.actor_id AS decision_actor,
          d.context AS decision_context, d.created_at AS decision_created_at
        FROM plans p JOIN plan_revisions pr ON pr.plan_id = p.id
        LEFT JOIN decisions d ON d.plan_revision_id = pr.id
        WHERE p.account_node_id = ${row.id}
        ORDER BY pr.created_at, pr.revision
        LIMIT 100
      `;
      const citations = sourceRows.map((source) => ({
        id: source.source_record_id,
        group: source.file_name,
        recordHash: source.record_hash,
        occurredAt: source.occurred_at,
        synthetic: source.synthetic,
        quote: null,
      }));
      return {
        ...summary(row),
        graphRevision: `graph-v1:${row.dataset_revision_id}`,
        parameters: factors.map((factor) => ({ factor: factor.factor, rawValue: factor.raw_value,
          normalizedValue: factor.normalized_value, unit: factor.unit, status: factor.status,
          reason: factor.reason, period: { start: factor.period_start, end: factor.period_end }, evidence: factor.evidence })),
        evidence: sourceRows.map((source) => ({ edgeId: source.edge_id, type: source.type, relationKind: source.relation_kind,
          reason: source.reason, validFrom: source.valid_from, validTo: source.valid_to,
          source: { id: source.source_node_id, type: source.source_type, externalKey: source.source_key },
          target: { id: source.target_node_id, type: source.target_type, externalKey: source.target_key },
          sourceRecordIds: [source.source_record_id] })),
        citations,
        plans: planRows.map((plan) => ({ id: plan.plan_id, revision: { id: plan.revision_id,
          number: plan.revision, body: plan.body, actorId: plan.revision_actor, context: plan.revision_context,
          evidenceHash: plan.evidence_hash, createdAt: plan.revision_created_at },
          decision: plan.decision_id ? { id: plan.decision_id, outcome: plan.outcome, reason: plan.decision_reason,
            actorId: plan.decision_actor, context: plan.decision_context, decidedAt: plan.decision_created_at,
            outreachSent: false } : null })),
      };
    },

    async answerGraphQuestion() {
      return { status: 'abstained', intent: null, businessAsOf: BUSINESS_AS_OF,
        graphRevision: null, text: 'Live Jev routing and evidence-backed answer templates are not configured.',
        facts: [], citations: [], paths: [], limitations: ['jev_router_unavailable'] };
    },
  });
}
