import Link from "next/link";
import { FileText } from "lucide-react";
import { evidenceRefs, explainFactor, factorLabel, riskPoints, topDrivers } from "@/lib/risk-explain";
import type { AccountDetail, Citation } from "@/lib/workspace";

const fileLabel = (file: string) => file.replace(/\.(csv|jsonl)$/, "").replaceAll("_", " ");

// The account's case in one card: strongest drivers, each with the source records behind it.
export function WhyAtRisk({ parameters, citations }: { parameters: AccountDetail["parameters"]; citations: Citation[] }) {
  const drivers = topDrivers(parameters);
  return (
    <section className="card" aria-labelledby="why-heading">
      <h2 id="why-heading" className="card-title">Why this account is at risk</h2>
      {!drivers.length && <p className="mt-sm text-body-sm text-on-surface-muted">No measured factor raises this account’s priority.</p>}
      <ol className="mt-md flex flex-col gap-md">
        {drivers.map((p, i) => {
          const refs = evidenceRefs(p);
          return (
            <li key={p.factor} className="flex gap-md border-t border-outline pt-md first:border-t-0 first:pt-0">
              <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-surface-elevated text-label-sm font-semibold">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-sm">
                  <span className="font-semibold">{factorLabel(p.factor)}</span>
                  <span className="text-label-sm text-on-surface-muted">{riskPoints(p)} / 100 risk</span>
                </p>
                <p className="mt-xs text-body-md">{explainFactor(p) ?? p.reason ?? "Measured from source data."}</p>
                {refs.length ? (
                  <ul className="mt-sm flex flex-col gap-xs">
                    {refs.map(ref => {
                      const cite = citations.find(c => c.recordId === ref.recordId && c.file === ref.file);
                      return (
                        <li key={`${ref.file}:${ref.recordId}`}>
                          <Link href={`/investigate?entity=${encodeURIComponent(ref.recordId)}`} className="group flex min-h-11 gap-sm rounded-md bg-neutral p-sm transition-colors hover:bg-surface-elevated">
                            <FileText size={16} className="mt-xs shrink-0 text-on-surface-muted" aria-hidden />
                            <span className="min-w-0">
                              <span className="block text-label-sm text-on-surface-muted">
                                <span className="font-semibold text-on-surface group-hover:text-primary">{ref.recordId}</span> · {fileLabel(ref.file)}{cite?.occurredAt && ` · ${cite.occurredAt.slice(0, 10)}`}
                              </span>
                              {cite?.quote && <span className="mt-xs line-clamp-2 block text-body-sm">“{cite.quote}”</span>}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-sm text-label-sm text-on-surface-muted">Measured from {Array.isArray(p.evidence) && p.evidence[0]?.file ? fileLabel(String(p.evidence[0].file)) : "source data"}{p.period.start && ` · ${p.period.start.slice(0, 10)} – ${p.period.end?.slice(0, 10) ?? "snapshot"}`}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
