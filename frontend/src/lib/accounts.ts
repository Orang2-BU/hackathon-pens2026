import scores from "../../../ingest/scores_40_v1.json";

// Source: ingest/scoring_v1.py output, KasirNusa synthetic dataset, snapshot 1 Oct 2026.
export const SNAPSHOT = "2026-10-01";
export const SCORING_VERSION = "scoring_v1";

export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

// Risk parameters and weights from docs/10-DATA-PROFILE-KASIRNUSA.md.
export const riskFactors = ["Usage", "Service", "Champion", "Commitments", "Payment"] as const;
export type RiskFactor = (typeof riskFactors)[number];
export const factorWeight: Record<RiskFactor, number> = { Usage: 30, Service: 25, Champion: 20, Commitments: 15, Payment: 10 };

export type Decision = {
  id: string;
  action: string;
  rationale: string;
  decidedAt: string;
};

export type Account = {
  id: string;
  name: string;
  priorityScore: number;
  riskLevel: RiskLevel;
  contractValue: number;
  weightedValue: number;
  currency: "IDR";
  renewalDate: string;
  signals: string[];
  factorScores: Record<RiskFactor, number>;
  factors: RiskFactor[];
  focus: boolean;
  plan: string;
};

const levelFromSource: Record<string, RiskLevel> = { Kritis: "Critical", Tinggi: "High", Sedang: "Medium", Rendah: "Low" };

// Deterministic draft per strongest factor (ADR-0005: no generative model).
const planTemplate: Record<RiskFactor, string> = {
  Usage: "Review the transaction drop with the account owner. Check offline outlets for unsynced transactions first, then agree on an adoption plan before renewal.",
  Service: "Assign a technical owner for the open tickets, confirm the root cause (for example a known bug), and share a fix timeline before renewal.",
  Champion: "Identify the new decision-maker, schedule a stakeholder meeting, and update the CRM champion before discussing renewal.",
  Commitments: "Give a clear status on the pending commitment and re-open contact with the customer before renewal.",
  Payment: "Confirm billing contacts and payment terms with the customer before renewal.",
};

export const strongestFactor = (account: Pick<Account, "factorScores">) =>
  riskFactors.reduce((best, factor) =>
    account.factorScores[factor] * factorWeight[factor] > account.factorScores[best] * factorWeight[best] ? factor : best,
  );

export const accounts: Account[] = scores.map(row => {
  const factorScores: Record<RiskFactor, number> = {
    Usage: row.sub.pakai,
    Service: row.sub.layanan,
    Champion: row.sub.champion,
    Commitments: row.sub.janji,
    Payment: row.sub.bayar,
  };
  return {
    id: row.account_id,
    name: row.nama,
    priorityScore: row.skor,
    riskLevel: levelFromSource[row.level],
    contractValue: row.nilai_tahunan,
    weightedValue: row.nilai_tertimbang,
    currency: "IDR",
    renewalDate: row.renewal,
    signals: row.signals,
    factorScores,
    factors: riskFactors.filter(factor => factorScores[factor] > 0),
    // Team focus accounts C01–C06 (docs/09-BUILD-PLAN-KASIRNUSA.md).
    focus: /^C0[1-6]$/.test(row.account_id),
    plan: planTemplate[strongestFactor({ factorScores })],
  };
});

export const isElevated = (account: Account) => account.riskLevel === "Critical" || account.riskLevel === "High";

export const formatMoney = (value: number, currency: Account["currency"], compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);

export const filterAccounts = (items: Account[], query: string, risk: "All" | RiskLevel) =>
  items.filter(
    account =>
      (risk === "All" || account.riskLevel === risk) &&
      [account.id, account.name, ...account.signals].join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );

// Focus accounts stay pinned on top, then the chosen order.
export const sortAccounts = (items: Account[], sort: "risk" | "weighted" | "renewal") =>
  [...items].sort((a, b) => {
    if (a.focus !== b.focus) return a.focus ? -1 : 1;
    if (sort === "weighted") return b.weightedValue - a.weightedValue;
    if (sort === "renewal") return a.renewalDate.localeCompare(b.renewalDate);
    return b.priorityScore - a.priorityScore;
  });
