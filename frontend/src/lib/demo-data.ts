export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

// Risk parameters from docs/10-DATA-PROFILE-KASIRNUSA.md (weights 30/25/20/15/10).
export const riskFactors = ["Usage", "Service", "Champion", "Commitments", "Payment"] as const;
type RiskFactor = (typeof riskFactors)[number];

type Evidence = {
  id: string;
  kind: "Conversation" | "Signal" | "Decision";
  label: string;
  quote: string;
  source: string;
  date: string;
  confidence: number;
};

export type Decision = {
  id: string;
  action: string;
  rationale: string;
  decidedAt: string;
};

export type Account = {
  id: string;
  name: string;
  domain: string;
  priorityScore: number;
  riskLevel: RiskLevel;
  contractValue: number;
  weightedValue: number;
  currency: "IDR";
  renewalDate: string;
  sourceCoverage: string;
  signals: string[];
  factors: RiskFactor[];
  crmHealth: "Green" | "Yellow" | "Red";
  answer: string;
  evidence: Evidence[];
  decisions: Decision[];
  plan: string;
};

export const accounts: Account[] = [
  {
    id: "nusa-retail",
    name: "Nusa Retail Group",
    domain: "nusaretail.example",
    priorityScore: 82,
    riskLevel: "Critical",
    contractValue: 420_000_000,
    weightedValue: 344_400_000,
    currency: "IDR",
    renewalDate: "2026-11-14",
    sourceCoverage: "4 calls · 2 tickets · 30-day usage",
    signals: ["Champion changed role", "Competitor mentioned", "Usage down 28%"],
    factors: ["Champion", "Usage", "Commitments"],
    crmHealth: "Yellow",
    answer:
      "The main champion moved roles after procurement asked for a re-evaluation. On the next call the account named a competitor and requested a migration plan before renewal.",
    evidence: [
      {
        id: "ev-nr-1",
        kind: "Conversation",
        label: "Champion change",
        quote: "Starting next month I'm moving to regional operations. Rina will take over the renewal evaluation.",
        source: "CALL-NR-018",
        date: "2026-09-19",
        confidence: 0.93,
      },
      {
        id: "ev-nr-2",
        kind: "Signal",
        label: "Competitor evaluation",
        quote: "Procurement asked us to compare costs with Altura before the November decision.",
        source: "CALL-NR-022",
        date: "2026-10-03",
        confidence: 0.89,
      },
      {
        id: "ev-nr-3",
        kind: "Decision",
        label: "Re-onboarding precedent",
        quote: "The CSM approved a new stakeholder workshop before any pricing discussion.",
        source: "DEC-2026-041",
        date: "2026-08-11",
        confidence: 1,
      },
    ],
    decisions: [
      {
        id: "dec-nr-1",
        action: "New stakeholder workshop",
        rationale: "The champion change broke the implementation context.",
        decidedAt: "2026-08-11",
      },
    ],
    plan:
      "Schedule a 45-minute workshop with Rina and the procurement team. Review the last 90 days of results, then agree on three evaluation criteria before discussing renewal.",
  },
  {
    id: "arca-logistics",
    name: "Arca Logistics",
    domain: "arcalogistics.example",
    priorityScore: 68,
    riskLevel: "High",
    contractValue: 285_000_000,
    weightedValue: 193_800_000,
    currency: "IDR",
    renewalDate: "2026-12-02",
    sourceCoverage: "3 calls · 5 tickets · 30-day usage",
    signals: ["Repeated ticket escalation", "Slow time-to-value"],
    factors: ["Service", "Usage"],
    crmHealth: "Green",
    answer:
      "Two integration escalations are still open and the operations team has not reached its adoption target. The sponsor remains engaged but wants a concrete recovery timeline.",
    evidence: [
      {
        id: "ev-al-1",
        kind: "Conversation",
        label: "Timeline request",
        quote: "We need a clear date to close this integration before adding more branches.",
        source: "CALL-AL-014",
        date: "2026-09-28",
        confidence: 0.91,
      },
      {
        id: "ev-al-2",
        kind: "Signal",
        label: "Repeated escalation",
        quote: "Ticket API-392 was reopened after a partial fix failed under peak load.",
        source: "TICKET-API-392",
        date: "2026-10-01",
        confidence: 0.87,
      },
    ],
    decisions: [],
    plan:
      "Assign a technical owner and recovery date, send a progress summary twice a week, then run an adoption review once the integration ticket is closed.",
  },
  {
    id: "selaras-health",
    name: "Selaras Health",
    domain: "selarashealth.example",
    priorityScore: 46,
    riskLevel: "Medium",
    contractValue: 198_000_000,
    weightedValue: 91_080_000,
    currency: "IDR",
    renewalDate: "2027-01-21",
    sourceCoverage: "2 calls · 1 ticket · 30-day usage",
    signals: ["Uneven adoption in new team"],
    factors: ["Usage"],
    crmHealth: "Green",
    answer:
      "No strong churn signal. Risk comes from uneven adoption in the new team, while the sponsor and core usage remain stable.",
    evidence: [
      {
        id: "ev-sh-1",
        kind: "Conversation",
        label: "New team adoption",
        quote: "The central clinic team uses it routinely, but two new branches haven't finished onboarding.",
        source: "CALL-SH-009",
        date: "2026-09-30",
        confidence: 0.78,
      },
    ],
    decisions: [],
    plan:
      "Offer two branch onboarding sessions and check user activation seven days after the second session.",
  },
];

export const formatMoney = (value: number, currency: Account["currency"], compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);

export const filterAccounts = (
  items: Account[],
  query: string,
  risk: "All" | RiskLevel,
) =>
  items.filter(
    (account) =>
      (risk === "All" || account.riskLevel === risk) &&
      [account.name, account.domain, ...account.signals, ...account.evidence.map(evidence => evidence.quote)]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

export const sortAccounts = (
  items: Account[],
  sort: "risk" | "weighted" | "renewal",
) =>
  [...items].sort((a, b) => {
    if (sort === "weighted") return b.weightedValue - a.weightedValue;
    if (sort === "renewal") return a.renewalDate.localeCompare(b.renewalDate);
    return b.priorityScore - a.priorityScore;
  });

export const isElevated = (account: Account) => account.riskLevel === "Critical" || account.riskLevel === "High";

// The CRM dashboard says Green while the graph scores the account High or Critical.
export const isMismatch = (account: Account) => account.crmHealth === "Green" && isElevated(account);
