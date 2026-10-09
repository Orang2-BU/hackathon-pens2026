"use client";

import { useEffect, useRef } from "react";

// Adapted from React Bits "ShapeGrid" (square tiles only): a slow diagonal grid behind the
// landing page, with a fading lime trail under the pointer. Tiles echo the tessera idea.
// Colours are design tokens resolved at runtime; reduced motion keeps the grid still.

const SIZE = 40;
const SPEED = 0.25;
const TRAIL = 5;
const FILL_ALPHA = 0.16;

type Cell = { x: number; y: number };

export function ShapeGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const token = (name: string) => getComputedStyle(canvas).getPropertyValue(name).trim();
    const border = token("--color-outline");
    const fill = token("--color-primary");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const offset = { x: 0, y: 0 };
    let hovered: Cell | null = null;
    const trail: Cell[] = [];
    const opacities = new Map<string, number>();
    let width = 0;
    let height = 0;
    let raf = 0;

    const wrap = (value: number) => ((value % SIZE) + SIZE) % SIZE;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pushTrail = () => {
      if (!hovered) return;
      trail.unshift(hovered);
      trail.length = Math.min(trail.length, TRAIL);
    };

    const updateOpacities = () => {
      const targets = new Map<string, number>();
      if (hovered) targets.set(`${hovered.x},${hovered.y}`, 1);
      trail.forEach((cell, i) => {
        const key = `${cell.x},${cell.y}`;
        if (!targets.has(key)) targets.set(key, (trail.length - i) / (trail.length + 1));
      });
      for (const key of targets.keys()) if (!opacities.has(key)) opacities.set(key, 0);
      for (const [key, opacity] of opacities) {
        const next = opacity + ((targets.get(key) ?? 0) - opacity) * 0.15;
        if (next < 0.005) opacities.delete(key);
        else opacities.set(key, next);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const ox = wrap(offset.x);
      const oy = wrap(offset.y);
      const cols = Math.ceil(width / SIZE) + 2;
      const rows = Math.ceil(height / SIZE) + 2;
      ctx.lineWidth = 1;
      ctx.strokeStyle = border;
      ctx.fillStyle = fill;
      for (let col = -1; col < cols; col++) {
        for (let row = -1; row < rows; row++) {
          const sx = col * SIZE + ox;
          const sy = row * SIZE + oy;
          const alpha = opacities.get(`${col},${row}`);
          if (alpha) {
            ctx.globalAlpha = alpha * FILL_ALPHA;
            ctx.fillRect(sx, sy, SIZE, SIZE);
            ctx.globalAlpha = 1;
          }
          ctx.strokeRect(sx + 0.5, sy + 0.5, SIZE, SIZE);
        }
      }
    };

    const frame = () => {
      if (!reduced) {
        offset.x = wrap(offset.x - SPEED);
        offset.y = wrap(offset.y - SPEED);
      }
      updateOpacities();
      draw();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // The canvas sits behind the content, so pointer moves are read from the window.
    const onMove = (event: PointerEvent) => {
      const col = Math.floor((event.clientX - wrap(offset.x)) / SIZE);
      const row = Math.floor((event.clientY - wrap(offset.y)) / SIZE);
      if (hovered?.x === col && hovered.y === row) return;
      pushTrail();
      hovered = { x: col, y: row };
    };
    const onLeave = () => {
      pushTrail();
      hovered = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 block h-dvh w-full [mask-image:radial-gradient(ellipse_90%_70%_at_50%_0%,black,transparent)]"
    />
  );
}
