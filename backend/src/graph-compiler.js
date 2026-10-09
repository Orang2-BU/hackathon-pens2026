import { createHash } from 'node:crypto';
import { datasetNodeId } from './ingest.js';

export const GRAPH_SOURCE_FILES = Object.freeze([
  'crm_accounts.csv', 'crm_contacts.csv', 'contact_employment_history.csv', 'crm_deals.csv',
  'employees.csv', 'interactions.jsonl', 'outlets.csv', 'feature_usage_monthly.csv',
  'support_tickets.csv', 'bugs.csv', 'releases.csv', 'features.csv',
  'contracts_billing.csv', 'decision_log.csv',
]);
const EDGE_COLUMNS = Object.freeze(['id', 'dataset_revision_id', 'type', 'source_node_id', 'target_node_id', 'relation_kind', 'reason', 'status', 'valid_from', 'valid_to']);
const EDGE_SOURCE_COLUMNS = Object.freeze(['edge_id', 'source_record_id']);
const FACT_COLUMNS = Object.freeze(['id', 'node_id', 'key', 'value', 'valid_from', 'valid_to', 'source_record_id']);
const SNAPSHOT_DATE = '2026-10-01';

function nextDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) throw new TypeError(`Invalid graph date: ${value}`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function edgeRecord(revisionId, relation, sourceNodeId, targetNodeId, sourceRecordIds, { relationKind = 'hard', reason = null, status = 'active', validFrom = null, validTo = null } = {}) {
  if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId || !sourceRecordIds.length) return null;
  const identity = `${revisionId}\0${relation}\0${sourceNodeId}\0${targetNodeId}\0${sourceRecordIds.join('\0')}`;
  const id = `edge:${createHash('sha256').update(identity).digest('hex')}`;
  return {
    edge: { id, dataset_revision_id: revisionId, type: relation, source_node_id: sourceNodeId, target_node_id: targetNodeId, relation_kind: relationKind, reason, status, valid_from: validFrom, valid_to: validTo },
    sources: [...new Set(sourceRecordIds)].map((source_record_id) => ({ edge_id: id, source_record_id })),
  };
}

function factRecord(revisionId, nodeId, key, value, sourceRecordId, validFrom = null, validTo = null) {
  const identity = `${revisionId}\0${nodeId}\0${key}\0${sourceRecordId}`;
  return { id: `fact:${createHash('sha256').update(identity).digest('hex')}`, node_id: nodeId, key, value, valid_from: validFrom, valid_to: validTo, source_record_id: sourceRecordId };
}

function rowRecords(records, fileName) {
  return records.get(fileName) ?? [];
}

function rowId(row, column) {
  return typeof row[column] === 'string' && row[column].trim() ? row[column] : null;
}

