"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  seed?: number;
  density?: number;
};

type Mote = {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  alpha: number;
};

export function PixelBackground({
  className = "",
  seed = 7,
  density = 80,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    const start = performance.now();

    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    let motes: Mote[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      motes = Array.from({ length: density }, () => ({
        x: rand() * width,
        y: rand() * height,
        size: rand() < 0.82 ? 3 : 6,
        speed: 4 + rand() * 14,
        phase: rand() * Math.PI * 2,
        alpha: 0.12 + rand() * 0.38,
      }));
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);

      for (const mote of motes) {
        const y = reduced
          ? mote.y
          : (mote.y - t * mote.speed) % (height + 20);
        const wrapped = y < -10 ? y + height + 20 : y;
        const sway = reduced ? 0 : Math.sin(t * 0.7 + mote.phase) * 5;
        const flicker = reduced
          ? mote.alpha
          : mote.alpha * (0.65 + Math.sin(t * 1.6 + mote.phase) * 0.35);

        ctx.globalAlpha = Math.max(0, flicker);
        ctx.fillStyle = mote.size >= 6 ? "#ff3047" : "#ffc93c";
        ctx.fillRect(Math.round(mote.x + sway), Math.round(wrapped), mote.size, mote.size);
      }

      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    draw(performance.now());
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [seed, density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
