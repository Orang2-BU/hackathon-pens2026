"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { levelTone, renewalDays, type AccountSummary } from "@/lib/workspace";

const PAGE = 6;

// Renewals inside 90 days, a page at a time so the card keeps the height of "Needs attention" beside it.
export function RenewalsCard({ renewals }: { renewals: AccountSummary[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(renewals.length / PAGE));
  const shown = renewals.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <section className="card flex flex-col" aria-labelledby="renewals-heading">
      <h2 id="renewals-heading" className="card-title">Upcoming renewals</h2>
      <p className="mt-xs text-label-sm text-on-surface-muted">Urgency is separate from risk level. Within 90 days of the analysis snapshot.</p>
      <ul className="mt-md flex flex-col">
        {shown.map(a => (
          <li key={a.id} className="border-t border-outline">
            <Link href={`/accounts/${a.id}`} className="group flex min-h-11 items-center gap-sm py-xs text-body-sm">
              <span className="mr-auto truncate group-hover:text-primary">{a.name}</span>
              <span className="w-16 shrink-0 text-right tabular-nums">{renewalDays(a)} days</span>
              <span className={`badge w-20 shrink-0 justify-center ${levelTone(a.priority.level)}`}>{a.priority.level ?? "Unscored"}</span>
            </Link>
          </li>
        ))}
      </ul>
      {!renewals.length && <p className="mt-sm text-body-sm text-on-surface-muted">No renewals in the next 90 days.</p>}
      {pages > 1 && (
        <nav aria-label="Renewal pages" className="mt-auto flex items-center justify-between gap-sm border-t border-outline pt-sm">
          <span className="text-label-sm text-on-surface-muted" aria-live="polite">
            {page * PAGE + 1}–{Math.min(renewals.length, (page + 1) * PAGE)} of {renewals.length}
          </span>
          <span className="flex gap-xs">
            <button type="button" className="btn btn-secondary size-11 p-0 xl:size-9" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous renewals"><ChevronLeft size={16} aria-hidden /></button>
            <button type="button" className="btn btn-secondary size-11 p-0 xl:size-9" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next renewals"><ChevronRight size={16} aria-hidden /></button>
          </span>
        </nav>
      )}
    </section>
  );
}
