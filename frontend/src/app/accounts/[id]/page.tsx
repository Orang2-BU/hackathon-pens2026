"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, GitCommitHorizontal, Search } from "lucide-react";
import { planDecisionId, useDemoState } from "@/components/demo-state";
import { EvidenceGraph } from "@/components/evidence-graph";
import { RiskBadge } from "@/components/risk-badge";
import { accounts, factorWeight, formatMoney, isElevated, riskFactors, SCORING_VERSION, SNAPSHOT, strongestFactor, type RiskFactor } from "@/lib/accounts";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const account = accounts.find(item => item.id === id);
  const { decisions } = useDemoState();
  const [selected, setSelected] = useState<RiskFactor | undefined>(account ? strongestFactor(account) : undefined);
  const [asked, setAsked] = useState("");

  if (!account) notFound();

  const top = strongestFactor(account);
  const history = decisions.filter(decision => decision.accountId === account.id);
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
            {account.focus && <span className="badge text-on-surface">Focus</span>}
          </div>
          <p className="mt-xs text-body-sm text-on-surface-muted">
            {account.id} · Renewal {account.renewalDate} · {SCORING_VERSION}, snapshot {SNAPSHOT}
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
            <h3 className="card-title">Summary</h3>
            <p className="mt-sm max-w-[70ch] text-body-md">
              Priority score {account.priorityScore} ({account.riskLevel}). The strongest factor is {top} at {account.factorScores[top]} of 100
              (weight {factorWeight[top]}%). {account.signals.length} signals were found in the KasirNusa sources.
            </p>
            <p className="mt-sm text-label-sm text-on-surface-muted">A priority score orders the review work; it is not a churn probability.</p>
          </section>

          <section className="card" aria-labelledby="factors-heading">
            <h3 id="factors-heading" className="card-title">Factor breakdown</h3>
            <ul className="mt-sm flex flex-col gap-xs">
              {riskFactors.map(factor => {
                const value = account.factorScores[factor];
                return (
                  <li key={factor}>
                    <button
                      type="button"
                      aria-pressed={selected === factor}
                      disabled={value === 0}
                      onClick={() => setSelected(factor)}
                      className={`flex min-h-11 w-full items-center gap-sm rounded-md px-sm text-left text-body-sm ring-1 ring-inset transition-colors disabled:cursor-default disabled:text-on-surface-muted ${
                        selected === factor ? "bg-surface-elevated ring-primary" : "ring-transparent enabled:hover:bg-surface-elevated"
                      }`}
                    >
                      <span className="w-28 shrink-0">{factor}</span>
                      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-neutral" aria-hidden>
                        <span className="absolute inset-y-0 left-0 rounded-full bg-warning" style={{ width: `${value}%` }} />
                      </span>
                      <span className="w-12 text-right font-semibold">{value}</span>
                      <span className="w-12 text-right text-label-sm text-on-surface-muted">{factorWeight[factor]}%</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {account.factors.length > 0 && (
            <section className="card">
              <h3 className="card-title">Factor graph</h3>
              <div className="mt-sm">
                <EvidenceGraph account={account} selectedFactor={selected} onSelect={setSelected} />
              </div>
            </section>
          )}

          <section className="card">
            <h3 className="card-title">Signals</h3>
            {account.signals.length === 0 ? (
              <p className="mt-sm text-body-sm text-on-surface-muted">No signal was found for this account.</p>
            ) : (
              <ul className="mt-sm flex flex-col gap-sm">
                {account.signals.map(signal => (
                  <li key={signal} className="rounded-md p-md text-body-md ring-1 ring-outline ring-inset">{signal}</li>
                ))}
              </ul>
            )}
            <p className="mt-sm text-label-sm text-on-surface-muted">Source text from {SCORING_VERSION} (ingest/scores_40_v1.json). Quote spans arrive with the graph ingest.</p>
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
            {isElevated(account) ? (
              <>
                <p className="mt-sm text-body-sm">{account.plan}</p>
                <p className="mt-xs text-label-sm text-on-surface-muted">Template for the strongest factor: {top}.</p>
                <Link href={`/review?account=${account.id}`} className="btn btn-secondary mt-md">
                  {decided ? "View decision in Review" : "Review this plan"}
                </Link>
              </>
            ) : (
              <p className="mt-sm text-body-sm text-on-surface-muted">Plans are drafted for High and Critical accounts. This account stays on watch.</p>
            )}
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
