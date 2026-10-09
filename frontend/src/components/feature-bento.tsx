"use client";

import { useId, useRef, useState } from "react";
import { Database, FileCheck2, GitBranch, MessageSquare, ShieldCheck, Ticket } from "lucide-react";
import { useInView, useReducedMotion } from "framer-motion";
import { Parallax } from "@/components/ui/parallax";
import { Reveal } from "@/components/ui/reveal";

const sources = [
  { name: "CRM", icon: Database, y: 55, path: "M145 55 C260 55 250 140 335 140", context: "Relationships, key contacts and account ownership stay connected to the customer." },
  { name: "Support", icon: Ticket, y: 140, path: "M145 140 H335", context: "Tickets and shared issues add service context to the account’s priority." },
  { name: "Conversations", icon: MessageSquare, y: 225, path: "M145 225 C260 225 250 140 335 140", context: "Concerns and commitments retain the original context behind the signal." },
];
const outputPath = "M495 140 C560 140 560 140 620 140";

function FrameCorners() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map(corner => (
        <span key={corner} className={`absolute size-3 border-outline-active ${corner}`} />
      ))}
    </div>
  );
}

function FlowPulse({ path }: { path: string }) {
  return (
    <g>
      {[0, 1, 2].map(index => (
        <circle key={index} r="3" fill="var(--color-primary)">
          <animateMotion path={path} dur="3s" begin={`${index}s`} repeatCount="indefinite" calcMode="linear" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="3s" begin={`${index}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
}

function FlowDiagram({ selected, animated }: { selected: number; animated: boolean }) {
  const glowId = useId().replaceAll(":", "");
  const glow = (id: string) => (
    <defs>
      <filter id={id} x="-50%" y="-80%" width="200%" height="260%" colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation="8" />
      </filter>
    </defs>
  );
  return (
    <>
    <svg viewBox="0 0 340 290" className="block w-full md:hidden" aria-hidden>
      {sources.map(({ name, icon: Icon }, index) => {
        const x = 20 + index * 110;
        const path = `M${x + 40} 75 C${x + 40} 115 170 105 170 140`;
        return <g key={name}>
          <path d={path} fill="none" stroke={index === selected ? "var(--color-primary)" : "var(--color-outline-active)"} strokeWidth="1.5" />
          <rect x={x} y="20" width="80" height="55" rx="8" fill="var(--color-surface-elevated)" stroke={index === selected ? "var(--color-primary)" : "var(--color-outline-active)"} />
          <foreignObject x={x + 30} y="28" width="20" height="20"><Icon size={20} strokeWidth={1.75} className={index === selected ? "text-primary" : "text-on-surface-muted"} /></foreignObject>
          <text x={x + 40} y="63" textAnchor="middle" fill="var(--color-on-surface)" fontSize="10">{name}</text>
        </g>;
      })}
      {animated && <FlowPulse key={selected} path={`M${60 + selected * 110} 75 C${60 + selected * 110} 115 170 105 170 140 L170 190 V225`} />}
      {glow(`${glowId}-mobile`)}
      <rect x="100" y="140" width="140" height="50" rx="12" fill="var(--color-primary)" opacity="0.2" filter={`url(#${glowId}-mobile)`} />
      <rect x="100" y="140" width="140" height="50" rx="12" fill="var(--color-surface-elevated)" stroke="var(--color-outline-active)" />
      <svg x="116" y="153" width="24" height="24" viewBox="56 56 144 144"><path fill="var(--color-primary)" d="M56 56H200V104H152V200L104 152V104Z" /></svg>
      <text x="150" y="170" fill="var(--color-on-surface)" fontSize="14" fontWeight="600">Tessera</text>
      <path d="M170 190 V225" stroke="var(--color-primary)" strokeWidth="1.5" />
      <rect x="80" y="225" width="180" height="50" rx="12" fill="var(--color-surface-elevated)" stroke="var(--color-outline-active)" />
      <text x="170" y="246" textAnchor="middle" fill="var(--color-on-surface)" fontSize="12">Draft plan + evidence</text>
      <text x="170" y="264" textAnchor="middle" fill="var(--color-primary)" fontSize="10">Your team reviews</text>
    </svg>
    <svg viewBox="0 0 840 280" className="hidden w-full md:block" aria-hidden>
      {sources.map(({ name, icon: Icon, y, path }, index) => (
        <g key={name}>
          <path d={path} fill="none" stroke={index === selected ? "var(--color-primary)" : "var(--color-outline-active)"} strokeWidth="1.5" />
          <rect x="25" y={y - 25} width="120" height="50" rx="12" fill="var(--color-surface-elevated)" stroke={index === selected ? "var(--color-primary)" : "var(--color-outline-active)"} />
          <foreignObject x="40" y={y - 10} width="20" height="20"><Icon size={20} strokeWidth={1.75} className={index === selected ? "text-primary" : "text-on-surface-muted"} /></foreignObject>
          <text x="70" y={y + 5} fill="var(--color-on-surface)" fontSize={name === "Conversations" ? 10 : 12}>{name}</text>
        </g>
      ))}
      {animated && <FlowPulse key={selected} path={`${sources[selected].path} L495 140 C560 140 560 140 620 140`} />}
      {glow(`${glowId}-desktop`)}
      <rect x="335" y="94" width="160" height="92" rx="16" fill="var(--color-primary)" opacity="0.2" filter={`url(#${glowId}-desktop)`} />
      <rect x="335" y="94" width="160" height="92" rx="16" fill="var(--color-neutral)" stroke="var(--color-outline)" />
      <rect x="350" y="109" width="130" height="62" rx="12" fill="var(--color-surface-elevated)" stroke="var(--color-outline-active)" />
      <svg x="364" y="124" width="30" height="30" viewBox="56 56 144 144"><path fill="var(--color-primary)" d="M56 56H200V104H152V200L104 152V104Z" /></svg>
      <text x="405" y="139" fill="var(--color-on-surface)" fontSize="15" fontWeight="600">Tessera</text>
      <text x="405" y="155" fill="var(--color-on-surface-muted)" fontSize="10">Context graph</text>
      <path d={outputPath} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
      {[2, 1, 0].map(layer => <rect key={layer} x={620 + layer * 12} y={70 - layer * 10} width="175" height="150" rx="12" fill="var(--color-surface)" stroke="var(--color-outline-active)" />)}
      <text x="636" y="96" fill="var(--color-on-surface-muted)" fontSize="10" letterSpacing="1">PLAN FOR REVIEW</text>
      <text x="636" y="122" fill="var(--color-on-surface)" fontSize="13" fontWeight="600">Reason → evidence</text>
      <path d="M636 140 H770 M636 154 H750 M636 168 H762" stroke="var(--color-outline-active)" strokeWidth="3" strokeLinecap="round" />
      <rect x="636" y="185" width="143" height="22" rx="6" fill="var(--color-success-container)" />
      <text x="648" y="200" fill="var(--color-primary)" fontSize="10">Human review required</text>
    </svg>
    </>
  );
}

export function FeatureBento() {
  const [selected, setSelected] = useState(0);
  const diagramRef = useRef<HTMLDivElement>(null);
  const inView = useInView(diagramRef);
  const reducedMotion = useReducedMotion();

  return (
    <div id="feature-diagrams" className="grid gap-lg md:grid-cols-2">
      <Reveal className="md:col-span-2">
        <div className="relative w-full overflow-hidden rounded-lg bg-surface ring-1 ring-outline">
          <FrameCorners />
          <div className="flex flex-wrap items-center justify-between gap-md px-lg pt-lg md:px-xl">
            <p className="label-caps text-on-surface-muted">A connected customer workflow</p>
            <div className="flex flex-wrap gap-xs" role="group" aria-label="Customer context source">
              {sources.map((source, index) => (
                <button key={source.name} type="button" aria-pressed={selected === index} aria-controls="feature-flow-caption" onClick={() => setSelected(index)} className={`min-h-11 rounded-sm border px-md py-sm text-label-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected === index ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-transparent text-on-surface-muted hover:bg-surface-elevated hover:text-on-surface"}`}>
                  {source.name}
                </button>
              ))}
            </div>
          </div>
          <div ref={diagramRef} className="px-sm py-lg md:px-xl"><FlowDiagram selected={selected} animated={inView && !reducedMotion} /></div>
          <p id="feature-flow-caption" aria-live="polite" className="h-28 px-lg pb-lg text-body-sm text-on-surface-muted md:h-20 md:px-xl"><span className="font-semibold text-on-surface">{sources[selected].name}: </span>{sources[selected].context}</p>

          <div className="grid gap-lg border-t border-outline px-lg py-lg md:grid-cols-2 md:px-xl">
            <div><h3 className="text-title font-semibold">Connect the signals</h3><p className="mt-sm text-body-md text-on-surface-muted">Bring relationships, service issues and commitments into the same account context. Inspect the connection before choosing a response.</p></div>
            <div><h3 className="text-title font-semibold">Prepare a considered response</h3><p className="mt-sm text-body-md text-on-surface-muted">Turn the strongest reason into a draft to review, with its supporting evidence alongside it. Your team owns the next step.</p></div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="relative h-full overflow-hidden rounded-lg bg-surface p-lg ring-1 ring-outline md:p-xl">
          <FrameCorners />
          <Parallax><svg viewBox="0 0 400 180" className="mb-lg block w-full" aria-hidden>
            <path d="M70 65 H155 V90 H235 M70 125 H155 V90" fill="none" stroke="var(--color-outline-active)" strokeWidth="1.5" />
            <rect x="15" y="42" width="90" height="46" rx="8" fill="var(--color-surface-elevated)" stroke="var(--color-outline-active)" />
            <rect x="15" y="102" width="90" height="46" rx="8" fill="var(--color-surface-elevated)" stroke="var(--color-outline-active)" />
            <text x="30" y="70" fill="var(--color-on-surface-muted)" fontSize="12">Source</text><text x="30" y="130" fill="var(--color-on-surface-muted)" fontSize="12">Context</text>
            <rect x="235" y="55" width="145" height="70" rx="12" fill="var(--color-surface-elevated)" stroke="var(--color-primary)" />
            <foreignObject x="252" y="72" width="20" height="20"><GitBranch size={20} strokeWidth={1.75} className="text-primary" /></foreignObject>
            <text x="284" y="83" fill="var(--color-on-surface)" fontSize="12">Priority reason</text><text x="284" y="103" fill="var(--color-on-surface-muted)" fontSize="10">Trace the evidence</text>
          </svg></Parallax>
          <h3 className="flex items-center gap-sm text-title font-semibold"><GitBranch size={18} strokeWidth={1.75} aria-hidden /> A reason you can inspect</h3>
          <p className="mt-sm text-body-md text-on-surface-muted">Follow the path from a contributing factor back to its context. Dates, coverage and uncertainty belong beside the recommendation.</p>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="relative h-full overflow-hidden rounded-lg bg-surface p-lg ring-1 ring-outline md:p-xl">
          <FrameCorners />
          <Parallax><svg viewBox="0 0 400 180" className="mb-lg block w-full" aria-hidden>
            <rect x="30" y="25" width="145" height="130" rx="12" fill="var(--color-surface-elevated)" stroke="var(--color-outline-active)" />
            <foreignObject x="46" y="42" width="24" height="24"><FileCheck2 size={24} strokeWidth={1.75} className="text-on-surface-muted" /></foreignObject>
            <text x="46" y="87" fill="var(--color-on-surface)" fontSize="13">Draft plan</text><path d="M46 104 H155 M46 118 H132" stroke="var(--color-outline-active)" strokeWidth="3" strokeLinecap="round" />
            <path d="M175 90 H245" stroke="var(--color-outline-active)" strokeWidth="1.5" strokeDasharray="4 5" />
            <rect x="245" y="55" width="125" height="70" rx="12" fill="var(--color-surface-elevated)" stroke="var(--color-primary)" />
            <foreignObject x="260" y="70" width="20" height="20"><ShieldCheck size={20} strokeWidth={1.75} className="text-primary" /></foreignObject>
            <text x="288" y="83" fill="var(--color-on-surface)" fontSize="12">Your team</text><text x="260" y="107" fill="var(--color-on-surface-muted)" fontSize="11">Review & decide</text>
          </svg></Parallax>
          <h3 className="flex items-center gap-sm text-title font-semibold"><ShieldCheck size={18} strokeWidth={1.75} aria-hidden /> Human judgment stays central</h3>
          <p className="mt-sm text-body-md text-on-surface-muted">Review the plan and its reasoning, then choose the action. Feedback supports the discussion; approval remains a separate decision.</p>
        </div>
      </Reveal>
      <p className="text-label-sm text-on-surface-muted md:col-span-2">Illustration of the intended workflow. Explore the workspace preview to see the current review experience.</p>
    </div>
  );
}
