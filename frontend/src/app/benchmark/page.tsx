const arms = [
  { name: "Baseline", retriever: "grep across the whole corpus" },
  { name: "Context graph", retriever: "Account → Opportunity → Call traversal" },
];

const metrics = ["Accuracy (Jev-judged)", "Cost / question", "Latency p50 / p95"];

const metadata = [
  ["Dataset", "SalesTranscriptQA B2B multi-call — not fetched yet"],
  ["Question IDs / seed / N", "Not selected yet"],
  ["Model & rubric version", "Not locked yet"],
  ["Judge", "Jev noul — pending"],
];

export default function BenchmarkPage() {
  return (
    <div className="flex flex-col gap-md">
      <p className="max-w-[70ch] text-body-sm text-on-surface-muted">
        Both arms use the same corpus, questions, answerer budget, and judge. Numbers appear only from an actual run.
      </p>

      <section className="card">
        <div className="flex flex-wrap items-center gap-sm">
          <h2 className="card-title mr-auto">Graph vs. baseline</h2>
          <span className="badge text-warning">Not run yet</span>
        </div>
        <div className="-mx-md mt-md overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-body-sm">
            <thead className="label-caps text-on-surface-muted">
              <tr className="border-b border-outline">
                <th scope="col" className="px-md py-sm">Arm</th>
                <th scope="col" className="px-md py-sm">Retriever</th>
                {metrics.map(metric => (
                  <th key={metric} scope="col" className="px-md py-sm text-right">{metric}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arms.map(arm => (
                <tr key={arm.name} className="border-b border-outline last:border-0">
                  <th scope="row" className="px-md py-sm font-semibold">{arm.name}</th>
                  <td className="px-md py-sm text-on-surface-muted">{arm.retriever}</td>
                  {metrics.map(metric => (
                    <td key={metric} className="px-md py-sm text-right text-on-surface-muted">
                      —<span className="sr-only">not measured</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-sm text-label-sm text-on-surface-muted">Query cost and amortized ingest cost are reported separately.</p>
      </section>

      <section className="card">
        <h2 className="card-title">Run metadata</h2>
        <dl className="mt-md grid gap-md sm:grid-cols-2">
          {metadata.map(([term, value]) => (
            <div key={term}>
              <dt className="label-caps text-on-surface-muted">{term}</dt>
              <dd className="mt-xs text-body-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
