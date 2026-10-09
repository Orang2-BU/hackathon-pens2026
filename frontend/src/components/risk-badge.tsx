import type { RiskLevel } from "@/lib/demo-data";

const tone: Record<RiskLevel, string> = {
  Critical: "bg-danger-container text-danger",
  High: "text-warning",
  Medium: "text-on-surface-muted",
  Low: "text-success",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`badge ${tone[level]}`}>{level}</span>;
}
