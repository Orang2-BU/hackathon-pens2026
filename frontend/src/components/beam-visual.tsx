"use client";

import React, { forwardRef, useRef } from "react";
import { Activity, Database, Gauge, GitBranch, LifeBuoy, MessagesSquare, Receipt, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const Node = forwardRef<
  HTMLDivElement,
  { className?: string; label: string; children?: React.ReactNode }
>(({ className, label, children }, ref) => {
  return (
    <div className="flex flex-col items-center gap-xs">
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-12 items-center justify-center rounded-full bg-surface-elevated text-primary ring-1 ring-outline",
          className,
        )}
      >
        {children}
      </div>
      <span className="max-w-24 text-center text-label-sm leading-tight text-on-surface-muted">{label}</span>
    </div>
  );
});

Node.displayName = "Node";

// KasirNusa sources beam into one context graph, which beams out to the
// ranking, the evidence trail, and the early warning. Landing storytelling
// only — the workspace itself stays animation-free.
export function BeamVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const crmRef = useRef<HTMLDivElement>(null);
  const usageRef = useRef<HTMLDivElement>(null);
  const ticketsRef = useRef<HTMLDivElement>(null);
  const billingRef = useRef<HTMLDivElement>(null);
  const interactRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const rankingRef = useRef<HTMLDivElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  const telegramRef = useRef<HTMLDivElement>(null);

  const beam = { gradientStartColor: "#9fe85c", gradientStopColor: "#fbbf24", pathColor: "#45473f" };

  return (
    <div
      ref={containerRef}
      className="card-featured edge-glow relative flex h-[440px] w-full items-center justify-center overflow-hidden p-md"
    >
      <div className="flex size-full max-w-3xl items-stretch justify-between gap-md">
        <div className="flex flex-col items-center justify-between py-sm">
          <Node ref={crmRef} label="CRM & contacts"><Database size={20} aria-hidden /></Node>
          <Node ref={usageRef} label="Product usage"><Activity size={20} aria-hidden /></Node>
          <Node ref={ticketsRef} label="Support tickets"><LifeBuoy size={20} aria-hidden /></Node>
          <Node ref={billingRef} label="Contracts & billing"><Receipt size={20} aria-hidden /></Node>
          <Node ref={interactRef} label="Interactions & decisions"><MessagesSquare size={20} aria-hidden /></Node>
        </div>

        <div className="flex flex-col items-center justify-center">
          <Node ref={graphRef} label="Tessera context graph" className="size-16 bg-primary text-on-primary ring-primary">
            <svg viewBox="56 56 144 144" className="size-7" aria-hidden>
              <path fill="currentColor" d="M56 56H200V104H152V200L104 152V104Z" />
            </svg>
          </Node>
        </div>

        <div className="flex flex-col items-center justify-between py-lg">
          <Node ref={rankingRef} label="Priority ranking"><Gauge size={20} aria-hidden /></Node>
          <Node ref={evidenceRef} label="Evidence paths"><GitBranch size={20} aria-hidden /></Node>
          <Node ref={telegramRef} label="Telegram early warning"><Send size={20} aria-hidden /></Node>
        </div>
      </div>

      <AnimatedBeam containerRef={containerRef} fromRef={crmRef} toRef={graphRef} curvature={-60} {...beam} />
      <AnimatedBeam containerRef={containerRef} fromRef={usageRef} toRef={graphRef} curvature={-30} {...beam} />
      <AnimatedBeam containerRef={containerRef} fromRef={ticketsRef} toRef={graphRef} {...beam} />
      <AnimatedBeam containerRef={containerRef} fromRef={billingRef} toRef={graphRef} curvature={30} {...beam} />
      <AnimatedBeam containerRef={containerRef} fromRef={interactRef} toRef={graphRef} curvature={60} {...beam} />
      <AnimatedBeam containerRef={containerRef} fromRef={graphRef} toRef={rankingRef} curvature={-40} reverse {...beam} />
      <AnimatedBeam containerRef={containerRef} fromRef={graphRef} toRef={evidenceRef} reverse {...beam} />
      <AnimatedBeam containerRef={containerRef} fromRef={graphRef} toRef={telegramRef} curvature={40} reverse {...beam} />
    </div>
  );
}
