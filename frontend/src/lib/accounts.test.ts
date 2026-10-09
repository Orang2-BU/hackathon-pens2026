import { describe, expect, it } from "vitest";
import { accounts, daysToRenewal, filterAccounts, formatMoney, globalRank, leadSignal, signalFactor, sortAccounts, strongestFactor } from "./accounts";

describe("KasirNusa accounts from scoring_v1", () => {
  it("loads all 40 customers with mapped levels", () => {
    expect(accounts).toHaveLength(40);
    expect(new Set(accounts.map(account => account.riskLevel))).toEqual(new Set(["Critical", "High", "Medium", "Low"]));
  });

  it("puts C03 in the top three by priority score (QA criterion, docs/09 §6)", () => {
    const top3 = [...accounts].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3).map(account => account.id);
    expect(top3).toContain("C03");
  });

  it("finds BUG-412 accounts through their signals", () => {
    expect(filterAccounts(accounts, "BUG-412", "All").map(account => account.id).sort()).toEqual(["C03", "C05"]);
  });

  it("sorts purely by the chosen key; focus is a separate flag, not a pin", () => {
    const scores = sortAccounts(accounts, "risk").map(account => account.priorityScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(accounts.filter(account => account.focus).map(account => account.id).sort()).toEqual(["C01", "C02", "C03", "C04", "C05", "C06"]);
  });

  it("ranks all 40 accounts globally by priority score", () => {
    expect(globalRank.get("C01")).toBe(1);
    expect(globalRank.size).toBe(40);
  });

  it("picks the factor with the largest weighted contribution", () => {
    expect(strongestFactor({ factorScores: { Usage: 10, Service: 0, Champion: 100, Commitments: 0, Payment: 0 } })).toBe("Champion");
  });

  it("maps each scoring_v1 signal to the parameter it measures", () => {
    expect(signalFactor("Champion Rina Hapsari moved to Grup Ritel Mandala (since 2026-09-01); CRM not updated")).toBe("Champion");
    expect(signalFactor("6 support tickets still open, 6 match the offline-sync/BUG-412 pattern (derived)")).toBe("Service");
    expect(signalFactor("1 outlets in active offline mode (exposed to sync issues)")).toBe("Service");
    expect(signalFactor("Transactions per day down 12% (last 90 days vs prior 90 days)")).toBe("Usage");
    expect(signalFactor("1 unkept commitments (FEAT-07)")).toBe("Commitments");
    expect(signalFactor("100 days without inbound customer contact")).toBe("Commitments");
    expect(signalFactor("Late payment 1x in the last 12 months")).toBe("Payment");
  });

  it("maps every signal in the current export, so a wording change fails here", () => {
    const unmapped = accounts.flatMap(account => account.signals).filter(signal => !signalFactor(signal));
    expect(unmapped).toEqual([]);
  });

  it("leads C01 with the champion signal, its strongest factor", () => {
    const c01 = accounts.find(account => account.id === "C01");
    expect(c01 && leadSignal(c01)).toMatch(/Champion/);
  });

  it("counts renewal days from the snapshot; C04 is the nearest renewal", () => {
    const nearest = [...accounts].sort((a, b) => daysToRenewal(a) - daysToRenewal(b))[0];
    expect(nearest.id).toBe("C04");
    expect(daysToRenewal(nearest)).toBe(35);
  });

  it("formats money in standard and compact form", () => {
    expect(formatMoney(1_500_000, "IDR")).toContain("1,500,000");
    expect(formatMoney(629_280_000, "IDR", true)).toContain("629.3M");
  });
});
