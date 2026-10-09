"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, GitCommitHorizontal, Search } from "lucide-react";
import { planDecisionId, useDemoState } from "@/components/demo-state";
import { EvidenceGraph } from "@/components/evidence-graph";
import { RiskBadge } from "@/components/risk-badge";
import { accounts, formatMoney } from "@/lib/demo-data";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const account = accounts.find(item => item.id === id);
  const { decisions } = useDemoState();
  const [selected, setSelected] = useState(account?.evidence[0]?.id ?? "");
  const [asked, setAsked] = useState("");

  if (!account) notFound();

  const history = [...account.decisions, ...decisions.filter(decision => decision.accountId === account.id)];
  const decided = decisions.some(decision => decision.id === planDecisionId(account.id));
  const figures = [
    ["Priority score", String(account.priorityScore)],
    ["Contract", formatMoney(account.contractValue, account.currency)],
    ["Weighted value", formatMoney(account.weightedValue, account.currency)],
  ];

  return (
    <div className="flex flex-col gap-md">
      <Link href="/accounts" className="inline-flex min-h-11 w-fit items-center gap-xs text-label-md text-on-surface-muted transition-colors hover:text-on-surface">
        <ArrowLeft size={16} aria-hidden /> Accounts
      </Link>

      <section className="card flex flex-wrap items-end gap-lg">
        <div className="mr-auto min-w-0">
          <div className="flex flex-wrap items-center gap-sm">
            <h2 className="text-headline-md font-semibold tracking-headline-md">{account.name}</h2>
            <RiskBadge level={account.riskLevel} />
          </div>
          <p className="mt-xs text-body-sm text-on-surface-muted">
            {account.domain} · Renewal {account.renewalDate} · {account.sourceCoverage}
          </p>
        </div>
        <dl className="flex flex-wrap gap-lg">
          {figures.map(([term, value]) => (
            <div key={term}>
              <dt className="text-label-sm text-on-surface-muted">{term}</dt>
              <dd className="mt-xs text-display-number-sm font-bold tracking-display-number-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-md xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-md">
          <section className="card">
            <h3 className="card-title">Answer</h3>
            <p className="mt-sm max-w-[70ch] text-body-md">{account.answer}</p>
            <p className="mt-sm text-label-sm text-on-surface-muted">
              Grounded in {account.evidence.length} source quotes. Select a quote or node to trace it.
            </p>
          </section>

          <section className="card">
            <h3 className="card-title">Evidence path</h3>
            <div className="mt-sm">
              <EvidenceGraph account={account} selectedEvidence={selected} onSelect={setSelected} />
            </div>
          </section>

          <section className="card">
            <h3 className="card-title">Source quotes</h3>
            <ul className="mt-sm flex flex-col gap-sm">
              {account.evidence.map(evidence => (
                <li key={evidence.id}>
                  <button
                    type="button"
                    aria-pressed={selected === evidence.id}
                    onClick={() => setSelected(evidence.id)}
                    className={`w-full rounded-md p-md text-left ring-1 ring-inset transition-colors ${
                      selected === evidence.id ? "bg-surface-elevated ring-primary" : "ring-outline hover:ring-outline-active"
                    }`}
                  >
                    <span className="flex flex-wrap items-center gap-sm text-label-sm text-on-surface-muted">
                      <span className="label-caps text-on-surface">{evidence.kind}</span>
                      <span>{evidence.source}</span>
                      <span>{evidence.date}</span>
                      <span className="ml-auto">Confidence {Math.round(evidence.confidence * 100)}%</span>
                    </span>
                    <span className="mt-sm block text-body-md italic">“{evidence.quote}”</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-md xl:sticky xl:top-md">
          <section className="card">
            <h3 className="card-title">Ask the graph</h3>
            <form
              className="relative mt-sm"
              onSubmit={event => {
                event.preventDefault();
                setAsked(String(new FormData(event.currentTarget).get("question") ?? "").trim());
              }}
            >
              <label htmlFor="question" className="sr-only">Question about this account</label>
              <input
                id="question"
                name="question"
                required
                placeholder="Which tickets link this account to a bug?"
                className="h-11 w-full rounded-md bg-neutral pl-sm pr-11 text-body-sm ring-1 ring-outline ring-inset placeholder:text-on-surface-muted focus-visible:ring-primary"
              />
              <button type="submit" aria-label="Ask" className="absolute right-0 top-0 grid size-11 place-items-center text-on-surface-muted hover:text-on-surface">
                <Search size={18} aria-hidden />
              </button>
            </form>
            <p role="status" className="mt-sm text-body-sm text-on-surface-muted">
              {asked && <>Not enough evidence to answer “{asked}”. The graph query engine runs after ingest (T2–T4); until then Tessera abstains instead of guessing.</>}
            </p>
          </section>

          <section className="card">
            <h3 className="card-title">Save plan draft</h3>
            <p className="mt-sm text-body-sm">{account.plan}</p>
            <Link href={`/review?account=${account.id}`} className="btn btn-secondary mt-md">
              {decided ? "View decision in Review" : "Review this plan"}
            </Link>
          </section>

          <section className="card">
            <h3 className="card-title">Decision history</h3>
            {history.length === 0 ? (
              <p className="mt-sm text-body-sm text-on-surface-muted">No decisions recorded for this account yet.</p>
            ) : (
              <ul className="mt-sm flex flex-col gap-md">
                {history.map(decision => (
                  <li key={decision.id} className="flex gap-sm">
                    <GitCommitHorizontal size={18} aria-hidden className="mt-0.5 shrink-0 text-graph-decision" />
                    <div className="min-w-0">
                      <p className="text-label-md font-semibold">{decision.action}</p>
                      <p className="text-label-sm text-on-surface-muted">{decision.decidedAt}</p>
                      <p className="mt-xs text-body-sm text-on-surface-muted">{decision.rationale}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
