import { describe, expect, it } from "vitest";
import { accounts, filterAccounts, formatMoney, sortAccounts } from "./demo-data";

describe("account list helpers", () => {
  it("filters by query and risk without mutating source", () => {
    const original = [...accounts];
    const result = filterAccounts(accounts, "nusa", "Critical");
    expect(result.map(account => account.id)).toEqual(["nusa-retail"]);
    expect(accounts).toEqual(original);
  });

  it("matches signal and evidence text", () => {
    expect(filterAccounts(accounts, "competitor", "All").map(account => account.id)).toEqual(["nusa-retail"]);
    expect(filterAccounts(accounts, "branches", "All").map(account => account.id)).toEqual(["arca-logistics", "selaras-health"]);
  });

  it("sorts by weighted value descending", () => {
    expect(sortAccounts(accounts, "weighted").map(account => account.id)).toEqual([
      "nusa-retail",
      "arca-logistics",
      "selaras-health",
    ]);
  });

  it("formats money with the account currency", () => {
    expect(formatMoney(1_500_000, "IDR")).toContain("1,500,000");
    expect(formatMoney(629_280_000, "IDR", true)).toContain("629.3M");
  });
});
