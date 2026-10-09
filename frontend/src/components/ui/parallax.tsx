"use client";

import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Move the illustration gently; its surrounding copy and controls stay still.
export function Parallax({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["calc(var(--spacing-lg) * 1)", "calc(var(--spacing-lg) * -1)"]);
  return <div ref={ref} className={className}><motion.div style={{ y: reduced ? 0 : y }}>{children}</motion.div></div>;
}
