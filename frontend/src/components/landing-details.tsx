import { ArrowDown, ArrowRight, Check, ChevronDown, FileCheck2, GitBranch, Search, ShieldCheck } from "lucide-react";
import { FeatureBento } from "@/components/feature-bento";
import { EvidenceMap } from "@/components/evidence-map";
import { Parallax } from "@/components/ui/parallax";
import { Reveal } from "@/components/ui/reveal";
import { factorWeight, riskFactors } from "@/lib/factors";
import Link from "next/link";
import type { ReactNode } from "react";

function Heading({ id, label, title, children }: { id: string; label: string; title: string; children: ReactNode }) {
  return <div className="max-w-(--container-2xl)"><p className="label-caps text-primary">{label}</p><h2 id={id} tabIndex={-1} className="mt-sm scroll-mt-28 text-headline-lg font-bold tracking-headline-lg">{title}</h2><p className="mt-md text-body-md text-on-surface-muted">{children}</p></div>;
}

const factorDetails = {
  Usage: "Adoption and changes in product activity",
  Service: "Unresolved issues and service disruption",
  Champion: "Changes in key customer relationships",
  Commitments: "Promises, follow-ups and engagement",
  Payment: "Payment delays and billing context",
};
const questions = [
  { title: "Who is Tessera for?", answer: "Customer Success teams and account managers who need to choose which customers to review, understand the reasons and agree on the next action. Team leads can use the same context to review priorities and plans." },
  { title: "Does it replace our CRM?", answer: "Tessera is designed to connect context around your existing customer records. CRM, usage, support, conversations, contracts and past decisions each contribute a different part of the picture. Live source connectors are being integrated; this preview does not connect to your production systems." },
  { title: "Is a priority score a prediction of churn?", answer: "No. It is a weighted index for ordering reviews. The factors and their weights should be inspected alongside coverage, renewal timing and contract value. A priority score is not a calibrated probability that a customer will leave." },
  { title: "What does the AI decide?", answer: "The intended workflow uses AI to classify ambiguous text into signals. Code computes numerical factors and priorities. Your team checks the evidence and decides what to do. The current preview uses sample data and template-based drafts; live AI is not connected to this preview." },
  { title: "Will Tessera send anything to our customers?", answer: "No customer emails or outreach are sent from this preview. Approve and reject are review actions. Your team remains responsible for the customer conversation and the final decision." },
  { title: "Can it keep knowledge when a teammate leaves?", answer: "The product direction is to preserve decisions, reasons and outcomes as shared team context. That requires recorded actions and outcomes; a cache alone does not teach a model someone’s expertise. Persistent team history is being integrated. Decisions in the current preview reset when you refresh." },
];