export function compileGraphRows({ revisionId, records, usageByDateOutlet = new Map() }) {
  if (typeof revisionId !== 'string' || !revisionId.startsWith('revision:') || !(records instanceof Map)) throw new TypeError('Published revision and source-record map are required.');
  const edges = [];
  const facts = [];
  const nodes = (type, externalId) => externalId ? datasetNodeId(revisionId, type, externalId) : null;
  const append = (record) => { if (record) edges.push(record); };
  const all = (fileName) => rowRecords(records, fileName);
  const currentFrom = (row, column) => row[column] || SNAPSHOT_DATE;
  const eventEnd = (row, column) => nextDate(row[column]);

  for (const [fileName, refs] of Object.entries({
    'crm_accounts.csv': [['account_owner_id', 'employee', 'account_owner'], ['champion_contact_id', 'contact', 'account_champion']],
    'crm_contacts.csv': [['account_id_saat_ini', 'account', 'contact_current_account']],
    'crm_deals.csv': [['account_id', 'account', 'deal_account'], ['owner_id', 'employee', 'deal_owner']],
    'interactions.jsonl': [['account_id', 'account', 'interaction_account'], ['membalas_id', 'interaction', 'interaction_reply']],
    'outlets.csv': [['account_id', 'account', 'outlet_account']],
    'support_tickets.csv': [['account_id', 'account', 'ticket_account'], ['outlet_id', 'outlet', 'ticket_outlet'], ['pelapor_contact_id', 'contact', 'ticket_reporter'], ['bug_id', 'bug', 'ticket_bug']],
    'bugs.csv': [['fitur_terkait', 'feature', 'bug_feature']],
    'contracts_billing.csv': [['account_id', 'account', 'contract_account'], ['decision_id', 'decision', 'contract_decision']],
    'decision_log.csv': [['account_id', 'account', 'decision_account'], ['deal_id', 'deal', 'decision_deal'], ['diputuskan_oleh', 'employee', 'decision_made_by'], ['bukti_interaction_id', 'interaction', 'decision_evidence'], ['fitur_dijanjikan', 'feature', 'decision_feature_promise']],
  })) {
    const schemaTypes = {
      'crm_accounts.csv': ['account', 'account_id'], 'crm_contacts.csv': ['contact', 'contact_id'],
      'crm_deals.csv': ['deal', 'deal_id'], 'interactions.jsonl': ['interaction', 'interaction_id'],
      'outlets.csv': ['outlet', 'outlet_id'], 'support_tickets.csv': ['ticket', 'ticket_id'],
      'bugs.csv': ['bug', 'bug_id'], 'contracts_billing.csv': ['contract', 'contract_id'],
      'decision_log.csv': ['decision', 'decision_id'],
    };
    const [sourceType, sourceColumn] = schemaTypes[fileName];
    for (const { row, recordId } of all(fileName)) {
      const from = nodes(sourceType, rowId(row, sourceColumn));
      for (const [column, targetType, relation] of refs) {
        const target = nodes(targetType, rowId(row, column));
        const start = fileName === 'crm_accounts.csv' || fileName === 'crm_contacts.csv' || fileName === 'outlets.csv'
          ? currentFrom(row, 'snapshot_date') : row.dibuat || row.tanggal || row.mulai || row.bulan || null;
        const end = null;
        append(edgeRecord(revisionId, relation, from, target, [recordId], { validFrom: start, validTo: end }));
      }
    }
  }

  for (const { row, recordId } of all('contact_employment_history.csv')) {
    const contactId = rowId(row, 'contact_id');
    const accountId = rowId(row, 'account_id');
    const validFrom = row.mulai || null;
    const validTo = eventEnd(row, 'selesai');
    const contactNode = nodes('contact', contactId);
    append(edgeRecord(revisionId, 'employment', contactNode, nodes('account', accountId), [recordId], { validFrom, validTo }));
    if (contactNode) facts.push(factRecord(revisionId, contactNode, 'employment', { accountId, organization: row.organisasi || null, jobTitle: row.jabatan || null }, recordId, validFrom, validTo));
  }

  for (const { row, recordId } of all('feature_usage_monthly.csv')) {
    const accountNode = nodes('account', rowId(row, 'account_id'));
    const featureId = rowId(row, 'feature_id');
    const featureNode = nodes('feature', featureId);
    const validFrom = row.bulan ? `${row.bulan}-01` : null;
    const month = validFrom ? new Date(`${validFrom}T00:00:00.000Z`) : null;
    if (month) month.setUTCMonth(month.getUTCMonth() + 1);
    const validTo = month?.toISOString().slice(0, 10) ?? null;
    append(edgeRecord(revisionId, 'feature_usage', accountNode, featureNode, [recordId], { validFrom, validTo }));
    if (accountNode) facts.push(factRecord(revisionId, accountNode, 'feature_usage', { featureId, month: row.bulan, activeUsers: row.pengguna_aktif === '' ? null : Number(row.pengguna_aktif) }, recordId, validFrom, validTo));
  }

  for (const { row, recordId } of all('decision_log.csv')) {
    const accountNode = nodes('account', rowId(row, 'account_id'));
    if (accountNode && row.fitur_dijanjikan) {
      facts.push(factRecord(revisionId, accountNode, 'feature_promise', {
        decisionId: row.decision_id, featureId: row.fitur_dijanjikan, promiseStatus: row.status_janji || null,
        decisionType: row.tipe || null,
      }, recordId, row.tanggal || null));
    }
  }

  const outlets = new Map(all('outlets.csv').map(({ row, recordId }) => [row.outlet_id, { row, recordId }]));
  const bugs = all('bugs.csv').map(({ row, recordId }) => ({ row, recordId }));
  for (const { row: ticket, recordId: ticketRecordId } of all('support_tickets.csv')) {
    const symptom = `${ticket.judul ?? ''} ${ticket.deskripsi ?? ''}`.normalize('NFKC').toLocaleLowerCase();
    if (ticket.status !== 'Terbuka' || !['sinkron', 'offline', 'selisih transaksi', 'penjualan hilang'].some((term) => symptom.includes(term))) continue;
    const outlet = outlets.get(ticket.outlet_id);
    if (!outlet || !['ya', 'yes', 'true', '1'].includes(String(outlet.row.mode_offline_aktif).toLocaleLowerCase())) continue;
    const sameDayUsage = usageByDateOutlet.get(`${ticket.dibuat}:${ticket.outlet_id}`);
    const offlineCount = Number(sameDayUsage?.payload?.transaksi_offline_tersinkron ?? sameDayUsage?.transaksi_offline_tersinkron ?? 0);
    if (!(offlineCount > 0) || !sameDayUsage?.sourceRecordId) continue;
    for (const bug of bugs) {
      if (ticket.versi_aplikasi !== bug.row.versi_terdampak) continue;
      const bugText = `${bug.row.judul ?? ''} ${bug.row.versi_terdampak ?? ''}`.normalize('NFKC').toLocaleLowerCase();
      if (!bugText.includes('offline') && !bugText.includes('sinkron')) continue;
      append(edgeRecord(revisionId, 'bug_candidate', nodes('ticket', ticket.ticket_id), nodes('bug', bug.row.bug_id),
        [ticketRecordId, bug.recordId, outlet.recordId, sameDayUsage.sourceRecordId], {
          relationKind: 'derived',
          reason: `Review candidate only: ticket symptom on ${ticket.versi_aplikasi} aligns with the bug version/title; outlet offline mode is active and same-day synced-offline count is ${offlineCount}. Version match alone is not causal proof.`,
          status: 'review', validFrom: ticket.dibuat || null,
        }));
    }
  }

  const uniqueEdges = new Map();
  for (const item of edges) if (!uniqueEdges.has(item.edge.id)) uniqueEdges.set(item.edge.id, item);
  return {
    edges: [...uniqueEdges.values()],
    facts,
    sourceFileCount: GRAPH_SOURCE_FILES.filter((file) => records.has(file)).length,
  };
}

