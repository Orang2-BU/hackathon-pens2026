import { renewalExposure } from "@/lib/exposure";
import { money, type AccountSummary } from "@/lib/workspace";

const monthLabel = (key: string) => new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${key}-01T00:00:00Z`));

// What is on the table, and when: contract value by renewal month, with the High/Critical share in red.
export function RenewalExposure({ accounts }: { accounts: AccountSummary[] }) {
  const { months, atRisk90, accountsAtRisk90, missingValue } = renewalExposure(accounts);
  const max = Math.max(1, ...months.map(m => m.atRisk + m.other));
  return (
    <section className="card grid gap-lg lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" aria-labelledby="exposure-heading">
      <div className="flex flex-col gap-sm">
        <h2 id="exposure-heading" className="card-title">Revenue at stake</h2>
        <p className="text-display-number-sm font-bold text-danger tabular-nums">{money(atRisk90)}</p>
        <p className="text-body-sm">
          Annual contract value of {accountsAtRisk90} High or Critical account{accountsAtRisk90 === 1 ? "" : "s"} renewing in the next 90 days.
        </p>
        <p className="mt-auto text-label-sm text-on-surface-muted">
          Exposure, not a forecast: if these contracts do not renew, this annual revenue would not continue. Tessera does not predict whether they will.
          {missingValue > 0 && ` ${missingValue} upcoming renewal${missingValue === 1 ? " has" : "s have"} no contract value and ${missingValue === 1 ? "is" : "are"} left out.`}
        </p>
      </div>
      <figure className="flex min-w-0 flex-col gap-sm">
        <figcaption className="flex flex-wrap items-center gap-md text-label-sm text-on-surface-muted">
          Contract value by renewal month
          <span className="flex items-center gap-xs"><span className="size-2 rounded-sm bg-danger" aria-hidden />High / Critical</span>
          <span className="flex items-center gap-xs"><span className="size-2 rounded-sm bg-outline-active" aria-hidden />Other</span>
        </figcaption>
        <ol className="grid h-48 grid-cols-6 items-end gap-xs sm:gap-sm">
          {months.map(m => (
            <li key={m.key} className="flex h-full min-w-0 flex-col justify-end gap-xs text-center">
              <span className="truncate text-label-sm tabular-nums">{m.atRisk + m.other ? money(m.atRisk + m.other) : "—"}</span>
              <span className="flex flex-col justify-end overflow-hidden rounded-sm bg-outline-active" style={{ height: `${((m.atRisk + m.other) / max) * 100}%`, minHeight: "2px" }}>
                <span className="bg-danger" style={{ height: `${m.atRisk + m.other ? (m.atRisk / (m.atRisk + m.other)) * 100 : 0}%` }} />
              </span>
              <span className="sr-only">{`${monthLabel(m.key)}: ${money(m.atRisk)} at High or Critical accounts, ${money(m.other)} at other accounts, ${m.accounts} renewals.`}</span>
              <span className="text-label-sm text-on-surface-muted" aria-hidden>{monthLabel(m.key)}</span>
            </li>
          ))}
        </ol>
      </figure>
    </section>
  );
}
