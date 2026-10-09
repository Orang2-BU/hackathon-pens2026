import { describe, expect, it } from "vitest";
import { accounts, filterAccounts, formatMoney, leadSignal, signalFactor, sortAccounts, strongestFactor } from "./accounts";

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

  it("pins focus accounts C01–C06 above the rest whatever the sort", () => {
    const ids = sortAccounts(accounts, "renewal").map(account => account.id);
    expect(ids.slice(0, 6).sort()).toEqual(["C01", "C02", "C03", "C04", "C05", "C06"]);
  });

  it("picks the factor with the largest weighted contribution", () => {
    expect(strongestFactor({ factorScores: { Usage: 10, Service: 0, Champion: 100, Commitments: 0, Payment: 0 } })).toBe("Champion");
  });

  it("maps each scoring_v1 signal to the parameter it measures", () => {
    expect(signalFactor("Champion Rina Hapsari pindah ke Grup Ritel Mandala")).toBe("Champion");
    expect(signalFactor("6 tiket masih terbuka, 6 terkait BUG-412")).toBe("Service");
    expect(signalFactor("1 outlet mode offline aktif (rawan isu sinkronisasi)")).toBe("Service");
    expect(signalFactor("Transaksi/hari turun 12%")).toBe("Usage");
    expect(signalFactor("1 janji belum ditepati (FEAT-07)")).toBe("Commitments");
    expect(signalFactor("100 hari tanpa kontak masuk dari pelanggan")).toBe("Commitments");
    expect(signalFactor("Riwayat telat bayar 1x dalam 12 bulan")).toBe("Payment");
  });

  it("leads C01 with the champion signal, its strongest factor", () => {
    const c01 = accounts.find(account => account.id === "C01");
    expect(c01 && leadSignal(c01)).toMatch(/Champion/);
  });

  it("formats money in standard and compact form", () => {
    expect(formatMoney(1_500_000, "IDR")).toContain("1,500,000");
    expect(formatMoney(629_280_000, "IDR", true)).toContain("629.3M");
  });
});
