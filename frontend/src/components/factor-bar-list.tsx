"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { factorLabel, riskPoints } from "@/lib/risk-explain";
import { api, type AccountDetail, type AccountSummary } from "@/lib/workspace";

// Factor at or above this many risk points counts as a strong signal; weak traces are present in almost every account.
const STRONG = 50;

type Row = { factor: string; accounts: { id: string; name: string; points: number }[] };

// Bar list (after Tremor's BarList on 21st.dev): how many accounts show each risk factor strongly, so systemic
// problems stand out. Each bar expands to the accounts behind it.
// ponytail: one detail request per account (40 here); move to a portfolio summary endpoint if the list grows.
export function FactorBarList({ accounts }: { accounts: AccountSummary[] }) {
  const [rows, setRows] = useState<Row[] | null>(null), [error, setError] = useState(false), [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all(accounts.map(a => api<AccountDetail>(`accounts/${a.id}`)))
      .then(details => {
        const byFactor = new Map<string, Row>();
        for (const d of details) for (const p of d.parameters) {
          const row = byFactor.get(p.factor) ?? { factor: p.factor, accounts: [] };
          const points = riskPoints(p);
          if (points >= STRONG) row.accounts.push({ id: d.id, name: d.name, points });
          byFactor.set(p.factor, row);
        }
        if (live) setRows([...byFactor.values()].map(r => ({ ...r, accounts: r.accounts.sort((a, b) => b.points - a.points) })).sort((a, b) => b.accounts.length - a.accounts.length));
      })
      .catch(() => live && setError(true));
    return () => { live = false; };
  }, [accounts]);

  return (
    <section className="card" aria-labelledby="factors-heading">
      <h2 id="factors-heading" className="card-title">What’s driving risk across the portfolio</h2>
      <p className="mt-xs text-body-sm text-on-surface-muted">Accounts where each factor is a strong signal ({STRONG} / 100 or more). A factor shared by many accounts points to a product or process issue, not a single relationship.</p>
      {error && <p role="alert" className="mt-md text-body-sm text-danger">Factor breakdown unavailable. Open an account to see its factors.</p>}
      {!rows && !error && <p role="status" className="mt-md text-body-sm text-on-surface-muted">Reading factors for {accounts.length} accounts…</p>}
      {rows && !rows.length && <p className="mt-md text-body-sm text-on-surface-muted">No measured factors yet.</p>}
      <ul className="mt-md flex flex-col gap-xs">
        {rows?.map(r => {
          const expanded = open === r.factor;
          return (
            <li key={r.factor}>
              <button type="button" aria-expanded={expanded} disabled={!r.accounts.length} onClick={() => setOpen(expanded ? null : r.factor)} className="group flex min-h-11 w-full items-center gap-sm rounded-sm text-left disabled:cursor-default">
                <span className="relative flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-sm">
                  <span className="absolute inset-y-0 left-0 rounded-sm bg-primary/20 transition-colors group-hover:bg-primary/30" style={{ width: `${(r.accounts.length / accounts.length) * 100}%` }} aria-hidden />
                  <span className="relative px-sm text-body-sm font-semibold">{factorLabel(r.factor)}</span>
                </span>
                <span className="w-24 shrink-0 text-right text-body-sm tabular-nums">{r.accounts.length}<span className="text-on-surface-muted"> / {accounts.length}</span></span>
                <ChevronDown size={16} className={`shrink-0 text-on-surface-muted transition-transform group-disabled:invisible ${expanded ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {expanded && (
                <ul className="mb-sm ml-sm flex flex-col border-l border-outline pl-md">
                  {r.accounts.map(a => (
                    <li key={a.id}>
                      <Link href={`/accounts/${a.id}`} className="flex min-h-11 items-center gap-sm text-body-sm hover:text-primary xl:min-h-9">
                        <span className="mr-auto">{a.name} <span className="text-label-sm text-on-surface-muted">{a.id}</span></span>
                        <span className="tabular-nums text-on-surface-muted">{a.points} / 100</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
