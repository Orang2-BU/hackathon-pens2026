"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardCheck, Database, GitCommitHorizontal, type LucideIcon, Scale, ShieldAlert, TriangleAlert } from "lucide-react";
import { useDemoState, usePendingPlans } from "@/components/demo-state";
import { RiskBadge } from "@/components/risk-badge";
import { accounts, formatMoney, isElevated, isMismatch, riskFactors, type RiskLevel } from "@/lib/demo-data";

// Analysis snapshot from docs/10-DATA-PROFILE-KASIRNUSA.md; day counts are measured from it, not from today.
const SNAPSHOT = "2026-10-01";
const DAY_MS = 86_400_000;
const levelRank: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const daysToRenewal = (date: string) => Math.round((Date.parse(date) - Date.parse(SNAPSHOT)) / DAY_MS);

const weightedTotal = accounts.reduce((sum, account) => sum + account.weightedValue, 0);
const elevated = accounts.filter(isElevated);
const attention = [...elevated]
  .sort((a, b) => levelRank[a.riskLevel] - levelRank[b.riskLevel] || a.renewalDate.localeCompare(b.renewalDate))
  .slice(0, 5);
const mismatches = accounts.filter(isMismatch);
const renewals90 = accounts.filter(account => daysToRenewal(account.renewalDate) <= 90).length;
const factorCounts = riskFactors.map(factor => ({ factor, count: accounts.filter(account => account.factors.includes(factor)).length }));

type StatProps = { icon: LucideIcon; label: string; value: string; note: string; featured?: boolean };

function Stat({ icon: Icon, label, value, note, featured }: StatProps) {
  // Muted gray fails contrast over the lime glow; featured text stays on-surface.
  const secondary = featured ? "text-on-surface" : "text-on-surface-muted";
  return (
    <section className={`flex flex-col gap-sm ${featured ? "card-featured" : "card"}`}>
      <div className="flex items-center gap-sm">
        <span className="grid size-8 place-items-center rounded-sm bg-surface-elevated">
          <Icon size={16} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className={`text-label-md ${secondary}`}>{label}</h2>
      </div>
      <p className="text-display-number-sm font-bold tracking-display-number-sm">{value}</p>
      <p className={`text-label-sm ${secondary}`}>{note}</p>
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
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-md">
      <div className="grid gap-md xl:grid-cols-3">
        <section className="card xl:col-span-2" aria-labelledby="attention-heading">
          <div className="flex flex-wrap items-baseline gap-sm">
            <h2 id="attention-heading" className="card-title mr-auto">Needs attention this week</h2>
            <p className="text-label-sm text-on-surface-muted">High or Critical, nearest renewal first</p>
          </div>
          {attention.length === 0 ? (
            <p className="mt-md text-body-sm text-on-surface-muted">No account is at High or Critical.</p>
          ) : (
            <ul className="mt-md flex flex-col">
              {attention.map(account => (
                <li key={account.id} className="flex flex-col gap-sm border-b border-outline py-sm last:border-0 sm:flex-row sm:items-center sm:gap-md">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-sm">
                      <Link href={`/accounts/${account.id}`} className="font-semibold underline-offset-4 hover:text-primary hover:underline">
                        {account.name}
                      </Link>
                      <RiskBadge level={account.riskLevel} />
                    </div>
                    <p className="mt-xs text-body-sm text-on-surface-muted">{account.signals[0]}</p>
                  </div>
                  <div className="flex items-center justify-between gap-md">
                    <p className="text-label-md">
                      <span className="font-semibold">{daysToRenewal(account.renewalDate)}</span>
                      <span className="text-on-surface-muted"> days to renewal</span>
                    </p>
                    <Link href={`/review?account=${account.id}`} className="btn btn-secondary">
                      Plan <ArrowRight size={16} aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="mismatch-heading">
          <h2 id="mismatch-heading" className="card-title flex items-center gap-sm">
            <TriangleAlert size={18} aria-hidden className="text-warning" /> CRM says healthy
          </h2>
          <p className="mt-xs text-label-sm text-on-surface-muted">Green in the CRM dashboard, High or Critical in the graph.</p>
          {mismatches.length === 0 ? (
            <p className="mt-md text-body-sm text-on-surface-muted">No mismatch with the CRM dashboard.</p>
          ) : (
            <ul className="mt-md flex flex-col gap-sm">
              {mismatches.map(account => (
                <li key={account.id}>
                  <Link
                    href={`/accounts/${account.id}`}
                    className="block rounded-md bg-surface-elevated p-sm text-body-sm transition-colors hover:bg-outline"
                  >
                    <span className="flex flex-wrap items-center gap-sm">
                      <span className="font-semibold">{account.name}</span>
                      <span className="badge text-success">CRM Green</span>
                      <RiskBadge level={account.riskLevel} />
                    </span>
                    <span className="mt-xs block text-on-surface-muted">{account.signals.join(" · ")}</span>
                    <span className="mt-sm flex items-center gap-xs text-label-md font-semibold">
                      See evidence path <ArrowRight size={14} aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
        <Stat
          featured
          icon={Scale}
          label="Weighted value for priority"
          value={formatMoney(weightedTotal, "IDR", true)}
          note="Contract × priority score ÷ 100; not expected loss"
        />
        <Stat icon={ShieldAlert} label="Accounts at High/Critical" value={`${elevated.length} of ${accounts.length}`} note="Level set by the scoring formula" />
        <Stat icon={ClipboardCheck} label="Plans in review" value={String(pendingPlans)} note="Drafts for every account, all levels" />
        <Stat icon={CalendarClock} label="Renewals in 90 days" value={String(renewals90)} note={`From the ${SNAPSHOT} snapshot`} />
      </div>

      <div className="grid gap-md xl:grid-cols-3">
        <section className="card" aria-labelledby="factors-heading">
          <h2 id="factors-heading" className="card-title">Risk factors in the portfolio</h2>
          <p className="mt-xs text-label-sm text-on-surface-muted">Accounts where each parameter is active</p>
          <ul className="mt-md flex flex-col gap-xs">
            {factorCounts.map(({ factor, count }) => (
              <li key={factor}>
                <Link
                  href={`/accounts?factor=${factor}`}
                  className="flex min-h-11 items-center gap-sm rounded-md px-sm text-body-sm transition-colors hover:bg-surface-elevated"
                >
                  {factor}
                  <span className="relative ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-neutral" aria-hidden>
                    <span className="absolute inset-y-0 left-0 rounded-full bg-warning" style={{ width: `${(count / accounts.length) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right font-semibold">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
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

        <section className="card" aria-labelledby="health-heading">
          <div className="flex flex-wrap items-center gap-sm">
            <h2 id="health-heading" className="card-title mr-auto">Data and Jev</h2>
            <span className="badge text-warning">Not ingested</span>
          </div>
          <p className="mt-md text-body-sm">0 of 15 KasirNusa sources ingested. Jev signals, review queue, and call cost appear here after the first ingest.</p>
          <p className="mt-sm text-label-sm text-on-surface-muted">Every figure on this page uses synthetic seed data until then.</p>
          <Link href="/data" className="btn btn-secondary mt-md">
            <Database size={16} aria-hidden /> Open data sources
          </Link>
        </section>
      </div>
    </div>
  );
}
