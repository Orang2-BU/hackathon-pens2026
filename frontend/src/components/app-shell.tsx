"use client";

import Form from "next/form";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useRef } from "react";
import { Activity, Database, Menu, Search, ShieldCheck, Users, Waypoints, X } from "lucide-react";
import { useDemoState } from "@/components/demo-state";
import { reviewItems } from "@/lib/demo-data";

const navigation = [
  { href: "/accounts", label: "Accounts", icon: Users },
  { href: "/review", label: "Review", icon: ShieldCheck },
  { href: "/benchmark", label: "Benchmark", icon: Activity },
  { href: "/data", label: "Data", icon: Database },
];

// Desktop rail: labels fade out while the aside is collapsed and fade in on hover or keyboard focus.
const railFade = "opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-has-[:focus-visible]/rail:opacity-100";

function Sidebar({ onNavigate, rail = false }: { onNavigate?: () => void; rail?: boolean }) {
  const pathname = usePathname();
  const { resolvedReviewIds } = useDemoState();
  const pending = reviewItems.filter(item => !resolvedReviewIds.includes(item.id)).length;
  const fade = rail ? railFade : "";

  return (
    <div className={`flex h-full flex-col gap-lg overflow-hidden whitespace-nowrap rounded-lg p-md ${rail ? "bg-surface" : "glass"}`}>
      <Link href="/accounts" onClick={onNavigate} className="flex min-h-11 w-fit items-center gap-sm rounded-md card-title">
        <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-primary text-on-primary">
          <Waypoints size={18} strokeWidth={2} aria-hidden />
        </span>
        <span className={fade}>Tessera</span>
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-xs">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={rail ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-sm rounded-md px-1.5 text-label-md transition-colors xl:min-h-10 ${
                active ? "bg-on-surface font-semibold text-neutral" : "text-on-surface-muted hover:bg-surface-elevated hover:text-on-surface"
              }`}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-sm ${active ? "bg-primary text-on-primary" : ""}`}>
                <Icon size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <span className={fade}>{label}</span>
              {href === "/review" && pending > 0 && (
                <span className={`ml-auto mr-1.5 rounded-sm bg-neutral px-1.5 text-label-sm text-on-surface ${fade}`}>
                  {pending}<span className="sr-only"> pending</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-sm rounded-md bg-surface-elevated p-sm">
        <span className="grid size-7 shrink-0 place-items-center rounded-sm text-on-surface-muted">
          <Database size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <div className={fade}>
          <p className="text-label-md font-semibold">Demo workspace</p>
          <p className="mt-xs text-label-sm text-on-surface-muted">Synthetic seed data</p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const query = useSearchParams().get("q") ?? "";
  const drawer = useRef<HTMLDialogElement>(null);
  const closeDrawer = () => drawer.current?.close();
  const title = pathname.startsWith("/accounts/")
    ? "Account detail"
    : navigation.find(item => pathname.startsWith(item.href))?.label ?? "Tessera";

  return (
    <div className="min-h-dvh xl:grid xl:grid-cols-[auto_minmax(0,1fr)] xl:gap-md xl:p-md">
      <aside className="group/rail sticky top-md hidden h-[calc(100dvh-2rem)] w-[76px] transition-[width] duration-200 ease-out hover:w-[248px] has-[:focus-visible]:w-[248px] xl:block">
        <Sidebar rail />
      </aside>

      <dialog
        ref={drawer}
        aria-label="Navigation"
        onClick={event => event.target === event.currentTarget && closeDrawer()}
        className="m-0 h-dvh max-h-dvh w-72 max-w-[85vw] bg-transparent p-sm text-on-surface backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <Sidebar onNavigate={closeDrawer} />
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Close navigation"
          className="absolute right-5 top-5 grid size-11 place-items-center rounded-full text-on-surface-muted transition-colors hover:bg-surface-elevated hover:text-on-surface"
        >
          <X size={20} aria-hidden />
        </button>
      </dialog>

      <div className="min-w-0 px-md pb-xl xl:px-0">
        <header className="flex flex-wrap items-center gap-sm py-md xl:pt-0">
          <button
            type="button"
            onClick={() => drawer.current?.showModal()}
            aria-label="Open navigation"
            className="grid size-11 place-items-center rounded-full bg-surface transition-colors hover:bg-surface-elevated xl:hidden"
          >
            <Menu size={20} aria-hidden />
          </button>
          <h1 className="mr-auto text-headline-lg font-bold tracking-headline-lg">{title}</h1>
          <Form action="/accounts" role="search" className="relative order-last w-full md:order-none md:w-80">
            <Search size={18} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-muted" />
            <input
              key={query}
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search accounts, signals, or evidence"
              aria-label="Search accounts, signals, or evidence"
              className="h-11 w-full rounded-full bg-surface pl-11 pr-md text-body-sm ring-1 ring-outline ring-inset placeholder:text-on-surface-muted focus-visible:ring-primary"
            />
          </Form>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
