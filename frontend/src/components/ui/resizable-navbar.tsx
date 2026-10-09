"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";

// Adapted from "Resizable Navbar" (Aceternity UI via 21st.dev): full width at the top,
// it shrinks into a frosted pill after 100px of scroll. framer-motion replaces `motion`,
// Lucide replaces Tabler, and tokens replace the original colours.
type NavItem = { name: string; href: string };

function Logo() {
  return (
    <Link href="/" className="relative flex min-h-11 items-center gap-sm">
      <span className="grid size-8 place-items-center rounded-sm bg-primary text-on-primary">
        <svg viewBox="56 56 144 144" className="size-4" aria-hidden>
          <path fill="currentColor" d="M56 56H200V104H152V200L104 152V104Z" />
        </svg>
      </span>
      <span className="card-title">Tessera</span>
    </Link>
  );
}

export function ResizableNavbar({ items, workspaceHref }: { items: NavItem[]; workspaceHref: string }) {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [activeHref, setActiveHref] = useState(items[0]?.href);
  const spring = reduced ? { duration: 0 } : ({ type: "spring", stiffness: 200, damping: 50 } as const);

  useMotionValueEvent(scrollY, "change", latest => setCompact(latest > 100));

  useEffect(() => {
    const syncHash = () => setActiveHref(window.location.hash || items[0]?.href);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Same 1px border in both states so the bar does not jump when the glass appears.
  const surface = (on: boolean) => (on ? "glass" : "border border-transparent");

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-md pt-sm">
      <motion.nav
        aria-label="Main"
        animate={{ maxWidth: compact ? "64rem" : "72rem", y: compact ? 8 : 0 }}
        transition={spring}
        className={`relative mx-auto hidden w-full min-w-0 items-center justify-between gap-md rounded-full px-md py-xs transition-colors lg:flex ${surface(compact)}`}
      >
        <Logo />
        <div className="flex items-center justify-center gap-xs">
          {items.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setActiveHref(item.href)}
              aria-current={activeHref === item.href ? "location" : undefined}
              className="group relative inline-flex min-h-11 items-center px-sm py-sm text-label-md text-on-surface-muted transition-colors hover:text-on-surface aria-[current=location]:text-on-surface"
            >
              <span aria-hidden className={`pointer-events-none absolute inset-x-sm bottom-1 h-px origin-left bg-primary transition-transform duration-200 motion-reduce:transition-none ${activeHref === item.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"}`} />
              <span className="relative">{item.name}</span>
            </a>
          ))}
        </div>
        <div className="relative flex items-center gap-sm">
          <Link href={workspaceHref} className="btn btn-primary">Open workspace</Link>
        </div>
      </motion.nav>

      <div className={`mx-auto flex max-w-6xl flex-col rounded-lg px-sm py-xs transition-colors lg:hidden ${surface(compact || open)}`}>
        <div className="flex items-center justify-between">
          <Logo />
          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen(current => !current)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center text-on-surface"
          >
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <ul className="flex flex-col border-t border-outline pt-xs">
                {items.map(item => (
                  <li key={item.href}>
                    <a href={item.href} aria-current={activeHref === item.href ? "location" : undefined} onClick={() => { setActiveHref(item.href); setOpen(false); }} className="group flex min-h-11 items-center px-xs text-body-md text-on-surface-muted hover:text-on-surface aria-[current=location]:text-on-surface">
                      <span className="relative py-sm">{item.name}<span aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-1 h-px origin-left bg-primary transition-transform duration-200 motion-reduce:transition-none ${activeHref === item.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"}`} /></span>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-sm py-sm">
                <Link href={workspaceHref} className="btn btn-primary w-full">Open workspace</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
