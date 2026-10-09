"use client";

import Link from "next/link";
import { CalendarClock, ClipboardCheck, Gauge, GitCommitHorizontal, type LucideIcon, Scale, ShieldAlert } from "lucide-react";
import { useDemoState, usePendingPlans } from "@/components/demo-state";
import { RiskBadge } from "@/components/risk-badge";
import { accounts, formatMoney, type RiskLevel } from "@/lib/demo-data";

// Analysis snapshot from docs/10-DATA-PROFILE-KASIRNUSA.md; day counts are measured from it, not from today.
const SNAPSHOT = "2026-10-01";
const DAY_MS = 86_400_000;
const levels: RiskLevel[] = ["Critical", "High", "Medium", "Low"];
const levelBar: Record<RiskLevel, string> = { Critical: "bg-danger", High: "bg-warning", Medium: "bg-outline-active", Low: "bg-success" };

const weightedTotal = accounts.reduce((sum, account) => sum + account.weightedValue, 0);
const elevatedCount = accounts.filter(account => account.riskLevel === "Critical" || account.riskLevel === "High").length;
const scores = accounts.map(account => account.priorityScore).sort((a, b) => a - b);
const mid = Math.floor(scores.length / 2);
const medianScore = scores.length % 2 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
const levelCounts = levels.map(level => ({ level, count: accounts.filter(account => account.riskLevel === level).length }));
const renewals = accounts
  .map(account => ({ account, days: Math.round((Date.parse(account.renewalDate) - Date.parse(SNAPSHOT)) / DAY_MS) }))
  .filter(item => item.days >= 0 && item.days <= 90)
  .sort((a, b) => a.days - b.days);

type KpiProps = { icon: LucideIcon; label: string; value: string; note: string; featured?: boolean; small?: boolean };

function Kpi({ icon: Icon, label, value, note, featured, small }: KpiProps) {
  // Muted gray fails contrast over the lime glow; featured text stays on-surface.
  const secondary = featured ? "text-on-surface" : "text-on-surface-muted";
  return (
    <section className={`flex flex-col gap-md ${featured ? "card-featured" : "card"}`}>
      <span className="grid size-9 place-items-center rounded-sm bg-surface-elevated">
        <Icon size={18} strokeWidth={1.75} aria-hidden />
      </span>
      <div>
        <h2 className={`text-label-md ${secondary}`}>{label}</h2>
        <p className={`mt-xs font-bold ${small ? "text-display-number-sm tracking-display-number-sm" : "text-display-number tracking-display-number"}`}>
          {value}
        </p>
      </div>
      <p className={`mt-auto text-label-sm ${secondary}`}>{note}</p>
    </section>
  );
}

export default function DashboardPage() {
  const pendingPlans = usePendingPlans().length;
  const { decisions } = useDemoState();
  const recent = [
    ...accounts.flatMap(account => account.decisions.map(decision => ({ ...decision, accountId: account.id }))),
    ...decisions,
  ]
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-md">
      <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
        <Kpi
          featured
          icon={Scale}
          label="Weighted value for priority"
          value={formatMoney(weightedTotal, "IDR", true)}
          note="Contract value × priority score ÷ 100. Orders work; it is not expected loss."
        />
        <Kpi
          icon={ShieldAlert}
          label="Accounts at High or Critical"
          value={`${elevatedCount} of ${accounts.length}`}
          note="Level set by the scoring formula in code."
        />
        <div className="grid grid-cols-2 gap-md md:col-span-2 xl:col-span-1">
          <Kpi small icon={ClipboardCheck} label="Plans in review" value={String(pendingPlans)} note="Awaiting approve or reject" />
          <Kpi small icon={Gauge} label="Median priority score" value={String(medianScore)} note={`Across ${accounts.length} accounts`} />
        </div>
      </div>

      <div className="grid items-start gap-md xl:grid-cols-3">
        <section className="card" aria-labelledby="levels-heading">
          <h2 id="levels-heading" className="card-title">Accounts by level</h2>
          <div className="mt-md flex h-3 overflow-hidden rounded-full bg-neutral" aria-hidden>
            {levelCounts.map(({ level, count }) => count > 0 && (
              <span key={level} className={levelBar[level]} style={{ width: `${(count / accounts.length) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-md flex flex-col gap-sm">
            {levelCounts.map(({ level, count }) => (
              <li key={level} className="flex items-center gap-sm text-body-sm">
                <span className={`size-2.5 rounded-full ${levelBar[level]}`} aria-hidden />
                {level}
                <span className="ml-auto font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="renewals-heading">
          <h2 id="renewals-heading" className="card-title">Renewals in the next 90 days</h2>
          <p className="text-label-sm text-on-surface-muted">Counted from the {SNAPSHOT} snapshot</p>
          {renewals.length === 0 ? (
            <p className="mt-md text-body-sm text-on-surface-muted">No renewal falls inside the window.</p>
          ) : (
            <ul className="mt-md flex flex-col gap-sm">
              {renewals.map(({ account, days }) => (
                <li key={account.id}>
                  <Link
                    href={`/accounts/${account.id}`}
                    className="flex min-h-11 items-center gap-sm rounded-md px-sm text-body-sm transition-colors hover:bg-surface-elevated"
                  >
                    <CalendarClock size={16} aria-hidden className="shrink-0 text-on-surface-muted" />
                    <span className="truncate font-semibold">{account.name}</span>
                    <RiskBadge level={account.riskLevel} />
                    <span className="ml-auto shrink-0 text-on-surface-muted">{days} days</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="decisions-heading">
          <h2 id="decisions-heading" className="card-title">Recent decisions</h2>
          {recent.length === 0 ? (
            <p className="mt-md text-body-sm text-on-surface-muted">No decisions recorded yet.</p>
          ) : (
            <ul className="mt-md flex flex-col gap-md">
              {recent.map(decision => (
                <li key={decision.id} className="flex gap-sm">
                  <GitCommitHorizontal size={18} aria-hidden className="mt-0.5 shrink-0 text-graph-decision" />
                  <div className="min-w-0">
                    <p className="text-label-md font-semibold">{decision.action}</p>
                    <p className="text-label-sm text-on-surface-muted">
                      <Link href={`/accounts/${decision.accountId}`} className="underline-offset-4 hover:text-on-surface hover:underline">
                        {accounts.find(account => account.id === decision.accountId)?.name}
                      </Link>{" "}
                      · {decision.decidedAt}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
