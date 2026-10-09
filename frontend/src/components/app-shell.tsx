"use client";

import Form from "next/form";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Database, GitBranch, ClipboardList, Globe, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, Users, X } from "lucide-react";
import { api } from "@/lib/workspace";

// Public pages render bare; workspace writes use the backend-authenticated session.
const isPublicPath = (pathname: string) => pathname === "/" || pathname.startsWith("/login");

// Exact or nested match, so "/" never claims every route.
const isOn = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Users },
  { href: "/investigate", label: "Investigate", icon: GitBranch },
  { href: "/actions", label: "Actions", icon: ClipboardList },
  { href: "/review", label: "Review", icon: ShieldCheck },
  { href: "/data", label: "Data", icon: Database },
  { href: "/", label: "Landing page", icon: Globe },
];

// Desktop rail: labels fade out while the aside is collapsed and fade in on hover or keyboard focus.
const railFade = "opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-has-[:focus-visible]/rail:opacity-100";

function Sidebar({ onNavigate, rail = false }: { onNavigate?: () => void; rail?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const fade = rail ? railFade : "";
  const [logoutError, setLogoutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    setLogoutError("");
    try {
      await api("auth/logout", "POST");
      onNavigate?.();
      router.push("/");
    } catch { setLogoutError("Sign out failed. Try again."); }
    finally { setSigningOut(false); }
  };

  return (
    <div className="glass edge-glow flex h-full flex-col gap-lg overflow-hidden whitespace-nowrap rounded-lg p-md">
      <Link href="/dashboard" onClick={onNavigate} className="flex min-h-11 w-fit items-center gap-sm rounded-md card-title">
        <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-primary text-on-primary">
          <svg viewBox="56 56 144 144" className="size-4" aria-hidden>
            <path fill="currentColor" d="M56 56H200V104H152V200L104 152V104Z" />
          </svg>
        </span>
        <span className={fade}>Tessera</span>
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-xs">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = isOn(pathname, href);
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

            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-sm rounded-md bg-surface-elevated p-sm">
        <span className="grid size-7 shrink-0 place-items-center rounded-sm text-on-surface-muted">
          <Database size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <div className={fade}>
          <p className="text-label-md font-semibold">KasirNusa</p>
          <p className="mt-xs text-label-sm text-on-surface-muted">Synthetic dataset · 1 Oct 2026</p>
        </div>
      </div>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        title={rail ? "Sign out" : undefined}
        className="btn btn-secondary justify-start px-1.5"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-sm">
          <LogOut size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <span className={fade}>Sign out</span>
      </button>
      {logoutError && <p role="alert" className={`whitespace-normal text-label-sm text-danger ${fade}`}>{logoutError}</p>}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const query = useSearchParams().get("q") ?? "";
  const drawer = useRef<HTMLDialogElement>(null);
  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (isPublic) return;
    let alive = true;
    api<{ authenticated: boolean }>("auth/session").then(session => {
      if (alive && !session.authenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }).catch(() => { /* The page displays its API error and retry action. */ });
    return () => { alive = false; };
  }, [isPublic, pathname, router]);

  // One delegated listener feeds the border glow on cards, buttons and the sidebar (globals.css).
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>(".btn:not(:disabled), .card, .card-featured, .edge-glow") : null;
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
      card.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  // Play the slide-out, then close; close() restores focus to the burger.
  const closeDrawer = () => {
    const dialog = drawer.current;
    if (!dialog?.open || dialog.classList.contains("closing")) return;
    dialog.classList.add("closing");
    dialog.addEventListener(
      "animationend",
      () => {
        dialog.classList.remove("closing");
        dialog.close();
      },
      { once: true },
    );
  };
  const title = pathname.startsWith("/accounts/")
    ? "Account detail"
    : navigation.find(item => isOn(pathname, item.href))?.label ?? "Tessera";

  if (isPublic) return <>{children}</>;

  return (
    <div className="min-h-dvh xl:grid xl:grid-cols-[auto_minmax(0,1fr)] xl:gap-md xl:p-md">
      <aside className="group/rail sticky top-md hidden h-[calc(100dvh-2rem)] w-[76px] transition-[width] duration-200 ease-out hover:w-[248px] has-[:focus-visible]:w-[248px] xl:block">
        <Sidebar rail />
      </aside>

      <dialog
        ref={drawer}
        aria-label="Navigation"
        onClick={event => event.target === event.currentTarget && closeDrawer()}
        onCancel={event => {
          event.preventDefault();
          closeDrawer();
        }}
        className="drawer m-0 h-dvh max-h-dvh w-72 max-w-[85vw] bg-transparent p-sm text-on-surface"
      >
        <Sidebar onNavigate={closeDrawer} />
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Close navigation"
          className="absolute right-5 top-5 grid size-11 place-items-center text-on-surface-muted transition-colors hover:text-on-surface"
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
            className="btn btn-secondary size-11 rounded-full p-0 xl:hidden"
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
        <main key={pathname} className="page-enter">{children}</main>
      </div>
    </div>
  );
}
