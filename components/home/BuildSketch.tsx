import { PCChassisSVG } from "../PCChassis";

// Chassis at x 320–620, y 30–520 of the wireframe's 960×540 space; the
// crop leaves room on the right for the callouts.
const VIEW = "296 14 470 520";

const CALLOUTS = [
  { label: "CPU", from: [400, 130], y: 96 },
  { label: "RAM", from: [528, 130], y: 170 },
  { label: "GPU", from: [520, 262], y: 262 },
  { label: "SSD", from: [520, 319], y: 340 },
  { label: "PSU", from: [590, 455], y: 450 },
];

/**
 * The build page's chassis drawing, re-inked for the maroon panel: the
 * wrapper overrides the tokens the drawing reads, so the same drawing
 * serves both places.
 */
export default function BuildSketch() {
  return (
    <div className="build-sketch" aria-hidden>
      <PCChassisSVG viewBox={VIEW} />
      <svg viewBox={VIEW} className="build-sketch-callouts">
        {CALLOUTS.map(c => (
          <g key={c.label}>
            <polyline
              points={`${c.from[0]},${c.from[1]} 650,${c.y} 684,${c.y}`}
              fill="none" stroke="var(--line-art)" strokeWidth="1.8" strokeDasharray="4 3"
            />
            <rect x={c.from[0] - 4} y={c.from[1] - 4} width="8" height="8" fill="var(--line-art)" />
            <text x="692" y={c.y + 6} fontFamily="var(--mono)" fontSize="17" fill="var(--line-art)" letterSpacing="1">
              {c.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
