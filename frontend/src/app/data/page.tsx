"use client";

import { type ChangeEvent, useState } from "react";
import { Check, FileText, Upload, X } from "lucide-react";

const MAX_BYTES = 1_000_000;

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
    if (!/\.(jsonl|txt)$/i.test(file.name)) return setError("Choose a .jsonl or .txt file. Nothing is sent to a server.");
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
        Check a source file in your browser before the Jev ingest pipeline is connected. Nothing is uploaded or stored.
      </p>

      <section className="card">
        <h2 className="card-title">Local file check</h2>
        <p className="mt-xs text-label-sm text-on-surface-muted">JSONL (one object per line) or a plain-text transcript, up to 1 MB.</p>

        <label className="mt-md flex cursor-pointer flex-col items-center gap-xs rounded-md border border-dashed border-outline-active px-md py-xl text-center transition-colors hover:border-primary focus-within:ring-2 focus-within:ring-focus-ring">
          <Upload size={22} aria-hidden className="text-primary" />
          <span className="text-label-md font-semibold">Choose a file to validate</span>
          <span className="text-label-sm text-on-surface-muted">Preview shows the first 3,000 characters</span>
          <input type="file" accept=".jsonl,.txt,text/plain,application/json" onChange={handleFile} className="sr-only" />
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
