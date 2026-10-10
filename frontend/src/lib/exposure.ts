import { elevated, renewalDays, type AccountSummary } from "./workspace";

type Month = { key: string; atRisk: number; other: number; accounts: number };

// Contract value up for renewal, bucketed by month from the snapshot. Sums real contracts; it is exposure, not a forecast.
export function renewalExposure(accounts: AccountSummary[], months = 6) {
  const start = accounts[0]?.businessAsOf ?? "";
  const keys = Array.from({ length: months }, (_, i) => {
    const d = new Date(`${start.slice(0, 7)}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + i);
    return d.toISOString().slice(0, 7);
  });
  const buckets = new Map<string, Month>(keys.map(key => [key, { key, atRisk: 0, other: 0, accounts: 0 }]));
  let atRisk90 = 0, accountsAtRisk90 = 0, missingValue = 0;
  for (const a of accounts) {
    const days = renewalDays(a);
    if (days === null || days < 0) continue;
    if (a.annualValueIdr === null) { missingValue++; continue; }
    const bucket = buckets.get(a.renewalDate?.slice(0, 7) ?? "");
    if (bucket) {
      bucket.accounts++;
      if (elevated(a)) bucket.atRisk += a.annualValueIdr; else bucket.other += a.annualValueIdr;
    }
    if (days <= 90 && elevated(a)) { atRisk90 += a.annualValueIdr; accountsAtRisk90++; }
  }
  return { months: [...buckets.values()], atRisk90, accountsAtRisk90, missingValue };
}
