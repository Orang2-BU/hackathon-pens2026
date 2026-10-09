import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';
import { parseCsv, validateHeader } from './csv.js';

const DATASET = {
  'crm_accounts.csv': { columns: 'account_id,nama,tipe,industri,kota,paket,jumlah_outlet,account_owner_id,champion_contact_id,nps_terakhir,health_score_dashboard', id: 'account_id', refs: { account_owner_id: 'employees', champion_contact_id: 'contacts' } },
  'crm_contacts.csv': { columns: 'contact_id,nama,email,account_id_saat_ini,jabatan_saat_ini', id: 'contact_id', refs: { account_id_saat_ini: 'accounts' } },
  'contact_employment_history.csv': { columns: 'contact_id,account_id,organisasi,jabatan,mulai,selesai', id: null, refs: { contact_id: 'contacts', account_id: 'accounts' }, dates: ['mulai', 'selesai'] },
  'crm_deals.csv': { columns: 'deal_id,account_id,tipe,stage,stage_sejak,dibuat,owner_id,outlet,nilai_tahunan,status,alasan_kalah,kompetitor', id: 'deal_id', refs: { account_id: 'accounts', owner_id: 'employees' }, dates: ['stage_sejak', 'dibuat'], numbers: ['nilai_tahunan'] },
  'employees.csv': { columns: 'employee_id,nama,jabatan,email', id: 'employee_id' },
  'interactions.jsonl': { columns: 'interaction_id,tanggal,tipe,account_id,dari,ke,peserta,subjek,isi,membalas_id', id: 'interaction_id', refs: { account_id: 'accounts' }, dates: ['tanggal'], foreignLater: { membalas_id: 'interactions' } },
  'outlets.csv': { columns: 'outlet_id,account_id,kota,mode_offline_aktif', id: 'outlet_id', refs: { account_id: 'accounts' } },
  'product_usage_daily.csv': { columns: 'tanggal,outlet_id,account_id,versi_aplikasi,jumlah_transaksi,transaksi_offline_tersinkron', id: null, refs: { outlet_id: 'outlets', account_id: 'accounts' }, dates: ['tanggal'], numbers: ['jumlah_transaksi', 'transaksi_offline_tersinkron'] },
  'feature_usage_monthly.csv': { columns: 'bulan,account_id,feature_id,pengguna_aktif', id: null, refs: { account_id: 'accounts', feature_id: 'features' }, months: ['bulan'], numbers: ['pengguna_aktif'] },
  'support_tickets.csv': { columns: 'ticket_id,dibuat,account_id,outlet_id,pelapor_contact_id,kategori,prioritas,status,versi_aplikasi,judul,deskripsi,bug_id,diselesaikan', id: 'ticket_id', refs: { account_id: 'accounts', outlet_id: 'outlets', pelapor_contact_id: 'contacts', bug_id: 'bugs' }, dates: ['dibuat', 'diselesaikan'] },
  'bugs.csv': { columns: 'bug_id,judul,versi_terdampak,status,dibuat,selesai,fitur_terkait', id: 'bug_id', refs: { fitur_terkait: 'features' }, dates: ['dibuat', 'selesai'] },
  'releases.csv': { columns: 'versi,tanggal_rilis', id: 'versi', dates: ['tanggal_rilis'] },
  'features.csv': { columns: 'feature_id,nama,status,target_awal,target_terkini,catatan', id: 'feature_id' },
  'contracts_billing.csv': { columns: 'contract_id,account_id,paket,outlet_kontrak,batas_outlet_paket,mulai,tanggal_renewal,harga_per_outlet_bulan,diskon_pct,nilai_tahunan,keterlambatan_bayar_12bln,decision_id', id: 'contract_id', refs: { account_id: 'accounts', decision_id: 'decisions' }, dates: ['mulai', 'tanggal_renewal'], numbers: ['outlet_kontrak', 'harga_per_outlet_bulan', 'diskon_pct', 'nilai_tahunan', 'keterlambatan_bayar_12bln'] },
  'decision_log.csv': { columns: 'decision_id,tanggal,tipe,account_id,deal_id,diminta_oleh,diputuskan_oleh,keputusan,nilai,alasan,bukti_interaction_id,fitur_dijanjikan,status_janji', id: 'decision_id', refs: { account_id: 'accounts', deal_id: 'deals', diputuskan_oleh: 'employees', bukti_interaction_id: 'interactions', fitur_dijanjikan: 'features' }, dates: ['tanggal'] },
};

