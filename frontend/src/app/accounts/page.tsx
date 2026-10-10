"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useResource, money, renewalDays, levelTone, type AccountSummary } from "@/lib/workspace";
import { WorkspaceStatus } from "@/components/workspace-status";

const LEVEL_ORDER = ["Critical", "High", "Medium", "Low"];

function LevelBadge({ level }: { level: string | null }) {
  return (
    <span className={`inline-flex items-center gap-xs rounded-sm px-sm py-0.5 text-label-sm font-semibold ${levelTone(level)}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {level ?? "Unscored"}
    </span>
  );
}

export default function AccountsPage() {
  const query = useSearchParams().get("q") ?? "";
  const [sort, setSort] = useState("priority"), [level, setLevel] = useState("All");
  const resource = useResource<{ items: AccountSummary[] }>(`accounts?sort=${sort}&search=${encodeURIComponent(query)}`);
  if (!resource.data) return <WorkspaceStatus {...resource} />;
  const all = resource.data.items;
  const levels = [...new Set(all.map(a => a.priority.level ?? "Unscored"))].sort((a, b) => (LEVEL_ORDER.indexOf(a) + 1 || 99) - (LEVEL_ORDER.indexOf(b) + 1 || 99));
  const items = all.filter(a => level === "All" || (a.priority.level ?? "Unscored") === level);

  return (
    <div className="flex flex-col gap-md">
      <p className="text-body-sm text-on-surface-muted">Synthetic KasirNusa data. Priority orders the work; it is not a churn probability.</p>
      <section className="card">
        <div className="flex flex-wrap items-center gap-sm">
          <div role="group" aria-label="Filter by risk level" className="mr-auto flex flex-wrap gap-xs">
            {["All", ...levels].map(v => {
              const count = v === "All" ? all.length : all.filter(a => (a.priority.level ?? "Unscored") === v).length;
              return (
                <button key={v} type="button" aria-pressed={level === v} onClick={() => setLevel(v)} className="btn btn-secondary min-h-11 gap-xs px-sm xl:min-h-9">
                  {v !== "All" && <span className={`size-2 rounded-full bg-current ${levelTone(v).split(" ")[1]}`} aria-hidden />}
                  {v}
                  <span className="text-label-sm text-on-surface-muted">{count}</span>
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-sm text-label-sm text-on-surface-muted">
            Sort by
            <select className="input text-on-surface" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="priority">Priority</option>
              <option value="weighted">Weighted value</option>
              <option value="renewal">Renewal date</option>
            </select>
          </label>
        </div>

        <div className="mt-md overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="label-caps text-on-surface-muted">
              <tr>
                <th className="p-sm">Account</th>
                <th className="p-sm">Priority</th>
                <th className="whitespace-nowrap p-sm">Renewal</th>
                <th className="whitespace-nowrap p-sm text-right">Annual value</th>
                <th className="whitespace-nowrap p-sm text-right">Weighted value</th>
                <th className="p-sm"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => {
                const days = renewalDays(a);
                const soon = days !== null && days >= 0 && days <= 90;
                return (
                  <tr key={a.id} className="group border-t border-outline transition-colors hover:bg-surface-elevated">
                    <th className="min-w-48 p-sm font-normal">
                      <Link className="inline-flex min-h-11 items-center font-semibold group-hover:text-primary" href={`/accounts/${a.id}`}>{a.name}</Link>
                      <p className="text-label-sm text-on-surface-muted">{a.id}{/^C0[1-6]$/.test(a.id) && " · Focus"}</p>
                    </th>
                    <td className="min-w-44 p-sm">
                      <div className="flex items-center gap-sm">
                        <LevelBadge level={a.priority.level} />
                        <span className="font-semibold tabular-nums">{a.priority.score === null ? "—" : Math.round(a.priority.score)}</span>
                      </div>
                      {a.priority.score !== null && (
                        <div className="mt-xs h-1 w-28 overflow-hidden rounded-full bg-surface-elevated" aria-hidden>
                          <div className={`h-full bg-current ${levelTone(a.priority.level).split(" ")[1]}`} style={{ width: `${Math.min(100, a.priority.score)}%` }} />
                        </div>
                      )}
                      <p className="mt-xs text-label-sm text-on-surface-muted">Coverage {a.priority.coverage ?? "—"}%</p>
                    </td>
                    <td className="whitespace-nowrap p-sm">
                      <span className={soon ? "font-semibold text-warning" : ""}>{days === null ? "Unavailable" : `${days} days`}</span>
                      <p className="text-label-sm text-on-surface-muted">{a.renewalDate ?? "No date"}</p>
                    </td>
                    <td className="whitespace-nowrap p-sm text-right tabular-nums text-on-surface-muted">{money(a.annualValueIdr)}</td>
                    <td className="whitespace-nowrap p-sm text-right font-semibold tabular-nums">{money(a.weightedValueIdr)}</td>
                    <td className="p-sm text-on-surface-muted"><ChevronRight size={16} aria-hidden /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!items.length && <p className="mt-md text-body-sm text-on-surface-muted">No accounts match. Clear the search or level filter.</p>}
      </section>
      <WorkspaceStatus {...resource} />
    </div>
  );
}
