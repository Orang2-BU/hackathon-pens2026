"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";

// Demo gate only: this password is a placeholder shown to judges, not real authentication.
const DEMO_PASSWORD = "admin123";
const AUTH_KEY = "tessera-demo-auth";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/dashboard";
  const [error, setError] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    if (password === DEMO_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      router.push(next.startsWith("/") ? next : "/dashboard");
    } else {
      setError("Incorrect password. For this demo, use the password shown below.");
    }
  };

  return (
    <div className="glass edge-glow flex w-full max-w-(--container-md) flex-col gap-md rounded-lg p-lg">
      <div className="flex flex-col items-start gap-sm">
        <span className="grid size-10 place-items-center rounded-sm bg-primary text-on-primary">
          <LockKeyhole size={20} aria-hidden />
        </span>
        <h1 className="text-title font-semibold">Demo sign in</h1>
        <p className="text-body-sm text-on-surface-muted">
          This workspace runs on the fictional KasirNusa dataset. Judges and reviewers can enter with the demo password.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-sm">
        <label className="flex flex-col gap-xs text-label-md">
          Password
          <input
            name="password"
            type="password"
            autoComplete="off"
            placeholder="Enter demo password"
            aria-invalid={error !== ""}
            className="h-11 rounded-md bg-surface px-md text-body-md ring-1 ring-outline ring-inset placeholder:text-on-surface-muted focus-visible:ring-primary"
          />
        </label>
        {error && <p role="alert" className="text-body-sm text-danger">{error}</p>}
        <button type="submit" className="mt-xs h-11 rounded-full bg-primary font-semibold text-on-primary transition-opacity hover:opacity-90">
          Enter workspace
        </button>
      </form>

      <p className="rounded-md bg-surface-elevated p-md text-body-sm text-on-surface-muted">
        Demo password: <span className="font-semibold text-on-surface">admin123</span> — a placeholder gate for the
        hackathon demo, not real authentication. No production data sits behind it.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh grid-cols-1 place-items-center bg-neutral px-md py-lg text-on-surface">
      <div className="flex w-full max-w-(--container-md) flex-col items-center gap-md">
        <Link href="/" className="flex items-center gap-sm self-start text-label-md text-on-surface-muted transition-colors hover:text-on-surface">
          <ArrowLeft size={16} aria-hidden /> Back to overview
        </Link>
        <Suspense fallback={<p className="text-body-sm text-on-surface-muted">Loading…</p>}>
          <LoginForm />
        </Suspense>
        <p className="text-body-sm text-on-surface-muted">Tessera — Churn Early Warning Graph · PENS Hackathon 2026</p>
      </div>
    </div>
  );
}
