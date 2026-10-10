"use client";
import { Building2, CalendarClock, ClipboardList, Database, GitBranch, Globe, LayoutDashboard, LogOut, Scale, Search, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { RenewalExposure } from "@/components/renewal-exposure";
import { RenewalsCard } from "@/components/renewals-card";
import { levelTone, money, renewalDays, type AccountSummary } from "@/lib/workspace";

// The landing page's product window: the real workspace layout and components, rendered with invented
// example accounts (not any dataset) and made inert so it reads as a picture, not a working app.
const SNAPSHOT = "2026-10-01";
const examples: [string, string, string, number, number][] = [
  ["Northwind Coffee Co.", "Critical", "2026-10-13", 420_000_000, 78],
  ["Lumen Retail Group", "Critical", "2026-10-20", 310_000_000, 71],
  ["Sagara Pharmacy", "High", "2026-10-28", 185_000_000, 46],
  ["Atlas Hardware", "High", "2026-11-11", 140_000_000, 41],
  ["Kirana Bakery", "Medium", "2026-11-26", 96_000_000, 22],
  ["Bayu Logistics", "Critical", "2026-12-09", 260_000_000, 66],
  ["Mentari Books", "Low", "2026-12-18", 72_000_000, 9],
  ["Pelangi Outfitters", "Low", "2027-01-15", 150_000_000, 11],
  ["Cendana Clinic", "High", "2027-02-03", 210_000_000, 38],
  ["Rimba Coffee", "Medium", "2027-03-10", 120_000_000, 19],
];
const reasons: Record<string, string> = {
  "Northwind Coffee Co.": "Champion left three weeks ago; 4 support tickets open for 60+ days.",
  "Lumen Retail Group": "Promised accounting integration still missing; CFO evaluating vendors.",
  "Bayu Logistics": "3 late payments this year and no customer contact for 52 days.",
  "Sagara Pharmacy": "2 unresolved sync bugs across 14 outlets.",
};
const accounts: AccountSummary[] = examples.map(([name, level, renewalDate, value, score], i) => ({
  id: `EX${i + 1}`, nodeId: `EX${i + 1}`, name, businessAsOf: SNAPSHOT, synthetic: true, datasetRevision: "example",
  priority: { score, level, status: "scored", coverage: 100, reason: reasons[name] ?? "", formulaVersion: null },
  annualValueIdr: value, weightedValueIdr: (value * score) / 100, renewalDate, dashboardHealth: "Healthy", nps: null,
}));
const attention = accounts.filter(a => a.priority.level === "Critical" || a.priority.level === "High");
const renewals = accounts.filter(a => (renewalDays(a) ?? Infinity) <= 90);
const nav = [
  ["Dashboard", LayoutDashboard], ["Accounts", Users], ["Investigate", GitBranch], ["Actions", ClipboardList],
  ["Review", ShieldCheck], ["Data", Database], ["Landing page", Globe],
] as const;

export function DashboardPreview() {
  return (
    <div
      inert
      role="img"
      aria-label="Illustrative Tessera dashboard: two critical accounts renew within three weeks, and the contract value at stake is shown by renewal month."
      className="relative flex h-[40rem] gap-md overflow-hidden p-md text-left md:h-[56rem]"
    >
      <aside className="hidden w-[248px] shrink-0 lg:block">
        <div className="glass flex h-full flex-col gap-lg overflow-hidden whitespace-nowrap rounded-lg p-md">
          <span className="flex min-h-11 items-center gap-sm card-title">
            <span className="grid size-8 place-items-center rounded-sm bg-primary text-on-primary">
              <svg viewBox="56 56 144 144" className="size-4"><path fill="currentColor" d="M56 56H200V104H152V200L104 152V104Z" /></svg>
            </span>
            Tessera
          </span>
          <span className="flex flex-col gap-xs">
            {nav.map(([label, Icon], i) => (
              <span key={label} className={`flex min-h-10 items-center gap-sm rounded-md px-1.5 text-label-md ${i === 0 ? "bg-on-surface font-semibold text-neutral" : "text-on-surface-muted"}`}>
                <span className={`grid size-7 place-items-center rounded-sm ${i === 0 ? "bg-primary text-on-primary" : ""}`}><Icon size={18} strokeWidth={1.75} /></span>
                {label}
                {label === "Review" && <span className="ml-auto mr-1.5 rounded-sm bg-neutral px-1.5 text-label-sm text-on-surface">3</span>}
              </span>
            ))}
          </span>
          <span className="mt-auto flex items-center gap-sm rounded-md bg-surface-elevated px-1.5 py-sm">
            <span className="grid size-7 place-items-center rounded-sm bg-primary text-on-primary"><Building2 size={16} strokeWidth={2} /></span>
            <span><span className="block text-label-md font-semibold leading-tight">Your company</span><span className="block text-label-sm text-on-surface-muted">Example data</span></span>
          </span>
          <span className="btn btn-secondary justify-start px-1.5"><span className="grid size-7 place-items-center"><LogOut size={18} strokeWidth={1.75} /></span>Sign out</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-md">
        <span className="flex flex-wrap items-center gap-sm">
          <span className="mr-auto text-headline-lg font-bold tracking-headline-lg">Dashboard</span>
          <span className="relative hidden h-11 w-80 items-center rounded-full bg-surface pl-11 text-body-sm text-on-surface-muted ring-1 ring-outline ring-inset md:flex">
            <Search size={18} className="absolute left-4" />Search accounts, signals, or evidence
          </span>
        </span>
        <span className="text-label-sm text-on-surface-muted">Example workspace · illustrative accounts and figures, not customer data.</span>

        <div className="grid gap-md lg:grid-cols-2">
          <section className="card">
            <h2 className="card-title">Needs attention</h2>
            <ul className="mt-md flex flex-col gap-sm">
              {attention.slice(0, 4).map(a => (
                <li key={a.id} className="flex flex-wrap items-center gap-sm border-t border-outline pt-sm">
                  <span className="mr-auto font-semibold">{a.name}
                    <span className="mt-xs flex items-center gap-sm text-label-sm font-normal text-on-surface-muted"><span className={`badge ${levelTone(a.priority.level)}`}>{a.priority.level}</span>{renewalDays(a)} days to renewal</span>
                  </span>
                  <span className="btn btn-secondary">Review</span>
                  {a.priority.reason && <p className="w-full text-label-sm text-on-surface-muted">{a.priority.reason}</p>}
                </li>
              ))}
            </ul>
          </section>
          <RenewalsCard renewals={renewals} />
        </div>

        <div className="grid gap-md md:grid-cols-3">
          {([
            [Scale, "Weighted value for priority", money(accounts.reduce((n, a) => n + (a.weightedValueIdr ?? 0), 0)), "", "text-primary"],
            [ShieldAlert, "High / Critical accounts", String(attention.length), "[--card-glow:var(--color-danger)] [--card-base:color-mix(in_srgb,var(--color-danger-container)_55%,var(--color-surface))]", "text-danger"],
            [CalendarClock, "Renewals within 90 days", String(renewals.length), "[--card-glow:var(--color-warning)] [--card-base:color-mix(in_srgb,var(--color-warning)_6%,var(--color-surface))]", "text-warning"],
          ] as const).map(([Icon, label, value, tint, ic]) => (
            <section key={label} className={`card-featured ${tint}`}>
              <div className="flex items-center gap-sm"><span className={`grid size-8 place-items-center rounded-sm bg-surface-elevated ${ic}`}><Icon size={16} strokeWidth={1.75} /></span><h2 className="text-label-md text-on-surface">{label}</h2></div>
              <p className="mt-md text-display-number-sm font-bold">{value}</p>
            </section>
          ))}
        </div>

        <RenewalExposure accounts={accounts} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-neutral to-transparent" />
    </div>
  );
}