const EXPECTED_COUNTS = {
  'crm_accounts.csv': 45,
  'crm_contacts.csv': 160,
  'contact_employment_history.csv': 217,
  'crm_deals.csv': 22,
  'employees.csv': 10,
  'interactions.jsonl': 350,
  'outlets.csv': 620,
  'product_usage_daily.csv': 226300,
  'feature_usage_monthly.csv': 1178,
  'support_tickets.csv': 640,
  'bugs.csv': 4,
  'releases.csv': 3,
  'features.csv': 8,
  'contracts_billing.csv': 40,
  'decision_log.csv': 30,
};

const PRIMARY_IDS = {
  'crm_accounts.csv': 'accounts', 'crm_contacts.csv': 'contacts', 'employees.csv': 'employees',
  'outlets.csv': 'outlets', 'bugs.csv': 'bugs', 'features.csv': 'features',
  'crm_deals.csv': 'deals', 'decision_log.csv': 'decisions', 'interactions.jsonl': 'interactions',
};

async function* parseJsonLines(source) {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let pending = '';
  let first = true;
  for await (const chunk of source) {
    const data = pending + decoder.decode(chunk, { stream: true });
    const lines = data.split(/\r?\n/u);
    pending = lines.pop();
    for (let line of lines) {
      if (first) {
        first = false;
        line = line.replace(/^\uFEFF/u, '');
      }
      if (line.trim()) yield JSON.parse(line);
    }
  }
  pending += decoder.decode();
  if (first) pending = pending.replace(/^\uFEFF/u, '');
  if (pending.trim()) yield JSON.parse(pending);
}

async function* rowsFor(filePath, fileName) {
  const source = createReadStream(filePath);
  if (fileName.endsWith('.jsonl')) {
    for await (const value of parseJsonLines(source)) yield value;
    return;
  }
  let header;
  for await (const row of parseCsv(source)) {
    if (!header) {
      header = row;
      validateHeader(header, DATASET[fileName].columns.split(','), fileName);
      continue;
    }
    if (row.length !== header.length) throw new Error(`${fileName}: record has an unexpected number of fields.`);
    yield Object.fromEntries(header.map((name, index) => [name, row[index]]));
  }
  if (!header) throw new Error(`${fileName}: file is empty.`);
}

