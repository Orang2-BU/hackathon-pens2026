import { it, expect } from "vitest";
import { renewalExposure } from "./exposure";
import type { AccountSummary } from "./workspace";

const acct = (id: string, level: string, renewalDate: string | null, annualValueIdr: number | null) =>
  ({ id, businessAsOf: "2026-10-01", renewalDate, annualValueIdr, priority: { level } }) as AccountSummary;

it("buckets renewal value by month and sums only elevated accounts renewing within 90 days", () => {
  const r = renewalExposure([
    acct("C01", "Critical", "2026-12-15", 150), // 75 days, elevated
    acct("C02", "Low", "2026-10-20", 40),
    acct("C03", "High", "2027-02-10", 90), // elevated but beyond 90 days
    acct("C04", "High", "2026-09-01", 70), // already passed
    acct("C05", "Critical", "2026-11-01", null), // value unknown
  ], 6);
  expect(r.months.map(m => m.key)).toEqual(["2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"]);
  expect(r.months.find(m => m.key === "2026-12")).toEqual({ key: "2026-12", atRisk: 150, other: 0, accounts: 1 });
  expect(r.months.find(m => m.key === "2026-10")?.other).toBe(40);
  expect(r.atRisk90).toBe(150);
  expect(r.accountsAtRisk90).toBe(1);
  expect(r.missingValue).toBe(1);
});
