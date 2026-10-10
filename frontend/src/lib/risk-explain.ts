import type { AccountDetail } from "./workspace";

type Parameter = AccountDetail["parameters"][number];
type Raw = Record<string, unknown>;
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const fmt = (value: number) => new Intl.NumberFormat("en-US").format(value);

export const factorLabel = (factor: string) => (factor === "promiseEngagement" ? "Commitments" : factor.charAt(0).toUpperCase() + factor.slice(1));

// One plain sentence per factor, built only from the measured metrics; null when nothing was measured.
export function explainFactor(p: Parameter): string | null {
  const raw = (p.rawValue ?? {}) as Raw;
  switch (p.factor) {
    case "usage": {
      const before = num(raw.previousTransactions), after = num(raw.recentTransactions), change = num(raw.relativeChange);
      if (before === null || after === null) return null;
      return `Transactions went from ${fmt(before)} to ${fmt(after)} versus the previous 90 days${change === null ? "" : ` (${change > 0 ? "+" : ""}${Math.round(change * 100)}%)`}.`;
    }
    case "service": {
      const open = num(raw.openTicketCount), age = num(raw.maxOpenTicketAgeDays);
      if (open === null) return null;
      return open === 0 ? "No support tickets are open." : `${open} support ticket${open === 1 ? " is" : "s are"} still open; the oldest has waited ${age ?? "?"} days.`;
    }
    case "champion":
      if (raw.left === true) return `The champion contact${raw.contactId ? ` (${raw.contactId})` : ""} no longer works at this account.`;
      return raw.left === false ? "The champion contact is still at this account." : null;
    case "promiseEngagement": {
      const unmet = num(raw.unmetPromiseCount), days = num(raw.daysSinceExternalInteraction);
      const parts = [unmet === null ? null : `${unmet} feature commitment${unmet === 1 ? "" : "s"} not yet kept`, days === null ? null : `last customer conversation ${days} days ago`].filter(Boolean);
      return parts.length ? `${parts.join("; ")}.`.replace(/^./, c => c.toUpperCase()) : null;
    }
    case "payment": {
      const late = num(raw.latePaymentCount);
      return late === null ? null : `${late} late payment${late === 1 ? "" : "s"} in the last 12 months.`;
    }
    default:
      return null;
  }
}

// Source records cited by a factor (file + record ID), deduplicated.
export function evidenceRefs(p: Parameter): { file: string; recordId: string }[] {
  const items = Array.isArray(p.evidence) ? p.evidence : [];
  const refs = items.filter((e): e is { file: string; recordId: string } => typeof e?.file === "string" && typeof e?.recordId === "string");
  return [...new Map(refs.map(r => [`${r.file}:${r.recordId}`, r])).values()];
}

// Factors that visibly push the priority (≥ 1 / 100), strongest first. The API sends normalized values as numeric strings.
const risk = (p: Parameter) => (p.normalizedValue === null || p.normalizedValue === "" ? null : num(Number(p.normalizedValue)));
export const riskPoints = (p: Parameter) => Math.round((risk(p) ?? 0) * 100);
export const topDrivers = (parameters: Parameter[], limit = 3) =>
  parameters.filter(p => riskPoints(p) >= 1).sort((a, b) => (risk(b) ?? 0) - (risk(a) ?? 0)).slice(0, limit);
