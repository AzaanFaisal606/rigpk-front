"use client";

import { useEffect, useRef } from "react";

/**
 * Full-page canvas that renders a dot grid.
 * Dots near the mouse cursor (or scroll-based wave) light up in purple.
 * Scroll position drives a ripple wave across the grid.
 */
export default function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SPACING = 28;
    const DOT_R = 1.2;
    const PURPLE = { r: 124, g: 58, b: 237 };

    let mouse = { x: -9999, y: -9999 };
    let scrollY = window.scrollY;
    let raf: number;
    let cols: number, rows: number;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      cols = Math.ceil(canvas!.width / SPACING) + 1;
      rows = Math.ceil(canvas!.height / SPACING) + 1;
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now() / 1000;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING;
          const y = r * SPACING;

          // Distance from mouse
          const dx = x - mouse.x;
          const dy = y - (mouse.y + scrollY);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mouseInfluence = Math.max(0, 1 - dist / 120);

          // Scroll-driven wave: sine ripple emanating downward from top
          const wavePhase = (y / 320) - now * 0.55 + (scrollY / 800);
          const wave = (Math.sin(wavePhase * Math.PI * 2 + c * 0.3) * 0.5 + 0.5);
          const scrollInfluence = wave * Math.max(0, 1 - dist / 400) * 0.35;

          const t = Math.min(1, mouseInfluence * 1.4 + scrollInfluence);

          const alpha = 0.1 + t * 0.7;
          const radius = DOT_R + t * 1.8;

          if (t > 0.01) {
            // Interpolate gray → purple
            const ri = Math.round(0 + PURPLE.r * t);
            const gi = Math.round(0 + PURPLE.g * t);
            const bi = Math.round(0 + PURPLE.b * t);
            ctx.fillStyle = `rgba(${ri},${gi},${bi},${alpha})`;
          } else {
            ctx.fillStyle = `rgba(0,0,0,0.1)`;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }

    function onMouseMove(e: MouseEvent) {
      mouse = { x: e.clientX, y: e.clientY };
    }
    function onScroll() {
      scrollY = window.scrollY;
    }
    function onResize() {
      resize();
    }

    resize();
    draw();

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.85 }}
    />
  );
}
