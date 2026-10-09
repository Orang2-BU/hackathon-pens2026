"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, GitCommitHorizontal, MessageSquare, X } from "lucide-react";
import { planDecisionId, useDemoState, usePendingPlans } from "@/components/demo-state";
import { RiskBadge } from "@/components/risk-badge";
import { accounts } from "@/lib/demo-data";

const field = "w-full rounded-md bg-neutral p-sm text-body-sm ring-1 ring-outline ring-inset placeholder:text-on-surface-muted focus-visible:ring-primary";

export default function ReviewPage() {
  const requested = useSearchParams().get("account");
  const pending = usePendingPlans();
  const { decisions, addDecision, feedback, addFeedback, replyFeedback } = useDemoState();
  const account = accounts.find(item => item.id === requested) ?? pending[0];
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!account) {
    return (
      <section className="card mx-auto max-w-3xl py-2xl text-center">
        <h2 className="card-title">Every plan has a decision</h2>
        <p className="mt-xs text-body-sm text-on-surface-muted">Approved and rejected plans are listed in each account’s decision history.</p>
        <Link href="/accounts" className="btn btn-secondary mt-md">Back to accounts</Link>
      </section>
    );
  }

  const draft = drafts[account.id] ?? account.plan;
  const decision = decisions.find(item => item.id === planDecisionId(account.id));
  const thread = feedback.filter(item => item.accountId === account.id);

  const decide = (approved: boolean) =>
    addDecision({
      id: planDecisionId(account.id),
      accountId: account.id,
      action: approved ? "Save plan approved" : "Save plan rejected",
      rationale: draft,
      decidedAt: new Date().toISOString().slice(0, 10),
    });

  return (
    <div className="grid items-start gap-md xl:grid-cols-[minmax(0,1fr)_360px]">
      <article className="card flex flex-col gap-md">
        <div className="flex flex-wrap items-center gap-sm text-label-sm text-on-surface-muted">
          <RiskBadge level={account.riskLevel} />
          <Link href={`/accounts/${account.id}`} className="underline-offset-4 hover:text-on-surface hover:underline">{account.name}</Link>
          <span>Renewal {account.renewalDate}</span>
          <span className="ml-auto">{pending.length} plans waiting</span>
        </div>
        <h2 className="text-headline-md font-semibold tracking-headline-md">Save plan</h2>

        <label htmlFor="plan" className="sr-only">Save plan draft</label>
        <textarea
          id="plan"
          rows={6}
          value={draft}
          disabled={Boolean(decision)}
          onChange={event => setDrafts(current => ({ ...current, [account.id]: event.target.value }))}
          className={`${field} resize-y disabled:opacity-60`}
        />

        <section>
          <h3 className="label-caps text-on-surface-muted">Precedent</h3>
          {account.decisions.length === 0 ? (
            <p className="mt-xs text-body-sm text-on-surface-muted">No earlier decision for a similar pattern. This plan sets a new precedent.</p>
          ) : (
            <ul className="mt-xs flex flex-col gap-sm">
              {account.decisions.map(item => (
                <li key={item.id} className="flex gap-sm text-body-sm">
                  <GitCommitHorizontal size={18} aria-hidden className="mt-0.5 shrink-0 text-graph-decision" />
                  <span><span className="font-semibold">{item.action}</span> · {item.decidedAt}<br /><span className="text-on-surface-muted">{item.rationale}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {decision ? (
          <p role="status" className="text-label-md text-success">{decision.action} on {decision.decidedAt}. Recorded append-only; no email was sent.</p>
        ) : (
          <div className="flex flex-wrap gap-sm">
            <button type="button" className="btn btn-primary" disabled={!draft.trim()} onClick={() => decide(true)}>
              <Check size={16} aria-hidden /> Approve plan — no email sent
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => decide(false)}>
              <X size={16} aria-hidden /> Reject
            </button>
          </div>
        )}
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
