"use client";

import { useEffect, useRef } from "react";
import { THEMES } from "@/lib/themes";
import type { Attitude } from "@/lib/persona";

export type ReactorStatus = "idle" | "listening" | "thinking" | "speaking";

/**
 * Status changes brightness; theme changes hue. Idle sits on the deep stop,
 * live states climb to the hot one, so the core reads as "warming up".
 */
function paletteFor(theme: Attitude, status: ReactorStatus) {
  const t = THEMES[theme] ?? THEMES.ultron;
  switch (status) {
    case "listening":
      return { core: t.hot, ring: t.base, glowAlpha: 0.75 };
    case "thinking":
      return { core: t.base, ring: t.base, glowAlpha: 0.6 };
    case "speaking":
      return { core: t.hot, ring: t.hot, glowAlpha: 0.9 };
    default:
      return { core: t.deep, ring: t.deep, glowAlpha: 0.35 };
  }
}

/** Canvas shadows need rgba, but the theme tokens are hex. */
function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const n = parseInt(v.length === 3 ? v.split("").map((c) => c + c).join("") : v, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const SIZE = 260;
const SPOKES = 88;

export default function Reactor({
  levelRef,
  status,
  theme,
}: {
  levelRef: React.MutableRefObject<number>;
  status: ReactorStatus;
  theme: Attitude;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusRef = useRef<ReactorStatus>(status);
  const themeRef = useRef<Attitude>(theme);
  const smoothed = useRef<number[]>(new Array(SPOKES).fill(0));

  // Keep the animation loop reading fresh status without restarting it.
  // Both feed the running animation loop without tearing it down and rebuilding it.
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    let raf = 0;
    let t = 0;

    const draw = () => {
      const mode = statusRef.current;
      const c = paletteFor(themeRef.current, mode);
      const level = Math.min(1, Math.max(0, levelRef.current));
      t += still ? 0 : 1;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // Outer sweep: a conic-style gradient faked with an arc stroke that rotates.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((t * 0.004) % (Math.PI * 2));
      ctx.strokeStyle = c.ring;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * Math.PI * 2;
        ctx.globalAlpha = 0.2 + (i / 12) * 0.65;
        ctx.beginPath();
        ctx.arc(0, 0, 118, a0, a0 + 0.34);
        ctx.stroke();
      }
      ctx.restore();

      // Counter-rotating tick ring.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-(t * 0.0022) % (Math.PI * 2));
      ctx.strokeStyle = c.ring;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const long = i % 5 === 0;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 100, Math.sin(a) * 100);
        ctx.lineTo(Math.cos(a) * (long ? 90 : 95), Math.sin(a) * (long ? 90 : 95));
        ctx.stroke();
      }
      ctx.restore();

      // Audio bloom: every spoke is a band of the live signal, eased toward its target.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = c.core;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (let i = 0; i < SPOKES; i++) {
        const a = (i / SPOKES) * Math.PI * 2;
        // Standing-wave shaping so the bloom looks like a signal, not a starburst.
        const shape = 0.55 + 0.45 * Math.sin(i * 0.7 + t * 0.03);
        const target = level * shape * 38 + (mode === "idle" ? 2 : 4);
        smoothed.current[i] += (target - smoothed.current[i]) * 0.24;
        const len = smoothed.current[i];

        ctx.globalAlpha = 0.35 + Math.min(0.6, len / 34);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 58, Math.sin(a) * 58);
        ctx.lineTo(Math.cos(a) * (58 + len), Math.sin(a) * (58 + len));
        ctx.stroke();
      }
      ctx.restore();

      // Core: radius breathes with amplitude, glow tracks status.
      const pulse = still ? 0 : Math.sin(t * 0.05) * 2;
      const radius = 34 + level * 13 + pulse;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.28, c.core);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.save();
      ctx.globalAlpha = mode === "idle" ? 0.55 : 1;
      ctx.shadowBlur = 34 + level * 46;
      ctx.shadowColor = hexToRgba(c.core, c.glowAlpha);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Containment ring around the core.
      ctx.strokeStyle = c.core;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [levelRef]);

  return (
    <canvas
      ref={canvasRef}
      className="reactor"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={`Reactor core, ${theme} palette, status ${status}`}
    />
  );
}
