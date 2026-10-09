"use client";

import { useState } from "react";
import { Building2, CalendarClock, FileClock, GitBranch, MessageSquare, Ticket, Users } from "lucide-react";
import { DecryptedText } from "@/components/ui/decrypted-text";

const sources = [
  { id: "usage", title: "Product usage", icon: GitBranch, relation: "uses", detail: "Check adoption and changes in activity. Compare periods and check for missing or unsynced data before treating a drop as a risk signal.", fields: "Activity period · usage change · data coverage" },
  { id: "support", title: "Support tickets", icon: Ticket, relation: "reports", detail: "Connect unresolved tickets to the account and the underlying issue. A shared bug can explain why several customers need attention at once.", fields: "Ticket ID · status · issue link · opened date" },
  { id: "contacts", title: "Key contacts", icon: Users, relation: "works with", detail: "Follow who owns the relationship and who can make a renewal decision. Keep contact changes in context with the account history.", fields: "Contact role · relationship · effective date" },
  { id: "conversations", title: "Conversations", icon: MessageSquare, relation: "discusses", detail: "Bring concerns, commitments and follow-ups into the same view. Keep the original wording beside the signal so your team can judge its meaning.", fields: "Interaction ID · date · source excerpt" },
  { id: "renewal", title: "Contracts & billing", icon: CalendarClock, relation: "renews", detail: "See renewal timing, annual contract value and payment context. These help order the work without turning a priority score into a prediction of loss.", fields: "Contract value · currency · renewal date · payment status" },
  { id: "decisions", title: "Past decisions", icon: FileClock, relation: "has history", detail: "Keep previous actions and their reasoning available when reviewing a new plan. A precedent supports a decision; it does not automatically approve one.", fields: "Decision · rationale · actor · timestamp" },
];

export function EvidenceMap() {
  const [selectedId, setSelectedId] = useState(sources[0].id);
  const selected = sources.find(source => source.id === selectedId) ?? sources[0];
  const SelectedIcon = selected.icon;
  return (
    <div className="overflow-hidden rounded-lg bg-surface ring-1 ring-outline">
      <div className="flex flex-wrap items-center justify-between gap-sm border-b border-outline px-lg py-md">
        <span className="flex items-center gap-sm text-label-md"><GitBranch size={18} strokeWidth={1.75} aria-hidden /> One account, connected context</span>
        <span className="text-label-sm text-on-surface-muted">Product diagram · select a source</span>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="relative grid gap-lg p-lg md:p-xl">
          <div className="relative ml-lg flex w-fit before:absolute before:top-1/2 before:-left-lg before:h-px before:w-lg before:bg-outline-active sm:mx-auto sm:before:hidden items-center gap-sm rounded-md bg-surface-elevated px-lg py-md ring-1 ring-primary">
            <Building2 size={20} strokeWidth={1.75} className="text-primary" aria-hidden /><span className="text-label-md font-semibold">Customer account</span>
          </div>
          <div className="pointer-events-none absolute left-lg top-20 bottom-2xl sm:left-1/2 w-px bg-outline-active" aria-hidden />
          <ul className="relative grid grid-cols-1 gap-sm pl-lg sm:grid-cols-2 sm:pl-0">
            {sources.map(({ id, title, icon: Icon, relation }, index) => (
              <li key={id} className={`relative before:absolute before:top-1/2 before:-left-lg before:h-px before:w-lg before:bg-outline-active sm:before:w-sm ${index % 2 === 0 ? "sm:before:left-auto sm:before:-right-sm" : "sm:before:-left-sm"}`}>
                <button type="button" aria-pressed={selectedId === id} aria-controls="source-explanation" onClick={() => setSelectedId(id)} className={`flex min-h-20 w-full items-center gap-md rounded-md bg-surface-elevated p-md text-left ring-1 ring-inset transition-colors ${selectedId === id ? "ring-primary" : "ring-outline-active hover:ring-on-surface-muted"}`}>
                  <Icon size={20} strokeWidth={1.75} className={selectedId === id ? "text-primary" : "text-on-surface-muted"} aria-hidden />
                  <span><span className="block text-label-sm text-on-surface-muted">{relation}</span><span className="mt-xs block text-label-md font-semibold">{title}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div id="source-explanation" className="flex flex-col gap-md border-t border-outline bg-surface-elevated p-lg lg:border-t-0 lg:border-l lg:p-xl" aria-live="polite" aria-atomic="true">
          <SelectedIcon size={24} strokeWidth={1.75} className="text-primary" aria-hidden />
          <h3 className="text-title font-semibold"><DecryptedText text={selected.title} /></h3>
          <p className="text-body-md text-on-surface-muted">{selected.detail}</p>
          <div className="mt-auto border-t border-outline pt-md"><p className="label-caps text-on-surface-muted">Context to inspect</p><p className="mt-sm text-body-sm">{selected.fields}</p></div>
        </div>
      </div>
    </div>
  );
}
