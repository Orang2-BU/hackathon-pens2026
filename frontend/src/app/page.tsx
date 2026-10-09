import Link from "next/link";
import { ArrowRight, BellRing, CalendarClock, GitBranch, MessagesSquare, ShieldCheck, UserRoundSearch } from "lucide-react";
import { accounts, formatMoney } from "@/lib/accounts";
import { RiskBadge } from "@/components/risk-badge";
import { BeamVisual } from "@/components/beam-visual";

const top = [...accounts].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
const critical = accounts.filter(a => a.riskLevel === "Critical");
const weightedCritical = critical.reduce((sum, a) => sum + a.weightedValue, 0);
const totalContracts = accounts.reduce((sum, a) => sum + a.contractValue, 0);

const heroCase = [
  "Champion moved to a prospect company, CRM never updated",
  "Accounting integration (FEAT-07) promised, still undelivered",
  "Escalation open since 14 Jul 2026 with no owner",
  "Renewal email sent 25 Sep 2026, never answered",
];

const steps = [
  {
    title: "Ingest",
    body: "15 source files — CRM, contracts, tickets, usage, billing, decision logs — are loaded into PostgreSQL, not pasted into the frontend.",
  },
  {
    title: "Score in code",
    body: "Five weighted factors (usage 30, service 25, champion 20, commitments 15, payment 10) are computed deterministically, so every point can be traced to its evidence.",
  },
  {
    title: "Classify free text",
    body: "Jev reads what rules cannot — emails and ticket text — and returns typed signals with confidence. Above 0.80 it lands in the graph, 0.50–0.80 waits for a human, below that it is dropped.",
  },
  {
    title: "Act before renewal",
    body: "Save plans are drafted with cited evidence and approved by a human. When an account turns critical, the account manager gets a Telegram early warning.",
  },
];

