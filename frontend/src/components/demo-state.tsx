"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { accounts, isElevated, type Decision } from "@/lib/accounts";

export type SessionDecision = Decision & { accountId: string };
export type Feedback = { id: string; accountId: string; text: string; createdAt: string; reply?: string };

type DemoStateValue = {
  decisions: SessionDecision[];
  feedback: Feedback[];
  addDecision: (decision: SessionDecision) => void;
  addFeedback: (accountId: string, text: string) => void;
  replyFeedback: (id: string, reply: string) => void;
};

const DemoState = createContext<DemoStateValue | null>(null);

export const planDecisionId = (accountId: string) => `dec-session-${accountId}`;

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [decisions, setDecisions] = useState<SessionDecision[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const value = useMemo(() => ({
    decisions,
    feedback,
    // Append-only and idempotent: a second decision with the same id is ignored.
    addDecision: (decision: SessionDecision) => setDecisions(current => current.some(item => item.id === decision.id) ? current : [...current, decision]),
    addFeedback: (accountId: string, text: string) =>
      setFeedback(current => [...current, { id: crypto.randomUUID(), accountId, text, createdAt: new Date().toISOString().slice(0, 10) }]),
    replyFeedback: (id: string, reply: string) =>
      setFeedback(current => current.map(item => item.id === id ? { ...item, reply } : item)),
  }), [decisions, feedback]);
  return <DemoState.Provider value={value}>{children}</DemoState.Provider>;
}

export function useDemoState() {
  const state = useContext(DemoState);
  if (!state) throw new Error("useDemoState must be used within DemoStateProvider");
  return state;
}

// Save plans are drafted for High and Critical accounts only.
export function usePendingPlans() {
  const { decisions } = useDemoState();
  return accounts.filter(account => isElevated(account) && !decisions.some(decision => decision.id === planDecisionId(account.id)));
}
