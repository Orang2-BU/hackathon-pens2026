import { ArrowRight, GitBranch, LayoutDashboard, Search, ShieldCheck, Users } from "lucide-react";

// A product overview, without customer records or invented performance figures.
export function DashboardPreview() {
  return (
    <div className="p-md text-left md:p-lg">
      <div className="mb-lg flex flex-wrap items-center justify-between gap-sm">
        <span className="flex items-center gap-sm text-title font-semibold"><LayoutDashboard size={20} strokeWidth={1.75} aria-hidden /> Your customer workspace</span>
        <span className="text-label-sm text-on-surface-muted">Illustrative product overview</span>
      </div>
      <div className="grid gap-md md:grid-cols-3">
        {[
          { title: "Prioritize", icon: Users, lead: "Know where to start", rows: ["Accounts needing attention", "Reasons behind each priority", "Renewal timing & contract value"] },
          { title: "Investigate", icon: Search, lead: "Understand the evidence", rows: ["Connected source records", "Account relationship graph", "Context behind each signal"] },
          { title: "Review", icon: ShieldCheck, lead: "Choose the next action", rows: ["A draft plan to inspect", "Past decisions for context", "Human approval before action"] },
        ].map(({ title, icon: Icon, lead, rows }) => (
          <div key={title} className="rounded-md bg-surface p-md">
            <Icon size={20} strokeWidth={1.75} className="text-primary" aria-hidden /><h2 className="mt-md text-title font-semibold">{title}</h2>
            <p className="mt-xs text-body-sm text-on-surface-muted">{lead}</p>
            <ul className="mt-lg hidden flex-col gap-sm md:flex">{rows.map(row => <li key={row} className="flex items-start gap-sm border-t border-outline pt-sm text-body-sm"><ArrowRight size={14} className="mt-xs shrink-0 text-on-surface-muted" aria-hidden />{row}</li>)}</ul>
          </div>
        ))}
      </div>
      <p className="mt-md flex items-center gap-sm text-label-sm text-on-surface-muted"><GitBranch size={16} aria-hidden /> Connected evidence. Clear priorities. Your team makes the call.</p>
    </div>
  );
}
