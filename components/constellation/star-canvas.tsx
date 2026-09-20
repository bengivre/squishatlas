"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  p: number;
  s: number;
  c: string;
};
type Shot = { x: number; y: number; vx: number; vy: number; life: number };

/** Twinkling stars and the occasional shooting star behind the sky. */
export function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let stars: Star[] = [];
    let shots: Shot[] = [];
    let raf = 0;
    let width = 0;
    let height = 0;

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((width * height) / 6500);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        p: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 1.2,
        c:
          Math.random() < 0.12
            ? "#ffc96b"
            : Math.random() < 0.1
              ? "#6fe3d0"
              : "#fff4e2",
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        ctx.globalAlpha = reduce
          ? 0.7
          : 0.45 + 0.45 * Math.sin((t / 1000) * s.s + s.p);
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) {
        if (Math.random() < 0.003 && shots.length < 2) {
          shots.push({
            x: Math.random() * width * 0.8,
            y: Math.random() * height * 0.4,
            vx: 9 + Math.random() * 4,
            vy: 4 + Math.random() * 2,
            life: 1,
          });
        }
        for (const sh of shots) {
          ctx.globalAlpha = sh.life;
          const g = ctx.createLinearGradient(
            sh.x,
            sh.y,
            sh.x - sh.vx * 9,
            sh.y - sh.vy * 9,
          );
          g.addColorStop(0, "#fff4e2");
          g.addColorStop(1, "rgba(255,244,226,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(sh.x - sh.vx * 9, sh.y - sh.vy * 9);
          ctx.stroke();
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.life -= 0.022;
        }
        shots = shots.filter((s) => s.life > 0);
      }
      ctx.globalAlpha = 1;
      if (!reduce) {
        raf = requestAnimationFrame(draw);
      }
    };

    size();
    raf = requestAnimationFrame(draw);
    const observer = new ResizeObserver(() => {
      size();
      if (reduce) draw(0);
    });
    observer.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="sky-stars" aria-hidden />;
}
