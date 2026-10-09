"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Decision } from "@/lib/demo-data";

export type SessionDecision = Decision & { accountId: string };
type DemoStateValue = {
  decisions: SessionDecision[];
  resolvedReviewIds: string[];
  addDecision: (decision: SessionDecision) => void;
  resolveReview: (id: string) => void;
};

const DemoState = createContext<DemoStateValue | null>(null);

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [decisions, setDecisions] = useState<SessionDecision[]>([]);
  const [resolvedReviewIds, setResolvedReviewIds] = useState<string[]>([]);
  const value = useMemo(() => ({
    decisions,
    resolvedReviewIds,
    addDecision: (decision: SessionDecision) => setDecisions(current => current.some(item => item.id === decision.id) ? current : [...current, decision]),
    resolveReview: (id: string) => setResolvedReviewIds(current => current.includes(id) ? current : [...current, id]),
  }), [decisions, resolvedReviewIds]);
  return <DemoState.Provider value={value}>{children}</DemoState.Provider>;
}

export function useDemoState() {
  const state = useContext(DemoState);
  if (!state) throw new Error("useDemoState must be used within DemoStateProvider");
  return state;
}