function dateIsValid(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function addIssue(report, issue) {
  report.issueCount += 1;
  if (report.issues.length < 100) report.issues.push(issue);
}

async function collectIds(directory, report) {
  const ids = Object.fromEntries(Object.values(PRIMARY_IDS).map((name) => [name, new Set()]));
  const outletAccounts = new Map();
  for (const [fileName, setName] of Object.entries(PRIMARY_IDS)) {
    try {
      let recordNumber = 0;
      for await (const row of rowsFor(join(directory, fileName), fileName)) {
        recordNumber += 1;
        const id = row[DATASET[fileName].id];
        if (!id) continue;
        ids[setName].add(id);
        if (fileName === 'outlets.csv') outletAccounts.set(id, row.account_id);
      }
    } catch (error) {
      addIssue(report, { file: fileName, code: 'INVALID_FILE', message: error.message });
    }
  }
  ids.outletAccounts = outletAccounts;
  return ids;
}

function validateRecord(fileName, row, recordNumber, ids, report) {
  const schema = DATASET[fileName];
  const id = schema.id ? row[schema.id] : null;
  if (schema.id && !id) addIssue(report, { file: fileName, record: recordNumber, code: 'MISSING_PRIMARY_ID' });
  for (const column of schema.dates ?? []) {
    const value = row[column];
    if (value && !dateIsValid(value)) addIssue(report, { file: fileName, record: recordNumber, code: 'INVALID_DATE', column });
  }
  for (const column of schema.months ?? []) {
    const value = row[column];
    if (value && (!/^\d{4}-(0[1-9]|1[0-2])$/u.test(value))) addIssue(report, { file: fileName, record: recordNumber, code: 'INVALID_MONTH', column });
  }
  for (const column of schema.numbers ?? []) {
    const value = row[column];
    if (value && !/^-?\d+(\.\d+)?$/u.test(value)) addIssue(report, { file: fileName, record: recordNumber, code: 'INVALID_NUMBER', column });
  }
  for (const [column, setName] of Object.entries(schema.refs ?? {})) {
    const value = row[column];
    if (value && !ids[setName]?.has(value)) {
      report.orphanCount += 1;
      if (report.orphans.length < 100) report.orphans.push({ file: fileName, record: recordNumber, column });
    }
  }
  if (schema.foreignLater) {
    for (const [column, setName] of Object.entries(schema.foreignLater)) {
      if (row[column] && !ids[setName]?.has(row[column])) {
        report.orphanCount += 1;
        if (report.orphans.length < 100) report.orphans.push({ file: fileName, record: recordNumber, column });
      }
    }
  }
  if (fileName === 'product_usage_daily.csv' && row.outlet_id && row.account_id && ids.outletAccounts.get(row.outlet_id) !== row.account_id) {
    addIssue(report, { file: fileName, record: recordNumber, code: 'OUTLET_ACCOUNT_MISMATCH' });
  }
  if (fileName === 'interactions.jsonl') {
    const keys = Object.keys(row).sort();
    const expected = schema.columns.split(',').sort();
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
      addIssue(report, { file: fileName, record: recordNumber, code: 'INVALID_JSONL_SCHEMA' });
    }
  }
}

export async function inspectDataset(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const names = entries.map((entry) => entry.name).sort();
  const nonRegularEntries = new Set(entries.filter((entry) => !entry.isFile() && entry.name !== 'README.md').map((entry) => entry.name));
  const dataNames = names.filter((name) => DATASET[name]);
  const expectedNames = Object.keys(DATASET).sort();
  const report = { files: [], issueCount: 0, issues: [], orphanCount: 0, orphans: [], datasetHash: null };
  if (names.some((name) => !DATASET[name] && name !== 'README.md') || nonRegularEntries.size > 0 || dataNames.length !== expectedNames.length || dataNames.some((name, index) => name !== expectedNames[index])) {
    const unexpected = [...names.filter((name) => !DATASET[name] && name !== 'README.md'), ...nonRegularEntries];
    const missing = expectedNames.filter((name) => !dataNames.includes(name));
    addIssue(report, { code: 'FILE_ALLOWLIST_MISMATCH', unexpected, missing });
  }

  const ids = await collectIds(directory, report);
  const datasetHash = createHash('sha256');
  for (const fileName of expectedNames) {
    const filePath = join(directory, fileName);
    try {
      const sha256 = await hashFile(filePath);
      const stats = { file: fileName, records: 0, sha256 };
      let recordNumber = 0;
      const seenIds = new Set();
      for await (const row of rowsFor(filePath, fileName)) {
        recordNumber += 1;
        validateRecord(fileName, row, recordNumber, ids, report);
        const idColumn = DATASET[fileName].id;
        if (idColumn && row[idColumn]) {
          if (seenIds.has(row[idColumn])) addIssue(report, { file: fileName, record: recordNumber, code: 'DUPLICATE_ID' });
          seenIds.add(row[idColumn]);
        }
      }
      stats.records = recordNumber;
      report.files.push(stats);
      datasetHash.update(`${fileName}\0${sha256}\n`);
      if (EXPECTED_COUNTS[fileName] !== recordNumber) {
        addIssue(report, { file: fileName, code: 'ROW_COUNT_DRIFT', expected: EXPECTED_COUNTS[fileName], actual: recordNumber });
      }
    } catch (error) {
      addIssue(report, { file: fileName, code: 'INVALID_FILE', message: error.message });
    }
  }
  report.datasetHash = datasetHash.digest('hex');
  return report;
}
