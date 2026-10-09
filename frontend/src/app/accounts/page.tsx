"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ClipboardCheck, Gauge, type LucideIcon, Scale, ShieldAlert } from "lucide-react";
import { usePendingPlans } from "@/components/demo-state";
import { RiskBadge } from "@/components/risk-badge";
import { accounts, filterAccounts, formatMoney, sortAccounts, type RiskLevel } from "@/lib/demo-data";

const riskOptions = ["All", "Critical", "High", "Medium", "Low"] as const;
const weightedTotal = accounts.reduce((sum, account) => sum + account.weightedValue, 0);
const elevatedCount = accounts.filter(account => account.riskLevel !== "Medium").length;
const scores = accounts.map(account => account.priorityScore).sort((a, b) => a - b);
const mid = Math.floor(scores.length / 2);
const medianScore = scores.length % 2 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;

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

export default function AccountsPage() {
  const query = useSearchParams().get("q") ?? "";
  const [risk, setRisk] = useState<"All" | RiskLevel>("All");
  const [sort, setSort] = useState<"risk" | "weighted" | "renewal">("risk");
  const pendingPlans = usePendingPlans().length;
  const visible = sortAccounts(filterAccounts(accounts, query, risk), sort);

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

      <section className="card" aria-labelledby="watchlist-heading">
        <div className="flex flex-wrap items-center gap-sm">
          <div className="mr-auto">
            <h2 id="watchlist-heading" className="card-title">Renewal watchlist</h2>
            <p className="text-body-sm text-on-surface-muted">
              {visible.length} of {accounts.length} accounts{query && <> matching “{query}”</>}
            </p>
          </div>
          <div role="group" aria-label="Filter by risk level" className="flex rounded-md bg-neutral p-xs">
            {riskOptions.map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={risk === option}
                onClick={() => setRisk(option)}
                className={`min-h-11 rounded-sm px-sm text-label-md transition-colors xl:min-h-9 ${
                  risk === option ? "bg-surface-elevated text-on-surface" : "text-on-surface-muted hover:text-on-surface"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <label htmlFor="sort" className="sr-only">Sort accounts</label>
          <select
            id="sort"
            value={sort}
            onChange={event => setSort(event.target.value as typeof sort)}
            className="h-11 rounded-md bg-secondary px-sm text-label-md ring-1 ring-outline ring-inset"
          >
            <option value="risk">Sort: Priority score</option>
            <option value="weighted">Sort: Weighted value</option>
            <option value="renewal">Sort: Renewal date</option>
          </select>
        </div>

        <div className="-mx-md mt-md overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-body-sm">
            <thead className="label-caps text-on-surface-muted">
              <tr className="border-b border-outline">
                <th scope="col" className="px-md py-sm">Account</th>
                <th scope="col" className="px-md py-sm">Priority score</th>
                <th scope="col" className="px-md py-sm">Signals</th>
                <th scope="col" className="px-md py-sm">Renewal</th>
                <th scope="col" className="px-md py-sm text-right">Contract</th>
                <th scope="col" className="px-md py-sm text-right">Weighted value</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-md py-2xl text-center">
                    <p className="text-on-surface-muted">No accounts match this search and risk filter.</p>
                    <Link href="/accounts" onClick={() => setRisk("All")} className="btn btn-secondary mt-md">Clear filters</Link>
                  </td>
                </tr>
              ) : (
                visible.map(account => (
                  <tr key={account.id} className="border-b border-outline transition-colors last:border-0 hover:bg-surface-elevated/50">
                    <td className="px-md py-sm">
                      <Link href={`/accounts/${account.id}`} className="inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:text-primary hover:underline xl:min-h-0">
                        {account.name}
                      </Link>
                      <div className="text-label-sm text-on-surface-muted">{account.domain}</div>
                    </td>
                    <td className="px-md py-sm">
                      <span className="flex items-center gap-sm">
                        <span className="text-title font-bold">{account.priorityScore}</span>
                        <RiskBadge level={account.riskLevel} />
                      </span>
                    </td>
                    <td className="px-md py-sm" title={account.signals.join(", ")}>
                      {account.signals[0]}
                      {account.signals.length > 1 && <span className="text-on-surface-muted"> +{account.signals.length - 1}</span>}
                    </td>
                    <td className="px-md py-sm">{account.renewalDate}</td>
                    <td className="px-md py-sm text-right text-on-surface-muted">{formatMoney(account.contractValue, account.currency)}</td>
                    <td className="px-md py-sm text-right font-semibold">{formatMoney(account.weightedValue, account.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
