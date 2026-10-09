import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { DashboardPreview } from "@/components/dashboard-preview";
import { LandingDetails } from "@/components/landing-details";
import { ContainerScroll } from "@/components/ui/container-scroll";
import { ResizableNavbar } from "@/components/ui/resizable-navbar";
import { ShapeGrid } from "@/components/ui/shape-grid";
import { Reveal } from "@/components/ui/reveal";
import { TechText } from "@/components/ui/tech-text";

const workspaceHref = `/login?next=${encodeURIComponent("/dashboard")}`;
const sections = [
  { name: "Home", href: "#hero-heading" },
  { name: "Evidence", href: "#evidence-heading" },
  { name: "Workflow", href: "#workflow-heading" },
  { name: "Decisions", href: "#decide-heading" },
  { name: "FAQ", href: "#faq-heading" },
];
const CONTACT_EMAIL = "aditya.fadni@gmail.com";

export default function LandingPage() {
  return (
    <div className="min-h-dvh text-on-surface">
      <ShapeGrid />
      <a href="#evidence-heading" className="sr-only fixed top-md left-md z-50 rounded-md bg-primary p-md text-on-primary focus:not-sr-only">Skip to product details</a>
      <ResizableNavbar items={sections} workspaceHref={workspaceHref} />
      <main className="page-enter mx-auto flex w-full max-w-(--container-6xl) flex-col gap-2xl px-md pb-2xl md:gap-24">
        <section aria-labelledby="hero-heading" className="pt-24 md:pt-28">
          <ContainerScroll header={
            <div className="mx-auto flex max-w-(--container-3xl) flex-col items-center gap-md text-center">
              <h1 id="hero-heading" className="h-36 w-full scroll-mt-28 md:h-56"><TechText text="Tessera" /></h1>
              <p className="max-w-(--container-2xl) text-body-md text-on-surface-muted md:text-title md:font-normal">
                Catch the accounts your dashboard calls healthy. Tessera connects your CRM, product usage, support, billing and past decisions into one evidence graph, ranks every account by risk, and leaves every decision to your team.
              </p>
              <Link href={workspaceHref} className="btn btn-primary">Open workspace <ArrowRight size={16} aria-hidden /></Link>
            </div>
          }><DashboardPreview /></ContainerScroll>
        </section>
        <LandingDetails workspaceHref={workspaceHref} />
        <Reveal>
          <section aria-labelledby="cta-heading" className="rounded-lg bg-surface p-lg md:p-2xl">
            <div className="grid items-center gap-lg md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="max-w-(--container-2xl)"><p className="label-caps text-primary">Explore Tessera</p><h2 id="cta-heading" className="mt-sm text-headline-lg font-bold tracking-headline-lg">Start with the reason behind the risk.</h2><p className="mt-md text-body-md text-on-surface-muted">Explore the workspace, inspect an account and review a plan. See how connected evidence can support your next decision.</p><p className="mt-sm text-label-sm text-on-surface-muted">Preview uses sample data. No customer outreach is sent.</p></div>
              <Link href={workspaceHref} className="btn btn-primary justify-self-start">Open workspace <ArrowRight size={16} aria-hidden /></Link>
            </div>
          </section>
        </Reveal>
        <section aria-labelledby="contact-heading" className="flex flex-col items-start gap-lg border-t border-outline pt-xl md:flex-row md:items-center md:justify-between">
          <div className="max-w-(--container-2xl)"><h2 id="contact-heading" className="text-title font-semibold">Bring your customer context together.</h2><p className="mt-sm text-body-md text-on-surface-muted">Want to discuss how Tessera could fit your team’s workflow? Talk to us about your sources, your process and the decisions you need to make.</p></div>
          <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-secondary shrink-0"><Mail size={16} aria-hidden /> Talk to the team</a>
        </section>
      </main>
      <footer className="border-t border-outline">
        <div className="mx-auto grid w-full max-w-(--container-6xl) gap-xl px-md py-2xl md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="flex flex-col gap-md">
            <Link href="/" className="flex min-h-11 w-fit items-center gap-sm card-title">
              <span className="grid size-8 place-items-center rounded-sm bg-primary text-on-primary">
                <svg viewBox="56 56 144 144" className="size-4" aria-hidden><path fill="currentColor" d="M56 56H200V104H152V200L104 152V104Z" /></svg>
              </span>
              Tessera
            </Link>
            <p className="max-w-(--container-sm) text-body-sm text-on-surface-muted">Customer Success, with context. Connected evidence, explainable priority and decisions your team makes.</p>
          </div>
          <nav aria-label="Product" className="flex flex-col gap-xs text-body-sm">
            <p className="label-caps text-on-surface-muted">Product</p>
            {sections.map(({ name, href }) => <a key={href} href={href} className="inline-flex min-h-11 w-fit items-center text-on-surface-muted transition-colors hover:text-on-surface xl:min-h-8">{name}</a>)}
          </nav>
          <nav aria-label="Workspace" className="flex flex-col gap-xs text-body-sm">
            <p className="label-caps text-on-surface-muted">Workspace</p>
            {[["Dashboard", "/dashboard"], ["Accounts", "/accounts"], ["Review", "/review"], ["Data", "/data"]].map(([name, href]) => <Link key={href} href={href} className="inline-flex min-h-11 w-fit items-center text-on-surface-muted transition-colors hover:text-on-surface xl:min-h-8">{name}</Link>)}
          </nav>
          <div className="flex flex-col gap-xs text-body-sm">
            <p className="label-caps text-on-surface-muted">Contact</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-11 w-fit items-center gap-sm break-all text-on-surface-muted transition-colors hover:text-on-surface xl:min-h-8"><Mail size={14} className="shrink-0" aria-hidden />{CONTACT_EMAIL}</a>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-(--container-6xl) flex-wrap items-center justify-between gap-md border-t border-outline px-md py-md text-label-sm text-on-surface-muted">
          <span>Built for PENS Hackathon 2026. Preview uses synthetic sample data.</span>
          <a href="#hero-heading" className="inline-flex min-h-11 items-center rounded-sm px-sm hover:text-on-surface">Back to top <ArrowRight size={14} className="ml-sm -rotate-90" aria-hidden /></a>
        </div>
      </footer>
    </div>
  );
}
