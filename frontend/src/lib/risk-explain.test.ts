import { it, expect } from "vitest";
import { evidenceRefs, explainFactor, topDrivers } from "./risk-explain";
import type { AccountDetail } from "./workspace";

const param = (factor: string, normalizedValue: number | string | null, rawValue: unknown, evidence: unknown = []) =>
  ({ factor, normalizedValue, rawValue, evidence, status: "available", reason: null, unit: null, period: { start: null, end: null } }) as AccountDetail["parameters"][number];

it("explains measured factors in plain sentences and abstains when data is missing", () => {
  expect(explainFactor(param("usage", 0.4, { previousTransactions: 1200, recentTransactions: 720, relativeChange: -0.4 }))).toBe("Transactions went from 1,200 to 720 versus the previous 90 days (-40%).");
  expect(explainFactor(param("service", 0.5, { openTicketCount: 2, maxOpenTicketAgeDays: 31 }))).toBe("2 support tickets are still open; the oldest has waited 31 days.");
  expect(explainFactor(param("champion", 1, { left: true, contactId: "K07" }))).toBe("The champion contact (K07) no longer works at this account.");
  expect(explainFactor(param("promiseEngagement", 0.6, { unmetPromiseCount: 1, daysSinceExternalInteraction: 40 }))).toBe("1 feature commitment not yet kept; last customer conversation 40 days ago.");
  expect(explainFactor(param("usage", null, null))).toBeNull();
});

it("ranks only factors that raise priority and dedupes evidence", () => {
  // Shapes from the live C01 response: numeric strings, and a 0.0006 usage change that rounds to 0 / 100.
  const ps = [param("payment", "0.0000", {}), param("usage", "0.0006", {}), param("promiseEngagement", "0.5333", {}), param("champion", "1.0000", {}), param("service", null, {})];
  expect(topDrivers(ps).map(p => p.factor)).toEqual(["champion", "promiseEngagement"]);
  expect(evidenceRefs(param("service", 1, {}, [{ file: "a.csv", recordId: "T1" }, { file: "a.csv", recordId: "T1" }, { file: "b.csv" }]))).toEqual([{ file: "a.csv", recordId: "T1" }]);
});