const features = [
  {
    icon: GitBranch,
    title: "Evidence paths, not scores from nowhere",
    body: "Every priority score opens into the exact chain behind it: who left, which ticket is stuck, which promise slipped.",
  },
  {
    icon: MessagesSquare,
    title: "Derived bug links",
    body: "C03 and C05 look like churn until the graph connects offline outlets, the v4.12 timing, and ticket wording to BUG-412 — labeled derived, never claimed as a hard link.",
  },
  {
    icon: UserRoundSearch,
    title: "Champion tracking",
    body: "C01 champion Rina Hapsari now works at prospect P01. The CRM still lists her as the contact. Tessera flags the gap.",
  },
  {
    icon: CalendarClock,
    title: "Projection to renewal",
    body: "Usage trend is extended to the renewal date, so the team sees where an account lands if nothing changes — and can still act.",
  },
  {
    icon: ShieldCheck,
    title: "Human in the loop",
    body: "Nothing reaches a customer automatically. Plans are drafts until an account manager approves them, and every decision is recorded.",
  },
  {
    icon: BellRing,
    title: "Early warning on Telegram",
    body: "A warning that sits in a dashboard helps nobody. When an account crosses into Critical, its manager is notified with the top reason and a link.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-neutral text-on-surface">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-sm px-md py-md">
        <Link href="/" className="flex items-center gap-sm">
          <span className="grid size-8 place-items-center rounded-sm bg-primary text-on-primary">
            <svg viewBox="56 56 144 144" className="size-4" aria-hidden>
              <path fill="currentColor" d="M56 56H200V104H152V200L104 152V104Z" />
            </svg>
          </span>
          <span className="card-title">Tessera</span>
        </Link>
        <nav className="ml-auto flex items-center gap-sm text-label-md">
          <a href="#problem" className="hidden px-sm text-on-surface-muted transition-colors hover:text-on-surface md:block">The problem</a>
          <a href="#how" className="hidden px-sm text-on-surface-muted transition-colors hover:text-on-surface md:block">How it works</a>
          <a href="#ranking" className="hidden px-sm text-on-surface-muted transition-colors hover:text-on-surface md:block">Live ranking</a>
          <Link href="/login" className="rounded-full px-md py-2 ring-1 ring-outline transition-colors hover:bg-surface-elevated">Sign in</Link>
          <Link href="/login?next=/dashboard" className="rounded-full bg-primary px-md py-2 font-semibold text-on-primary transition-opacity hover:opacity-90">Open dashboard</Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-md pb-xl">
        <section className="grid items-center gap-lg py-lg xl:grid-cols-2">
          <div className="flex flex-col gap-md">
            <p className="label-caps text-primary">Churn Early Warning Graph · KasirNusa Customer Success</p>
            <h1 className="text-headline-lg font-bold tracking-headline-lg">
              Your dashboard says healthy.<br />Your best account is already leaving.
            </h1>
            <p className="max-w-xl text-body-md text-on-surface-muted">
              Tessera connects the CRM, support, usage, and billing data of PT KasirNusa Teknologi into one context graph,
              ranks all 40 accounts by evidence-backed priority, and warns the account manager while renewal can still be saved.
            </p>
            <div className="flex flex-wrap gap-sm">
              <Link href="/login?next=/dashboard" className="flex items-center gap-sm rounded-full bg-primary px-md py-3 font-semibold text-on-primary transition-opacity hover:opacity-90">
                Open the live demo <ArrowRight size={18} aria-hidden />
              </Link>
              <a href="#how" className="rounded-full bg-surface px-md py-3 ring-1 ring-outline transition-colors hover:bg-surface-elevated">See how it works</a>
            </div>
            <p className="text-body-sm text-on-surface-muted">
              Live on real processed data — dataset snapshot 1 Oct 2026, scoring v1.
            </p>
          </div>

          <div id="ranking" className="card-featured edge-glow flex flex-col gap-sm">
            <div className="flex items-baseline justify-between gap-sm">
              <h2 className="card-title">Renewal watchlist</h2>
              <span className="text-label-md text-on-surface-muted">Top 5 of {accounts.length} accounts</span>
            </div>
            <ul className="flex flex-col">
              {top.map((account, index) => (
                <li key={account.id} className="flex items-center gap-sm border-b border-outline py-sm last:border-0">
                  <span className="w-6 text-label-md text-on-surface-muted">#{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-md font-semibold">{account.name}</span>
                    <span className="block text-body-sm text-on-surface-muted">{account.id} · renewal {account.renewalDate}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-body-md font-bold">{account.priorityScore.toFixed(1)}</span>
                    <span className="block text-body-sm text-on-surface-muted">{formatMoney(account.weightedValue, account.currency, true)} weighted</span>
                  </span>
                  <RiskBadge level={account.riskLevel} />
                </li>
              ))}
            </ul>
            <p className="text-body-sm text-on-surface-muted">
              {critical.length} accounts are Critical right now — {formatMoney(weightedCritical, "IDR", true)} of weighted priority value.
              The account on top is worth {formatMoney(top[0].contractValue, top[0].currency, true)} a year on its own.
            </p>
          </div>
        </section>

        <section id="problem" className="card flex flex-col gap-md">
          <p className="label-caps text-warning">The problem</p>
          <h2 className="text-title font-semibold">C01 Kopi Lintas Nusantara is flagged “healthy” today</h2>
          <p className="max-w-3xl text-body-md text-on-surface-muted">
            Usage is flat, so the old dashboard stays green. The risk lives in four other systems — and none of them talk to each other.
          </p>
          <ul className="grid gap-sm md:grid-cols-2">
            {heroCase.map(item => (
              <li key={item} className="rounded-md bg-surface-elevated p-md text-body-sm">{item}</li>
            ))}
          </ul>
          <p className="text-body-sm text-on-surface-muted">
            Losing C01 alone ({formatMoney(top[0].contractValue, top[0].currency, true)}/year) already breaks the 5% yearly loss budget of{" "}
            {formatMoney(Math.round(totalContracts * 0.05), "IDR", true)} on {formatMoney(totalContracts, "IDR", true)} of total contracts.
          </p>
        </section>

        <section id="how" className="flex flex-col gap-md py-lg">
          <p className="label-caps text-primary">How it works</p>
          <BeamVisual />
          <div className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="card edge-glow flex flex-col gap-sm">
                <span className="text-label-md font-bold text-primary">0{index + 1}</span>
                <h3 className="card-title">{step.title}</h3>
                <p className="text-body-sm text-on-surface-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-md pb-lg">
          <p className="label-caps text-primary">What the graph gives you</p>
          <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
            {features.map(feature => (
              <article key={feature.title} className="card flex flex-col gap-sm">
                <feature.icon size={22} className="text-primary" aria-hidden />
                <h3 className="text-body-md font-semibold">{feature.title}</h3>
                <p className="text-body-sm text-on-surface-muted">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card-featured edge-glow flex flex-col items-start gap-md">
          <h2 className="text-title font-semibold">See the ranking the dashboard cannot show you</h2>
          <p className="max-w-2xl text-body-md text-on-surface-muted">
            Sign in with the demo password and open C01. Follow the evidence path yourself — every number on that page can be traced back to a source record.
          </p>
          <Link href="/login?next=/dashboard" className="flex items-center gap-sm rounded-full bg-primary px-md py-3 font-semibold text-on-primary transition-opacity hover:opacity-90">
            Open the live demo <ArrowRight size={18} aria-hidden />
          </Link>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap gap-sm px-md pb-lg text-body-sm text-on-surface-muted">
        <span>Tessera — Churn Early Warning Graph</span>
        <span className="ml-auto">PENS Hackathon 2026 · Tim 1 Customer Success · Dummy dataset by PT KasirNusa Teknologi (fictional, committee-provided)</span>
      </footer>
    </div>
  );
}
