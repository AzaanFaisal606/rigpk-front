"use client";

/**
 * Animated diagonal dashed lines — bottom-right ~40% of hero.
 *
 * Smooth loop fix: for a seamless stroke-dashoffset loop, the animation
 * range must equal exactly one full (dash + gap) repeat unit. We animate
 * from -(dash+gap) to 0 so the pattern tiles perfectly with no skip.
 */

interface LineSpec {
  x1: number; y1: number;
  x2: number; y2: number;
  strokeWidth: number;
  opacity: number;
  dash: number;   // visible dash length
  gap: number;    // gap between dashes
  dur: string;
  color: string;
}

// All lines at exactly 45°: Δx === Δy for every line (x2-x1 === y1-y2).
// Coordinate space: 1100×920. Triangle clip: (0,920) → (1100,0) → (1100,920).
// Lines anchored to right edge (x2=1100) sweeping y2 from 0→820 to cover full corner.
const LINES: LineSpec[] = [
  // ── lines reaching the very top-right corner ─────────────────────────
  { x1: -100, y1:  820, x2: 1100, y2: -380, strokeWidth: 3.5, opacity: 0.20, dash: 300, gap: 130, dur: "5.0s", color: "#71717a" },
  { x1:    0, y1:  920, x2: 1100, y2: -180, strokeWidth: 4.5, opacity: 0.42, dash: 280, gap: 120, dur: "3.5s", color: "var(--purple)" },
  { x1:  100, y1:  920, x2: 1100, y2:  -80, strokeWidth: 3.0, opacity: 0.22, dash: 260, gap: 140, dur: "4.2s", color: "#52525b" },
  { x1:  180, y1:  920, x2: 1100, y2:    0, strokeWidth: 5.0, opacity: 0.50, dash: 310, gap: 115, dur: "3.0s", color: "var(--purple-accent)" },
  // ── main diagonal sweep across the hero ──────────────────────────────
  { x1:  270, y1:  920, x2: 1100, y2:   90, strokeWidth: 3.2, opacity: 0.28, dash: 270, gap: 135, dur: "4.6s", color: "var(--purple)" },
  { x1:  360, y1:  920, x2: 1100, y2:  180, strokeWidth: 4.2, opacity: 0.38, dash: 295, gap: 120, dur: "3.8s", color: "var(--purple-accent)" },
  { x1:  450, y1:  920, x2: 1100, y2:  270, strokeWidth: 3.0, opacity: 0.24, dash: 255, gap: 145, dur: "4.0s", color: "#71717a" },
  { x1:  540, y1:  920, x2: 1100, y2:  360, strokeWidth: 5.0, opacity: 0.46, dash: 305, gap: 118, dur: "3.2s", color: "var(--purple)" },
  { x1:  630, y1:  920, x2: 1100, y2:  450, strokeWidth: 3.0, opacity: 0.22, dash: 265, gap: 138, dur: "4.4s", color: "#a1a1aa" },
  { x1:  720, y1:  920, x2: 1100, y2:  540, strokeWidth: 4.0, opacity: 0.40, dash: 285, gap: 125, dur: "3.6s", color: "var(--purple-accent)" },
  // ── lower-right fill ─────────────────────────────────────────────────
  { x1:  800, y1:  920, x2: 1100, y2:  620, strokeWidth: 3.5, opacity: 0.32, dash: 275, gap: 130, dur: "4.8s", color: "var(--purple-accent)" },
  { x1:  860, y1:  920, x2: 1100, y2:  680, strokeWidth: 4.5, opacity: 0.48, dash: 300, gap: 120, dur: "3.4s", color: "var(--purple)" },
  { x1:  920, y1:  920, x2: 1100, y2:  740, strokeWidth: 3.0, opacity: 0.26, dash: 260, gap: 140, dur: "4.2s", color: "#71717a" },
  { x1:  980, y1:  920, x2: 1100, y2:  800, strokeWidth: 4.0, opacity: 0.36, dash: 290, gap: 122, dur: "3.9s", color: "var(--purple-accent)" },
  { x1: 1040, y1:  920, x2: 1100, y2:  860, strokeWidth: 3.5, opacity: 0.44, dash: 270, gap: 132, dur: "4.5s", color: "var(--purple)" },
];

export default function DiagLines() {
  const W = 1100;
  const H = 920;

  return (
    <div
      aria-hidden
      className="absolute bottom-0 right-0 pointer-events-none"
      style={{ width: W, height: H }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <defs>
          {/* Lower-right triangle — lines go right to the corner */}
          <clipPath id="diag-tri">
            <polygon points={`0,${H} ${W},0 ${W},${H}`} />
          </clipPath>

          {/* Radial fade: fully opaque at corner, fades toward hypotenuse */}
          <radialGradient
            id="diag-fade"
            cx={W} cy={H} r={W * 1.1}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%"   stopColor="white" stopOpacity="1" />
            <stop offset="35%"  stopColor="white" stopOpacity="1" />
            <stop offset="70%"  stopColor="white" stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="diag-mask">
            <rect width={W} height={H} fill="url(#diag-fade)" />
          </mask>

          {/*
            Smooth loop: animate strokeDashoffset from -(dash+gap) → 0.
            This shifts exactly one repeat unit, so the pattern tiles with
            no visible jump at the loop boundary.
          */}
          <style>{`
            ${LINES.map((l, i) => {
              const unit = l.dash + l.gap;
              return `
                @keyframes dl${i} {
                  from { stroke-dashoffset: ${-unit}px; }
                  to   { stroke-dashoffset: 0px; }
                }
                .dl-${i} {
                  animation: dl${i} ${l.dur} linear infinite;
                }
              `;
            }).join("")}
          `}</style>
        </defs>

        <g clipPath="url(#diag-tri)" mask="url(#diag-mask)">
          {LINES.map((l, i) => (
            <line
              key={i}
              className={`dl-${i}`}
              x1={l.x1} y1={l.y1}
              x2={l.x2} y2={l.y2}
              style={{ stroke: l.color }}
              strokeWidth={l.strokeWidth}
              strokeOpacity={l.opacity}
              strokeDasharray={`${l.dash} ${l.gap}`}
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
