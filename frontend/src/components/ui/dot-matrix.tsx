"use client";

import { useEffect, useRef } from "react";

// Canvas 2D port of the "canvas reveal" dot matrix (21st.dev modern login): dots ripple in from
// the centre, then each dot steps to a new brightness every few seconds. No WebGL or three.js.
// Colour is the on-surface token; reduced motion draws one still frame.

const TOTAL = 20;
const DOT = 6;
const PERIOD = 5;
const LEVELS = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1];

const hash = (x: number, y: number) => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export function DotMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--color-on-surface").trim();
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const cols = Math.ceil(width / TOTAL);
      const rows = Math.ceil(height / TOTAL);
      const ox = (width - cols * TOTAL + TOTAL - DOT) / 2;
      const oy = (height - rows * TOTAL + TOTAL - DOT) / 2;
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const offset = hash(col, row);
          const reveal = Math.hypot(col - cols / 2, row - rows / 2) * 0.01 + offset * 0.15;
          if (time * 3 < reveal) continue;
          const step = Math.floor(time / PERIOD + offset + PERIOD);
          ctx.globalAlpha = LEVELS[Math.floor(hash(col * step, row * step) * LEVELS.length)];
          ctx.fillRect(ox + col * TOTAL, oy + row * TOTAL, DOT, DOT);
        }
      }
    };

    const frame = () => {
      draw((performance.now() - start) / 1000);
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduced) draw(PERIOD);
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      <canvas ref={canvasRef} className="block size-full opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-neutral)_80%,transparent)_0%,transparent_100%)]" />
    </div>
  );
}
