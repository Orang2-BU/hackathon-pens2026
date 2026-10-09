"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { useDemoState } from "@/components/demo-state";
import { accounts, reviewItems } from "@/lib/demo-data";

export default function ReviewPage() {
  const { resolvedReviewIds, resolveReview } = useDemoState();
  const [lastAction, setLastAction] = useState("");
  const pending = reviewItems.filter(item => !resolvedReviewIds.includes(item.id));
  const item = pending[0];
  const account = item && accounts.find(candidate => candidate.id === item.accountId);

  const decide = (approved: boolean) => {
    resolveReview(item.id);
    setLastAction(`${approved ? "Approved" : "Rejected"}: ${item.title}`);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-md">
      <p className="max-w-[70ch] text-body-sm text-on-surface-muted">
        Items the code held back for a human: Jev confidence between 0.50 and 0.85, or a merge without a hard identifier.
        One decision at a time; there is no bulk approve.
      </p>
      <p role="status" className="text-label-md text-on-surface-muted">{lastAction}</p>

      {item ? (
        <article className="card flex flex-col gap-md">
          <div className="flex flex-wrap items-center gap-sm text-label-sm text-on-surface-muted">
            <span className="badge text-warning">{item.type}</span>
            {account && (
              <Link href={`/accounts/${account.id}`} className="underline-offset-4 hover:text-on-surface hover:underline">
                {account.name}
              </Link>
            )}
            <span className="ml-auto">{pending.length} waiting</span>
          </div>
          <h2 className="text-balance text-headline-md font-semibold tracking-headline-md">{item.title}</h2>
          <dl className="grid gap-sm text-body-sm sm:grid-cols-[max-content_1fr] sm:gap-x-lg">
            <dt className="text-on-surface-muted">Model output</dt>
            <dd>{item.detail}</dd>
            <dt className="text-on-surface-muted">If approved</dt>
            <dd>{item.consequence}</dd>
          </dl>
          <div className="flex flex-wrap gap-sm">
            <button type="button" className="btn btn-primary" onClick={() => decide(true)}>
              <Check size={16} aria-hidden /> Approve
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => decide(false)}>
              <X size={16} aria-hidden /> Reject
            </button>
          </div>
        </article>
      ) : (
        <section className="card py-2xl text-center">
          <h2 className="card-title">Queue is clear</h2>
          <p className="mt-xs text-body-sm text-on-surface-muted">Every held item has a human decision for this session.</p>
          <Link href="/accounts" className="btn btn-secondary mt-md">Back to accounts</Link>
        </section>
      )}
    </div>
  );
}
