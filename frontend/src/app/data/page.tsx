"use client";

import { type ChangeEvent, useState } from "react";
import { Check, FileText, Upload, X } from "lucide-react";

const MAX_BYTES = 1_000_000;

// Row counts from docs/10-DATA-PROFILE-KASIRNUSA.md (profiled 9 Oct 2026); ingest status comes from the backend once T2 lands.
const sources: [file: string, group: string, rows: number][] = [
  ["crm_accounts.csv", "CRM", 45],
  ["crm_contacts.csv", "CRM", 160],
  ["contact_employment_history.csv", "CRM", 217],
  ["crm_deals.csv", "CRM", 22],
  ["employees.csv", "CRM", 10],
  ["interactions.jsonl", "Email & meetings", 350],
  ["product_usage_daily.csv", "Product usage", 226_300],
  ["outlets.csv", "Product usage", 620],
  ["feature_usage_monthly.csv", "Product usage", 1_178],
  ["features.csv", "Product usage", 8],
  ["support_tickets.csv", "Support", 640],
  ["bugs.csv", "Support", 4],
  ["releases.csv", "Support", 3],
  ["contracts_billing.csv", "Contracts & billing", 40],
  ["decision_log.csv", "Decision log", 30],
];

export default function DataPage() {
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    setPreview("");
    setFileName("");
    if (!file) return;
    if (!/\.(jsonl|csv|txt)$/i.test(file.name)) return setError("Choose a .jsonl, .csv, or .txt file. Nothing is sent to a server.");
    if (file.size > MAX_BYTES) return setError("Preview limit is 1 MB. The file was not read.");
    try {
      const text = await file.text();
      if (/\.jsonl$/i.test(file.name)) {
        text.split(/\r?\n/).filter(Boolean).forEach((row, index) => {
          const parsed: unknown = JSON.parse(row);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`Line ${index + 1} must be a JSON object.`);
        });
      }
      setFileName(file.name);
      setPreview(text.slice(0, 3000));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be read.");
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-md">
      <p className="max-w-[70ch] text-body-sm text-on-surface-muted">
        KasirNusa synthetic dataset, snapshot 1 Oct 2026. Ingest runs from the command line on the server (T2); this page shows its status.
      </p>

      <section className="card">
        <div className="flex flex-wrap items-center gap-sm">
          <h2 className="card-title mr-auto">Sources</h2>
          <span className="badge text-warning">Graph ingest pending</span>
        </div>
        <div className="-mx-md mt-md overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-body-sm">
            <thead className="label-caps text-on-surface-muted">
              <tr className="border-b border-outline">
                <th scope="col" className="px-md py-sm">File</th>
                <th scope="col" className="px-md py-sm">Source group</th>
                <th scope="col" className="px-md py-sm text-right">Rows (profile)</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(([file, group, rows]) => (
                <tr key={file} className="border-b border-outline last:border-0">
                  <th scope="row" className="px-md py-sm font-mono text-label-sm font-normal">{file}</th>
                  <td className="px-md py-sm text-on-surface-muted">{group}</td>
                  <td className="px-md py-sm text-right">{rows.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Local file check</h2>
        <p className="mt-xs text-label-sm text-on-surface-muted">JSONL (one object per line), CSV, or plain text, up to 1 MB. Read in your browser only.</p>

        <label className="mt-md flex cursor-pointer flex-col items-center gap-xs rounded-md border border-dashed border-outline-active px-md py-xl text-center transition-colors hover:border-primary focus-within:ring-2 focus-within:ring-focus-ring">
          <Upload size={22} aria-hidden className="text-primary" />
          <span className="text-label-md font-semibold">Choose a file to validate</span>
          <span className="text-label-sm text-on-surface-muted">Preview shows the first 3,000 characters</span>
          <input type="file" accept=".jsonl,.csv,.txt,text/plain,text/csv,application/json" onChange={handleFile} className="sr-only" />
        </label>

        {error && (
          <p role="alert" className="mt-sm flex items-center gap-xs text-label-md text-danger">
            <X size={16} aria-hidden /> {error}
          </p>
        )}

        {fileName && (
          <div className="mt-md overflow-hidden rounded-md ring-1 ring-outline ring-inset">
            <div className="flex flex-wrap items-center justify-between gap-sm bg-surface-elevated px-sm py-sm text-label-sm">
              <span className="flex items-center gap-xs"><FileText size={15} aria-hidden /> {fileName}</span>
              <span className="flex items-center gap-xs text-success"><Check size={14} aria-hidden /> Format valid · local only</span>
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all p-sm font-mono text-label-sm text-on-surface-muted">
              {preview || "The file is empty."}
            </pre>
          </div>
        )}
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center gap-sm">
          <h2 className="card-title mr-auto">Write-time compile</h2>
          <span className="badge text-warning">Not connected</span>
        </div>
        <p className="mt-xs max-w-[70ch] text-body-sm text-on-surface-muted">
          Once the backend runs, extracted signals, source quotes, rubric versions, and token cost per document appear here.
        </p>
      </section>
    </div>
  );
}
