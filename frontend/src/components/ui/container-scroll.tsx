"use client";

import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Adapted from "Container Scroll Animation" (Aceternity UI via 21st.dev): the product
// window starts tilted back and settles flat as the page scrolls. Tokens replace the
// original colours; reduced motion shows it flat from the start.
export function ContainerScroll({ header, children }: { header: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [reduced ? 0 : 18, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [reduced ? 1 : 0.94, 1]);
  const lift = useTransform(scrollYProgress, [0, 0.5], [0, reduced ? 0 : -40]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-xl [perspective:1200px]">
      <motion.div style={{ y: lift }} className="w-full">
        {header}
      </motion.div>
      <motion.div
        style={{ rotateX, scale }}
        className="w-full origin-top rounded-xl max-md:transform-none! bg-surface p-xs shadow-[0_40px_80px_-20px_color-mix(in_srgb,var(--color-neutral)_85%,transparent)] ring-1 ring-outline md:p-sm"
      >
        <div className="flex items-center gap-xs px-sm pb-sm pt-xs" aria-hidden>
          <span className="size-2.5 rounded-full bg-outline-active" />
          <span className="size-2.5 rounded-full bg-outline-active" />
          <span className="size-2.5 rounded-full bg-outline-active" />
          <span className="ml-sm h-6 flex-1 rounded-sm bg-neutral px-sm text-label-sm leading-6 text-on-surface-muted">tessera · customer workspace</span>
        </div>
        <div className="overflow-hidden rounded-lg bg-neutral">{children}</div>
      </motion.div>
    </div>
  );
}
