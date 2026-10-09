import { inspectDataset, readDatasetRows } from './dataset.js';
import { createSensitivityReport, deriveRiskFactors, rankScores, SCORING_EXPERIMENT, scoreAccount } from './scoring.js';

const DAY_MS = 86_400_000;

function shiftDate(date, days) {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function dayDifference(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`)) / DAY_MS);
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function collect(directory, fileName) {
  const rows = [];
  for await (const row of readDatasetRows(directory, fileName)) rows.push(row);
  return rows;
}

export async function scoreDataset(directory, businessAsOf = SCORING_EXPERIMENT.businessAsOf) {
  const validation = await inspectDataset(directory);
  if (validation.issueCount > 0) throw new Error(`Dataset validation failed with ${validation.issueCount} issue(s).`);
  const sourceHashByFile = new Map(validation.files.map(({ file, sha256 }) => [file, sha256]));
  const [accounts, contacts, employment, contracts, outlets, tickets, decisions, interactions] = await Promise.all([
    collect(directory, 'crm_accounts.csv'),
    collect(directory, 'crm_contacts.csv'),
    collect(directory, 'contact_employment_history.csv'),
    collect(directory, 'contracts_billing.csv'),
    collect(directory, 'outlets.csv'),
    collect(directory, 'support_tickets.csv'),
    collect(directory, 'decision_log.csv'),
    collect(directory, 'interactions.jsonl'),
  ]);

  const customers = accounts.filter((account) => account.tipe === 'pelanggan');
  const customerIds = new Set(customers.map(({ account_id }) => account_id));
  const outletById = new Map(outlets.map((outlet) => [outlet.outlet_id, outlet]));
  const outletsByAccount = new Map(customers.map(({ account_id }) => [account_id, []]));
  for (const outlet of outlets) if (outletsByAccount.has(outlet.account_id)) outletsByAccount.get(outlet.account_id).push(outlet);
  const ticketsByAccount = new Map(customers.map(({ account_id }) => [account_id, []]));
  const excludedOutletEvidence = new Map(customers.map(({ account_id }) => [account_id, []]));
  const recentStart = shiftDate(businessAsOf, -90);
  const previousStart = shiftDate(businessAsOf, -180);

  for (const ticket of tickets) {
    if (!ticketsByAccount.has(ticket.account_id)) continue;
    ticketsByAccount.get(ticket.account_id).push(ticket);
    const outlet = outletById.get(ticket.outlet_id);
    const recent = ticket.dibuat >= recentStart && ticket.dibuat < businessAsOf;
    const syncEvidence = /offline|sinkron|selisih transaksi/iu.test(`${ticket.judul} ${ticket.deskripsi}`);
    if (ticket.status === 'Terbuka' && recent && outlet?.mode_offline_aktif === 'ya' && syncEvidence) {
      excludedOutletEvidence.get(ticket.account_id).push({ outletId: ticket.outlet_id, ticketId: ticket.ticket_id });
    }
  }

  const contractsByAccount = new Map(customers.map(({ account_id }) => [account_id, null]));
  for (const contract of contracts) if (contractsByAccount.has(contract.account_id)) contractsByAccount.set(contract.account_id, contract);
  const decisionsByAccount = new Map(customers.map(({ account_id }) => [account_id, []]));
  for (const decision of decisions) if (decisionsByAccount.has(decision.account_id)) decisionsByAccount.get(decision.account_id).push(decision);
  const interactionsByAccount = new Map(customers.map(({ account_id }) => [account_id, []]));
  for (const interaction of interactions) {
    if (interaction.tipe === 'email_internal' || !interactionsByAccount.has(interaction.account_id)) continue;
    if (interaction.tanggal < businessAsOf) interactionsByAccount.get(interaction.account_id).push(interaction);
  }

  const contactsById = new Map(contacts.map((contact) => [contact.contact_id, contact]));
  const employmentByContact = new Map();
  for (const job of employment) {
    const list = employmentByContact.get(job.contact_id) ?? [];
    list.push(job);
    employmentByContact.set(job.contact_id, list);
  }

  const usageByAccount = new Map(customers.map(({ account_id }) => [account_id, {
    recentTransactions: 0, previousTransactions: 0,
    recentObserved: 0, previousObserved: 0,
    recentRows: 0, previousRows: 0,
  }]));
  const excludedOutletSets = new Map(customers.map(({ account_id }) => [account_id,
    new Set(excludedOutletEvidence.get(account_id).map(({ outletId }) => outletId))]));
  for await (const usage of readDatasetRows(directory, 'product_usage_daily.csv')) {
    if (!customerIds.has(usage.account_id) || excludedOutletSets.get(usage.account_id).has(usage.outlet_id)) continue;
    const bucket = usage.tanggal >= recentStart && usage.tanggal < businessAsOf ? 'recent'
      : usage.tanggal >= previousStart && usage.tanggal < recentStart ? 'previous' : null;
    if (!bucket) continue;
    const totals = usageByAccount.get(usage.account_id);
    totals[`${bucket}Rows`] += 1;
    const transactions = numberOrNull(usage.jumlah_transaksi);
    if (transactions !== null) {
      totals[`${bucket}Observed`] += 1;
      totals[`${bucket}Transactions`] += transactions;
    }
  }

  const results = [];
  for (const account of customers) {
    const accountId = account.account_id;
    const contract = contractsByAccount.get(accountId);
    const accountOutlets = outletsByAccount.get(accountId);
    const excluded = excludedOutletSets.get(accountId);
    const expectedUsageDays = Math.max(0, accountOutlets.length - excluded.size) * 90;
    const usage = usageByAccount.get(accountId);
    const recentCoverage = expectedUsageDays ? usage.recentObserved / expectedUsageDays : 0;
    const previousCoverage = expectedUsageDays ? usage.previousObserved / expectedUsageDays : 0;
    const relativeChange = usage.previousTransactions > 0
      ? (usage.recentTransactions - usage.previousTransactions) / usage.previousTransactions : null;
    const usageEvidence = [{ file: 'product_usage_daily.csv', sha256: sourceHashByFile.get('product_usage_daily.csv'), period: [previousStart, businessAsOf], excludedOutlets: [...excluded], exclusionTickets: excludedOutletEvidence.get(accountId) }];

    const openTickets = ticketsByAccount.get(accountId).filter((ticket) => ticket.status === 'Terbuka' && ticket.dibuat < businessAsOf);
    const maxOpenTicketAgeDays = openTickets.reduce((maximum, ticket) => Math.max(maximum, dayDifference(ticket.dibuat, businessAsOf)), 0);
    const service = {
      openTicketCount: openTickets.length,
      maxOpenTicketAgeDays,
      evidence: openTickets.map(({ ticket_id }) => ({ file: 'support_tickets.csv', recordId: ticket_id })),
    };

    const championId = account.champion_contact_id;
    const championContact = contactsById.get(championId);
    const activeJobs = (employmentByContact.get(championId) ?? []).filter((job) => !job.selesai);
    let championStillThere = null;
    if (championContact && activeJobs.length) championStillThere = activeJobs.some((job) => job.account_id === accountId);
    else if (championContact?.account_id_saat_ini) championStillThere = championContact.account_id_saat_ini === accountId;
    const champion = {
      left: championStillThere === null ? null : !championStillThere,
      contactId: championId || null,
      activeEmploymentAccountIds: activeJobs.map((job) => job.account_id || null),
      evidence: [
        ...(championId ? [{ file: 'crm_accounts.csv', recordId: accountId }] : []),
        ...(championId ? [{ file: 'crm_contacts.csv', recordId: championId }] : []),
        ...(activeJobs.length ? [{ file: 'contact_employment_history.csv', recordId: championId }] : []),
      ],
    };

    const accountDecisions = decisionsByAccount.get(accountId);
    const promiseRows = accountDecisions.filter((row) => row.tipe === 'janji_fitur' && row.status_janji);
    const unmetPromiseCount = promiseRows.length ? promiseRows.filter((row) => row.status_janji === 'Belum ditepati').length : null;
    const externalInteractions = interactionsByAccount.get(accountId);
    const lastInteraction = externalInteractions.reduce((latest, row) => !latest || row.tanggal > latest.tanggal ? row : latest, null);
    const daysSinceExternalInteraction = lastInteraction ? dayDifference(lastInteraction.tanggal, businessAsOf) : null;
    const promiseEngagement = {
      unmetPromiseCount,
      daysSinceExternalInteraction,
      evidence: [
        ...promiseRows.map(({ decision_id }) => ({ file: 'decision_log.csv', recordId: decision_id })),
        ...(lastInteraction ? [{ file: 'interactions.jsonl', recordId: lastInteraction.interaction_id }] : []),
      ],
    };

    const latePaymentCount = numberOrNull(contract?.keterlambatan_bayar_12bln);
    const payment = {
      latePaymentCount,
      contractId: contract?.contract_id ?? null,
      evidence: contract ? [{ file: 'contracts_billing.csv', recordId: contract.contract_id }] : [],
    };
    const metrics = {
      usage: {
        recentTransactions: usage.recentTransactions,
        previousTransactions: usage.previousTransactions,
        relativeChange,
        coverageRecent: recentCoverage,
        coveragePrevious: previousCoverage,
        expectedUsageDays,
        unavailableOutlets: excluded.size,
        evidence: usageEvidence,
        ...(relativeChange === null ? { reason: 'Previous-period transaction baseline is zero or missing.' } : {}),
      },
      service,
      champion,
      promiseEngagement,
      payment,
    };
    const factors = deriveRiskFactors(metrics);
    const scored = scoreAccount({ accountId, factors, annualValue: numberOrNull(contract?.nilai_tahunan) });
    results.push({
      ...scored,
      metrics,
      context: {
        dashboardLabel: account.health_score_dashboard || null,
        nps: numberOrNull(account.nps_terakhir),
        renewalDate: contract?.tanggal_renewal ?? null,
        renewalDays: contract?.tanggal_renewal ? dayDifference(businessAsOf, contract.tanggal_renewal) : null,
        mismatch: null,
        mismatchReason: 'Dashboard/priority level mapping is not approved.',
      },
    });
  }

  const ranking = rankScores(results);
  return {
    synthetic: true,
    datasetHash: validation.datasetHash,
    businessAsOf,
    formulaVersion: SCORING_EXPERIMENT.formulaVersion,
    experiment: SCORING_EXPERIMENT,
    customerCount: results.length,
    ranking,
    sensitivity: createSensitivityReport(results),
    qa: {
      c03InTopThree: ranking.slice(0, 3).some(({ accountId }) => accountId === 'C03'),
      c04RenewalDays: results.find(({ accountId }) => accountId === 'C04')?.context.renewalDays ?? null,
      c01C05MismatchEvaluated: false,
      c01C05MismatchReason: 'Level cutoffs and dashboard-label mapping are still hypotheses.',
    },
  };
}
