import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileGraphRows } from '../src/graph-compiler.js';

const revisionId = `revision:${'a'.repeat(64)}`;

test('hard relations retain exact source rows and snapshot identities are revision-scoped', () => {
  const records = new Map([
    ['crm_contacts.csv', [{ recordId: 'source-contact:r1', row: { contact_id: 'K017', account_id_saat_ini: 'P01' } }]],
    ['crm_accounts.csv', [{ recordId: 'source-account:r1', row: { account_id: 'C01', account_owner_id: 'E03', champion_contact_id: 'K017' } }]],
    ['employees.csv', [{ recordId: 'source-employees:r1', row: { employee_id: 'E03' } }]],
  ]);
  const graph = compileGraphRows({ revisionId, records });
  const contactAccount = graph.edges.find(({ edge }) => edge.type === 'contact_current_account');
  assert.equal(contactAccount.edge.source_node_id, `node:${revisionId}:contact:K017`);
  assert.equal(contactAccount.edge.target_node_id, `node:${revisionId}:account:P01`);
  assert.equal(contactAccount.edge.relation_kind, 'hard');
  assert.deepEqual(contactAccount.sources, [{ edge_id: contactAccount.edge.id, source_record_id: 'source-contact:r1' }]);
  assert.ok(graph.edges.some(({ edge }) => edge.type === 'account_champion' && edge.target_node_id === `node:${revisionId}:contact:K017`));
  assert.ok(graph.edges.some(({ edge }) => edge.type === 'account_owner' && edge.target_node_id === `node:${revisionId}:employee:E03`));
});

test('employment and monthly feature usage facts preserve exclusive temporal boundaries and provenance', () => {
  const records = new Map([
    ['contact_employment_history.csv', [{ recordId: 'employment:r1', row: { contact_id: 'K017', account_id: 'C01', organisasi: 'Kopi', jabatan: 'Direktur', mulai: '2024-01-01', selesai: '2025-12-31' } }]],
    ['feature_usage_monthly.csv', [{ recordId: 'feature-usage:r1', row: { bulan: '2026-09', account_id: 'C01', feature_id: 'FEAT-07', pengguna_aktif: '8' } }]],
    ['decision_log.csv', [{ recordId: 'decision:r1', row: { decision_id: 'D01', account_id: 'C01', tanggal: '2026-08-01', fitur_dijanjikan: 'FEAT-07', status_janji: 'Belum ditepati' } }]],
  ]);
  const graph = compileGraphRows({ revisionId, records });
  const employment = graph.edges.find(({ edge }) => edge.type === 'employment');
  assert.equal(employment.edge.valid_from, '2024-01-01');
  assert.equal(employment.edge.valid_to, '2026-01-01');
  const usage = graph.edges.find(({ edge }) => edge.type === 'feature_usage');
  assert.equal(usage.edge.valid_from, '2026-09-01');
  assert.equal(usage.edge.valid_to, '2026-10-01');
  assert.equal(graph.facts.length, 3);
  assert.ok(graph.facts.every((fact) => fact.source_record_id));
});

test('BUG-412 candidate needs matching symptom, offline outlet and same-day usage and remains review-only', () => {
  const records = new Map([
    ['support_tickets.csv', [{ recordId: 'ticket:r1', row: { ticket_id: 'T1', account_id: 'C03', outlet_id: 'C03-O01', status: 'Terbuka', versi_aplikasi: '4.12', dibuat: '2026-09-13', judul: 'Sinkronisasi gagal', deskripsi: '' } }]],
    ['outlets.csv', [{ recordId: 'outlet:r1', row: { outlet_id: 'C03-O01', account_id: 'C03', mode_offline_aktif: 'ya' } }]],
    ['bugs.csv', [
      { recordId: 'bug412:r1', row: { bug_id: 'BUG-412', versi_terdampak: '4.12', judul: 'Offline tidak tersinkron' } },
      { recordId: 'bug415:r1', row: { bug_id: 'BUG-415', versi_terdampak: '4.12', judul: 'Ekspor CSV timeout' } },
    ]],
  ]);
  const usageByDateOutlet = new Map([['2026-09-13:C03-O01', { sourceRecordId: 'usage:r1', payload: { transaksi_offline_tersinkron: '5' } }]]);
  const graph = compileGraphRows({ revisionId, records, usageByDateOutlet });
  const candidate = graph.edges.filter(({ edge }) => edge.type === 'bug_candidate');
  assert.equal(candidate.length, 1);
  assert.equal(candidate[0].edge.target_node_id, `node:${revisionId}:bug:BUG-412`);
  assert.equal(candidate[0].edge.relation_kind, 'derived');
  assert.equal(candidate[0].edge.status, 'review');
  assert.match(candidate[0].edge.reason, /not causal proof/u);
  assert.equal(candidate[0].sources.length, 4);

  const noUsage = compileGraphRows({ revisionId, records });
  assert.equal(noUsage.edges.some(({ edge }) => edge.type === 'bug_candidate'), false);
  const wrongSymptom = new Map(records);
  wrongSymptom.set('support_tickets.csv', [{ recordId: 'ticket:r2', row: { ...records.get('support_tickets.csv')[0].row, judul: 'Laporan tidak sesuai' } }]);
  assert.equal(compileGraphRows({ revisionId, records: wrongSymptom, usageByDateOutlet }).edges.some(({ edge }) => edge.type === 'bug_candidate'), false);
});