async function rowsForFile(tx, revisionId, fileName) {
  const rows = await tx`
    SELECT sr.id AS record_id, sr.payload
    FROM source_records sr JOIN sources s ON s.id = sr.source_id
    WHERE s.dataset_revision_id = ${revisionId} AND s.file_name = ${fileName}
    ORDER BY sr.record_number
  `;
  return rows.map(({ record_id, payload }) => ({ recordId: record_id, row: typeof payload === 'string' ? JSON.parse(payload) : payload }));
}

async function insertRows(tx, table, columns, rows) {
  for (let offset = 0; offset < rows.length; offset += 500) {
    const batch = rows.slice(offset, offset + 500);
    const values = table === 'node_facts' ? batch.map(row => ({ ...row, value: tx.json(row.value) })) : batch;
    await tx`INSERT INTO ${tx(table)} ${tx(values, columns)}`;
  }
}

export async function compilePublishedGraph({ database, revisionId }) {
  if (typeof revisionId !== 'string' || !revisionId.startsWith('revision:')) throw new TypeError('A published dataset revision ID is required.');
  return database.begin(async (tx) => {
    await tx`SET LOCAL ROLE tessera_migrator`;
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${`graph:${revisionId}`}, 0))`;
    const [revision] = await tx`SELECT id, status FROM dataset_revisions WHERE id = ${revisionId} FOR UPDATE`;
    if (revision?.status !== 'published') throw new Error('Dataset revision must be published before graph compilation.');
    const records = new Map();
    for (const fileName of GRAPH_SOURCE_FILES) records.set(fileName, await rowsForFile(tx, revisionId, fileName));
    const usageByDateOutlet = new Map();
    const tickets = records.get('support_tickets.csv') ?? [];
    for (const { row } of tickets) {
      if (row.versi_aplikasi !== '4.12' || !row.outlet_id || !row.dibuat) continue;
      const [usage] = await tx`
        SELECT ud.source_record_id, sr.payload
        FROM usage_daily ud JOIN source_records sr ON sr.id = ud.source_record_id
        WHERE ud.dataset_revision_id = ${revisionId} AND ud.date = ${row.dibuat} AND ud.outlet_id = ${datasetNodeId(revisionId, 'outlet', row.outlet_id)}
      `;
      if (usage) usageByDateOutlet.set(`${row.dibuat}:${row.outlet_id}`, { sourceRecordId: usage.source_record_id, payload: usage.payload });
    }
    const compiled = compileGraphRows({ revisionId, records, usageByDateOutlet });
    await tx`DELETE FROM edge_sources es USING edges e WHERE es.edge_id = e.id AND e.dataset_revision_id = ${revisionId}`;
    await tx`DELETE FROM edges WHERE dataset_revision_id = ${revisionId}`;
    await tx`DELETE FROM node_facts nf USING source_records sr, sources s WHERE nf.source_record_id = sr.id AND sr.source_id = s.id AND s.dataset_revision_id = ${revisionId}`;
    const edgeRows = compiled.edges.map(({ edge }) => edge);
    const edgeSourceRows = compiled.edges.flatMap(({ sources }) => sources);
    await insertRows(tx, 'edges', EDGE_COLUMNS, edgeRows);
    await insertRows(tx, 'edge_sources', EDGE_SOURCE_COLUMNS, edgeSourceRows);
    await insertRows(tx, 'node_facts', FACT_COLUMNS, compiled.facts);
    return { revisionId, edgeCount: edgeRows.length, edgeSourceCount: edgeSourceRows.length, factCount: compiled.facts.length, status: 'compiled' };
  });
}