export function LandingDetails({ workspaceHref }: { workspaceHref: string }) {
  return (
    <>
      <section aria-labelledby="evidence-heading" className="flex flex-col gap-xl">
        <Reveal><Heading id="evidence-heading" label="01 / Connected evidence" title="The whole relationship, in one view.">A usage dip, an open ticket and a missed follow-up can look unrelated in separate tools. Bring them around one customer account so your team can see what changed, where it came from and what still needs checking.</Heading></Reveal>
        <Reveal><EvidenceMap /></Reveal>
        <div className="grid gap-lg border-t border-outline pt-lg md:grid-cols-3">
          {[
            { icon: GitBranch, title: "Follow the connection", text: "Trace relationships between accounts, contacts, issues and decisions. Look beyond a single account when an issue affects more than one customer." },
            { icon: Search, title: "Inspect the source", text: "Read the original context, its date and its coverage. Distinguish a recorded fact from a derived link that still needs a person to confirm it." },
            { icon: ShieldCheck, title: "Keep uncertainty visible", text: "Missing data is not a healthy signal. Incomplete evidence should lead to a check, rather than a confident answer without support." },
          ].map(({ icon: Icon, title, text }, index) => <Reveal key={title} delay={index * 0.06}><Icon size={20} strokeWidth={1.75} className="text-on-surface-muted" aria-hidden /><h3 className="mt-md text-title font-semibold">{title}</h3><p className="mt-sm text-body-sm text-on-surface-muted">{text}</p></Reveal>)}
        </div>
      </section>

      <section aria-labelledby="workflow-heading" className="flex flex-col gap-xl">
        <Reveal><Heading id="workflow-heading" label="02 / Your daily workflow" title="From scattered signals to a considered next step.">Start with the accounts that need attention. Understand the evidence, then review a response with the people who own the relationship.</Heading></Reveal>
        <FeatureBento />
        <ol className="grid gap-lg md:grid-cols-3">
          {[
            { title: "Find the right account", text: "Review priority, renewal timing and the strongest contributing factor. Use that context to choose where your team should spend its attention.", result: "A clear starting point" },
            { title: "Understand the situation", text: "Inspect the connected evidence and follow its timeline. Check whether a drop reflects customer behavior, a service issue or incomplete data.", result: "A reason you can explain" },
            { title: "Review the next action", text: "Read the draft plan, check its reasoning and discuss changes. Approve or reject deliberately before anyone acts on the recommendation.", result: "A decision owned by your team" },
          ].map(({ title, text, result }, index) => <Reveal key={title} as="li" delay={index * 0.08} className="border-t border-outline pt-lg"><span className="text-display-number-sm font-semibold text-on-surface-muted">0{index + 1}</span><h3 className="mt-md text-title font-semibold">{title}</h3><p className="mt-sm text-body-md text-on-surface-muted">{text}</p><p className="mt-lg flex items-center gap-sm text-label-md"><ArrowRight size={16} className="text-primary" aria-hidden />{result}</p></Reveal>)}
        </ol>
      </section>

      <section aria-labelledby="priority-heading" className="grid items-center gap-xl lg:grid-cols-2">
        <Reveal><Heading id="priority-heading" label="03 / Explainable priority" title="Know why an account comes first.">A single health label cannot explain the whole relationship. Tessera’s priority model separates five factors, so your team can inspect what drives the ranking.</Heading><ul className="mt-lg flex flex-col gap-md text-body-md">{["Inspect the factor behind the priority.", "Check coverage before trusting a change.", "Treat renewal timing as urgency, separately from risk."].map(text => <li key={text} className="flex items-start gap-sm"><Check size={18} className="mt-xs shrink-0 text-primary" aria-hidden />{text}</li>)}</ul><p className="mt-lg text-body-sm text-on-surface-muted">Priority helps order the work. It does not measure the probability of churn.</p></Reveal>
        <Parallax><Reveal><div className="rounded-lg bg-surface p-lg md:p-xl"><div className="flex flex-wrap items-center justify-between gap-md"><h3 className="text-title font-semibold">What contributes to priority</h3><span className="badge text-on-surface-muted">Model weights</span></div><ul className="mt-lg flex flex-col gap-lg">{riskFactors.map(factor => <li key={factor}><div className="flex items-center justify-between gap-md"><span className="text-label-md font-semibold">{factor}</span><span className="text-label-md text-on-surface-muted">{factorWeight[factor]}%</span></div><p className="mt-xs text-body-sm text-on-surface-muted">{factorDetails[factor]}</p><div className="mt-sm h-1.5 overflow-hidden rounded-full bg-surface-elevated" aria-hidden><div className="metric-fill h-full rounded-full bg-chart-soft" style={{ width: `${factorWeight[factor]}%` }} /></div></li>)}</ul><p className="mt-lg border-t border-outline pt-md text-label-sm text-on-surface-muted">Current heuristic weights. These describe the model, not a customer’s score.</p></div></Reveal></Parallax>
      </section>

      <section aria-labelledby="value-heading" className="grid items-center gap-xl lg:grid-cols-2">
        <Parallax className="order-2 lg:order-1"><Reveal><div className="rounded-lg bg-surface p-lg md:p-xl"><p className="label-caps text-on-surface-muted">Financial context</p><h3 className="mt-md text-title font-semibold">Annual contract value</h3><p className="mt-sm text-body-sm text-on-surface-muted">The size of the relationship, in its original currency.</p><ArrowDown size={20} className="my-lg text-on-surface-muted" aria-hidden /><h3 className="text-title font-semibold">Weighted value for priority</h3><p className="mt-sm rounded-md bg-surface-elevated p-md text-body-md">Annual value × priority score ÷ 100</p><p className="mt-lg text-body-sm text-on-surface-muted">Read this beside renewal timing and evidence. It is a prioritization measure, not an expected loss.</p></div></Reveal></Parallax>
        <Reveal className="order-1 lg:order-2"><Heading id="value-heading" label="04 / Business context" title="See the value of the relationship before you act.">Put the annual contract value and renewal date beside the risk factors. Your team can weigh urgency and commercial context without confusing a score with money that will definitely be lost.</Heading><p className="mt-lg text-body-md text-on-surface-muted">Questions about discounts, recovery costs or a projected outcome need supporting data. When that data is missing, the assumption should stay visible.</p></Reveal>
      </section>

      <section aria-labelledby="decide-heading" className="grid items-center gap-xl lg:grid-cols-2">
        <Reveal><Heading id="decide-heading" label="05 / Human decisions" title="A recommendation starts the conversation. Your team makes the call.">A draft gives your team a starting point. Check the evidence, compare it with previous decisions and agree on a response that fits the customer.</Heading><p className="mt-lg text-body-md text-on-surface-muted">Feedback and approval serve different purposes. Discussing a plan does not silently change its score or approve it.</p><Link href={workspaceHref} className="btn btn-secondary mt-lg">Explore the review workflow <ArrowRight size={16} aria-hidden /></Link></Reveal>
        <Parallax><Reveal><div className="rounded-lg bg-surface p-lg md:p-xl"><FileCheck2 size={24} strokeWidth={1.75} className="text-primary" aria-hidden /><h3 className="mt-md text-title font-semibold">Before a plan becomes a decision</h3><ol className="mt-lg flex flex-col gap-lg">{["Check the reason and supporting evidence.", "Compare the proposed action with past decisions.", "Discuss changes and record the reviewer’s reasoning."].map((text, index) => <li key={text} className="flex gap-md"><span className="grid size-8 shrink-0 place-items-center rounded-sm bg-surface-elevated text-label-sm text-on-surface-muted">{index + 1}</span><span className="text-body-md">{text}</span></li>)}</ol><p className="mt-lg border-t border-outline pt-md text-body-sm text-on-surface-muted">Approval is a human review step. No customer email is sent.</p></div></Reveal></Parallax>
      </section>

      <section aria-labelledby="memory-heading" className="border-y border-outline py-xl md:py-2xl">
        <Reveal><Heading id="memory-heading" label="Product direction / Shared team context" title="Keep the reasoning with the team.">When an experienced teammate leaves, their customer knowledge should not disappear with them. Tessera’s direction is to keep actions, reasons and outcomes connected to the account, so the next person has context to work from.</Heading><p className="mt-lg max-w-(--container-2xl) text-body-md text-on-surface-muted">That history can inform future recommendations while people keep responsibility for the decision. It depends on recorded outcomes and review, rather than a claim that AI has automatically learned someone’s expertise.</p><p className="mt-md text-label-sm text-on-surface-muted">Persistent team history is being integrated. Preview decisions currently reset on refresh.</p></Reveal>
      </section>

      <section aria-labelledby="faq-heading" className="grid items-start gap-xl lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <Reveal><Heading id="faq-heading" label="Questions, answered" title="A clearer picture before you get started.">What the tool is designed for, how to read its priorities and where the current preview’s boundaries are.</Heading></Reveal>
        <div>{questions.map(({ title, answer }) => <details key={title} className="group border-b border-outline first:border-t"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-md py-lg text-body-md font-medium marker:content-none"><span>{title}</span><ChevronDown size={18} className="shrink-0 text-on-surface-muted transition-transform group-open:rotate-180" aria-hidden /></summary><p className="pb-lg pr-lg text-body-md text-on-surface-muted">{answer}</p></details>)}</div>
      </section>
    </>
  );
}
