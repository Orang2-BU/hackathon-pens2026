"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, CircleCheck, CircleDashed, CircleX, MessageSquare, X } from "lucide-react";
import { planDecisionId, useDemoState, usePendingPlans } from "@/components/demo-state";
import { RiskBadge } from "@/components/risk-badge";
import { accounts, daysToRenewal, factorWeight, formatMoney, isElevated, signalFactor, strongestFactor, type RiskLevel } from "@/lib/accounts";

const levelRank: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

// Plans exist for High and Critical accounts; most urgent first.
const queue = accounts
  .filter(isElevated)
  .sort((a, b) => levelRank[a.riskLevel] - levelRank[b.riskLevel] || a.renewalDate.localeCompare(b.renewalDate));

const field = "w-full rounded-md bg-neutral p-sm text-body-sm ring-1 ring-outline ring-inset placeholder:text-on-surface-muted focus-visible:ring-primary";

export default function ReviewPage() {
  const requested = useSearchParams().get("account");
  const pending = usePendingPlans();
  const { decisions, addDecision, feedback, addFeedback, replyFeedback } = useDemoState();
  const account = accounts.find(item => item.id === requested) ?? pending[0] ?? queue[0];
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);

  const draft = drafts[account.id] ?? account.plan;
  const decision = decisions.find(item => item.id === planDecisionId(account.id));
  const thread = feedback.filter(item => item.accountId === account.id);

  const top = strongestFactor(account);
  const statusOf = (id: string) => decisions.find(item => item.id === planDecisionId(id))?.action;

  // Approve records the plan text; reject records the reviewer's reason.
  const decide = (approved: boolean, rationale: string) => {
    addDecision({
      id: planDecisionId(account.id),
      accountId: account.id,
      action: approved ? "Save plan approved" : "Save plan rejected",
      rationale,
      decidedAt: new Date().toISOString().slice(0, 10),
    });
    setRejecting(null);
  };

  return (
    <div className="grid items-start gap-md xl:grid-cols-[300px_minmax(0,1fr)_300px]">
      <nav aria-label="Plan queue" className="card flex flex-col gap-xs">
        <p className="label-caps px-sm text-on-surface-muted">Queue · {pending.length} waiting</p>
        {queue.map(item => {
          const status = statusOf(item.id);
          const Icon = !status ? CircleDashed : status.includes("approved") ? CircleCheck : CircleX;
          return (
            <Link
              key={item.id}
              href={`/review?account=${item.id}`}
              aria-current={item.id === account.id ? "page" : undefined}
              className={`flex min-h-11 items-center gap-sm rounded-md px-sm py-xs text-body-sm transition-colors ${
                item.id === account.id ? "bg-surface-elevated ring-1 ring-primary ring-inset" : "hover:bg-surface-elevated"
              }`}
            >
              <Icon size={16} aria-label={status ?? "Waiting"} className={status ? (status.includes("approved") ? "shrink-0 text-success" : "shrink-0 text-danger") : "shrink-0 text-on-surface-muted"} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{item.name}</span>
                <span className="block text-label-sm text-on-surface-muted">{item.id} · {daysToRenewal(item)} days to renewal</span>
              </span>
              <RiskBadge level={item.riskLevel} />
            </Link>
          );
        })}
      </nav>

      <article className="card flex flex-col gap-md">
        <div>
          <p className="label-caps text-on-surface-muted">Save plan · {account.id}</p>
          <div className="mt-xs flex flex-wrap items-center gap-sm">
            <h2 className="text-headline-md font-semibold tracking-headline-md">
              <Link href={`/accounts/${account.id}`} className="underline-offset-4 hover:underline">{account.name}</Link>
            </h2>
            <RiskBadge level={account.riskLevel} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-md sm:grid-cols-4">
          {[
            ["Priority score", String(account.priorityScore)],
            [`Renewal ${account.renewalDate}`, `${daysToRenewal(account)} days`],
            ["Contract", formatMoney(account.contractValue, account.currency, true)],
            ["Weighted value", formatMoney(account.weightedValue, account.currency, true)],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="text-label-sm text-on-surface-muted">{term}</dt>
              <dd className="mt-xs text-title font-bold">{value}</dd>
            </div>
          ))}
        </dl>

        <label htmlFor="plan" className="sr-only">Save plan draft</label>
        <textarea
          id="plan"
          rows={3}
          value={draft}
          disabled={Boolean(decision)}
          onChange={event => setDrafts(current => ({ ...current, [account.id]: event.target.value }))}
          className={`${field} field-sizing-content min-h-20 resize-y disabled:opacity-60`}
        />

        <section>
          <h3 className="label-caps text-on-surface-muted">Why this plan</h3>
          <p className="mt-xs text-body-sm">
            Strongest factor: <span className="font-semibold">{top}</span> at {account.factorScores[top]} of 100 (weight {factorWeight[top]}%).
          </p>
          {account.signals.length > 0 && (
            <>
              <ul className="mt-sm flex flex-col gap-xs">
                {account.signals.map(signal => {
                  const lead = signalFactor(signal) === top;
                  return (
                    <li
                      key={signal}
                      className={`flex items-start gap-sm rounded-md px-sm py-xs text-body-sm ${lead ? "bg-surface-elevated font-semibold ring-1 ring-warning ring-inset" : "bg-surface-elevated text-on-surface-muted"}`}
                    >
                      <span className="flex-1">{signal}</span>
                      {signalFactor(signal) && <span className="label-caps shrink-0 pt-0.5 text-on-surface-muted">{signalFactor(signal)}</span>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-xs text-label-sm text-on-surface-muted">Source text from the KasirNusa dataset, shown as written.</p>
            </>
          )}
        </section>

        <section>
          <h3 className="label-caps text-on-surface-muted">Precedent</h3>
          <p className="mt-xs text-body-sm text-on-surface-muted">
            No earlier decision is loaded yet. Similar past decisions will be cited here once the decision log is ingested.
          </p>
        </section>

        <div className="glass sticky bottom-md z-10 -mx-sm rounded-md p-sm">
          {decision ? (
            <p role="status" className="text-label-md text-success">{decision.action} on {decision.decidedAt}. Recorded append-only; no email was sent.</p>
          ) : rejecting !== null ? (
            <form
              className="flex flex-wrap items-center gap-sm"
              onSubmit={event => {
                event.preventDefault();
                if (rejecting.trim()) decide(false, rejecting.trim());
              }}
            >
              <label htmlFor="reject-reason" className="sr-only">Reason for rejecting</label>
              <input
                id="reject-reason"
                autoFocus
                required
                value={rejecting}
                onChange={event => setRejecting(event.target.value)}
                placeholder="Why reject this plan?"
                className={`${field} h-11 min-w-0 flex-1`}
              />
              <button type="submit" className="btn btn-secondary">Confirm reject</button>
              <button type="button" className="btn btn-secondary" onClick={() => setRejecting(null)}>Cancel</button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-sm">
              <button type="button" className="btn btn-primary" disabled={!draft.trim()} onClick={() => decide(true, draft)}>
                <Check size={16} aria-hidden /> Approve plan — no email sent
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setRejecting("")}>
                <X size={16} aria-hidden /> Reject
              </button>
            </div>
          )}
        </div>
      </article>

      <section className="card flex flex-col gap-md xl:sticky xl:top-md" aria-labelledby="feedback-heading">
        <h2 id="feedback-heading" className="card-title flex items-center gap-sm">
          <MessageSquare size={18} aria-hidden className="text-on-surface-muted" /> Feedback
        </h2>
        <p className="text-label-sm text-on-surface-muted">Opinions and replies are kept apart from the decision; they never change the score or the plan by themselves.</p>

        {thread.length > 0 && (
          <ul className="flex flex-col gap-sm">
            {thread.map(item => (
              <li key={item.id} className="rounded-md bg-surface-elevated p-sm text-body-sm">
                <p>{item.text}</p>
                <p className="mt-xs text-label-sm text-on-surface-muted">App user · {item.createdAt}</p>
                {item.reply ? (
                  <p className="mt-sm border-t border-outline pt-sm"><span className="text-label-sm text-on-surface-muted">CSM reply · </span>{item.reply}</p>
                ) : (
                  <form
                    className="mt-sm flex gap-xs"
                    onSubmit={event => {
                      event.preventDefault();
                      const reply = String(new FormData(event.currentTarget).get("reply") ?? "").trim();
                      if (reply) replyFeedback(item.id, reply);
                    }}
                  >
                    <label htmlFor={`reply-${item.id}`} className="sr-only">Reply as CSM</label>
                    <input id={`reply-${item.id}`} name="reply" required placeholder="Reply as CSM" className={`${field} h-11`} />
                    <button type="submit" className="btn btn-secondary shrink-0">Reply</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex flex-col gap-sm"
          onSubmit={event => {
            event.preventDefault();
            const form = event.currentTarget;
            const text = String(new FormData(form).get("feedback") ?? "").trim();
            if (text) addFeedback(account.id, text);
            form.reset();
          }}
        >
          <label htmlFor="feedback" className="sr-only">Your feedback on this plan</label>
          <textarea id="feedback" name="feedback" rows={3} required placeholder="What would you change in this plan?" className={`${field} resize-y`} />
          <button type="submit" className="btn btn-secondary self-start">Send feedback</button>
        </form>
      </section>
    </div>
  );
}
