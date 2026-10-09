"use client";
import { useCallback, useEffect, useState } from "react";
export type AccountSummary = { id: string; nodeId: string; name: string; businessAsOf: string; synthetic: boolean; datasetRevision: string; priority: { score: number | null; level: string | null; status: string; coverage: number | null; reason: string; formulaVersion: string | null }; annualValueIdr: number | null; weightedValueIdr: number | null; renewalDate: string | null; dashboardHealth: string | null; nps: number | null };
type Parameter = { factor: string; rawValue: unknown; normalizedValue: number | string | null; status: string; reason: string | null; unit: string | null; period: { start: string | null; end: string | null }; evidence: unknown };
type Plan = { id: string; revision: { id: string; number: number; body: string; actorId: string; createdAt: string }; decision: { id: string; outcome: string; reason: string; actorId: string; decidedAt: string } | null };
export type AccountDetail = AccountSummary & { parameters: Parameter[]; plans: Plan[] };
type Citation = { id: string; file: string; group: string; recordId: string; occurredAt: string | null; recordedAt: string; quote: string | null; field: string | null; recordHash: string; span: { start: number; end: number } | null };
export type Graph = { rootId: string; businessAsOf: string; recordedAsOf: string; depth: number; truncated: boolean; nodes: { id: string; type: string; key: string; label: string; details: Record<string, string> }[]; edges: { id: string; source: string; target: string; type: string; status: string; relationKind: string; reason: string | null; validFrom: string | null; validTo: string | null; sourceRecordIds: string[] }[]; citations: Citation[] };
export type Recommendation = { leadFactor: string | null; draft: string | null; reason: string; sourceGroups: string[]; limitations: string[]; citations: Citation[]; precedents: { id: string; accountId: string; body: string; reason: string; outcome: string | null; effectiveness: string; actorId: string; createdAt: string; conditions: { factor: string; normalizedValue: number | string | null; status: string }[]; sourceRefs: {id:string;hash:string}[] }[]; datasetPrecedents: Graph["nodes"] };
export type Action = { id: string; decisionId: string; accountId: string; accountName: string; plan: string; revision: number; owner: string; dueDate: string; status: string; note: string; outcome: string | null; actorId: string; updatedAt: string; stuck: boolean };
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, { method, cache: "no-store", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) { const code = (await response.json().catch(() => ({ error: "UNAVAILABLE" }))).error; throw new Error(response.status === 401 ? (path === "auth/login" ? "The password was not accepted." : "Sign in again to continue.") : response.status === 403 ? "Your account is not allowed to perform this action." : response.status === 409 ? "This item changed. Refresh before saving again." : response.status === 400 ? "Check the required fields and try again." : `Service unavailable (${code}). Your changes were not confirmed.`); }
  return response.json() as Promise<T>;
}
export function useResource<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; revision: number; data?: T; error?: string; loading: boolean }>({ path: null, revision: -1, loading: true });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    api<T>(path).then(data => { if (alive) setState({ path, revision, data, loading: false }); }).catch(error => { if (alive) setState({ path, revision, error: error.message, loading: false }); });
    return () => { alive = false; };
  }, [path, revision]);
  return { ...(state.path === path && state.revision === revision ? state : { loading: true, data: undefined, error: undefined }), refresh };
}
export const money = (value: number | null) => value === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "IDR", maximumFractionDigits: 0, notation: "compact" }).format(value);
export const renewalDays = (account: Pick<AccountSummary, "renewalDate" | "businessAsOf">) => account.renewalDate ? Math.round((Date.parse(account.renewalDate) - Date.parse(account.businessAsOf)) / 86_400_000) : null;
export const elevated = (a: { priority: Pick<AccountSummary["priority"], "level"> }) => ["High", "Critical", "Tinggi", "Kritis"].includes(a.priority.level ?? "");
