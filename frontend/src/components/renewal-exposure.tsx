"use client";
import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { renewalExposure } from "@/lib/exposure";
import { money, type AccountSummary } from "@/lib/workspace";

const RANGES = [3, 6, 12] as const;
const monthLabel = (key: string) => new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${key}-01T00:00:00Z`));
const axisTick = { fontSize: 12, fill: "var(--color-on-surface-muted)" };

// What is on the table, and when: contract value by renewal month, with the High/Critical share in red.
// Range buttons pick the horizon; hovering a month moves the crosshair and the summary row above the chart.
export function RenewalExposure({ accounts }: { accounts: AccountSummary[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(6), [hover, setHover] = useState<number | null>(null);
  const { months, atRisk90, accountsAtRisk90, missingValue } = renewalExposure(accounts, range);
  const data = months.map(m => ({ ...m, label: monthLabel(m.key), total: m.atRisk + m.other }));
  const horizonKey = new Date(Date.parse(accounts[0]?.businessAsOf ?? "") + 90 * 86_400_000).toISOString().slice(0, 7);
  const horizon = data.find(d => d.key === horizonKey)?.label;
  const point = hover === null ? null : data[hover];
  const summary = point ?? {
    label: `Next ${range} months`,
    accounts: data.reduce((n, d) => n + d.accounts, 0),
    total: data.reduce((n, d) => n + d.total, 0),
    atRisk: data.reduce((n, d) => n + d.atRisk, 0),
  };

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
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <figcaption className="text-label-sm text-on-surface-muted">Contract value by renewal month</figcaption>
          <div role="group" aria-label="Renewal horizon" className="flex rounded-full bg-surface-elevated p-xs">
            {RANGES.map(r => (
              <button key={r} type="button" aria-pressed={range === r} onClick={() => { setRange(r); setHover(null); }}
                className={`min-h-11 rounded-full px-md text-label-sm font-semibold tabular-nums transition-colors xl:min-h-8 ${range === r ? "bg-outline-active text-on-surface" : "text-on-surface-muted hover:text-on-surface"}`}>
                {r}M
              </button>
            ))}
          </div>
        </div>

        <p className="flex flex-wrap items-baseline gap-x-md gap-y-xs text-label-sm tabular-nums" aria-live="polite">
          <span className="text-on-surface-muted">{summary.label} · {summary.accounts} renewal{summary.accounts === 1 ? "" : "s"}</span>
          <span><span className="text-on-surface-muted">All </span><span className="font-semibold text-primary">{money(summary.total)}</span></span>
          <span><span className="text-on-surface-muted">High / Critical </span><span className="font-semibold text-danger">{money(summary.atRisk)}</span></span>
        </p>

        <div className="h-56 w-full" aria-hidden>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
              onMouseMove={state => setHover(state.activeTooltipIndex == null ? null : Number(state.activeTooltipIndex))}
              onMouseLeave={() => setHover(null)}>
              <defs>
                <linearGradient id="renewalArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-outline)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} tickMargin={10} interval="preserveStartEnd" />
              <YAxis orientation="right" axisLine={false} tickLine={false} width={72} tick={axisTick} tickFormatter={v => money(Number(v))} />
              {horizon && <ReferenceLine x={horizon} stroke="var(--color-outline-active)" label={{ value: "90 days", position: "insideTopLeft", fontSize: 11, fill: "var(--color-on-surface-muted)" }} />}
              {point && (
                <ReferenceLine y={point.total} stroke="var(--color-primary)" strokeDasharray="4 4" strokeOpacity={0.6}
                  label={{ value: money(point.total), position: "right", fontSize: 11, fontWeight: 600, fill: "var(--color-primary)" }} />
              )}
              <Tooltip content={() => null} cursor={{ stroke: "var(--color-on-surface-muted)", strokeDasharray: "3 3" }} />
              <Area type="linear" dataKey="total" stroke="none" fill="url(#renewalArea)" isAnimationActive={false} />
              <Line type="linear" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-surface)", stroke: "var(--color-primary)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="linear" dataKey="atRisk" stroke="var(--color-danger)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4, fill: "var(--color-surface)", stroke: "var(--color-danger)", strokeWidth: 2, strokeDasharray: "0" }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="flex flex-wrap gap-md text-label-sm text-on-surface-muted" aria-hidden>
          <span className="flex items-center gap-xs"><span className="h-0.5 w-4 rounded-full bg-primary" />All renewals</span>
          <span className="flex items-center gap-xs"><span className="w-4 border-t-2 border-dashed border-danger" />High / Critical</span>
        </p>
        <ul className="sr-only">
          {data.map(d => <li key={d.key}>{`${d.label}: ${money(d.total)} renewing, ${money(d.atRisk)} at High or Critical accounts, ${d.accounts} renewals.`}</li>)}
        </ul>
      </figure>
    </section>
  );
}
