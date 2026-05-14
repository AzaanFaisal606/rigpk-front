interface Props {
  angle?: number;
  scale?: number;
}

export default function PCThumb({ angle = 0, scale = 1 }: Props) {
  return (
    <svg
      viewBox="0 0 120 180"
      width={120 * scale}
      height={180 * scale}
      style={{ transform: `rotate(${angle}deg)`, display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Halftone dots background */}
      <defs>
        <pattern id="dots" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.8" style={{ fill: "var(--purple)" }} opacity="0.18" />
        </pattern>
      </defs>
      <rect width="120" height="180" fill="url(#dots)" />

      {/* Case outline */}
      <rect x="20" y="10" width="80" height="160" fill="none" stroke="#111112" strokeWidth="2.5" />

      {/* Front panel top strip */}
      <rect x="20" y="10" width="80" height="22" fill="#111112" />

      {/* Power button */}
      <circle cx="86" cy="21" r="5" fill="none" style={{ stroke: "var(--purple)" }} strokeWidth="1.5" />
      <circle cx="86" cy="21" r="2" style={{ fill: "var(--purple)" }} />

      {/* Drive bays */}
      <rect x="30" y="40" width="28" height="6" fill="none" stroke="#111112" strokeWidth="1.2" />
      <rect x="30" y="52" width="28" height="6" fill="none" stroke="#111112" strokeWidth="1.2" />

      {/* Mesh/vent area */}
      {[0,1,2,3,4,5].map(i => (
        <line
          key={i}
          x1="30" y1={72 + i * 7} x2="90" y2={72 + i * 7}
          stroke="#111112" strokeWidth="0.8" strokeDasharray="3 3"
        />
      ))}

      {/* GPU bracket */}
      <rect x="30" y="120" width="60" height="14" fill="none" stroke="#111112" strokeWidth="1.5" />
      {/* GPU fans */}
      <circle cx="50" cy="127" r="5" fill="none" style={{ stroke: "var(--purple)" }} strokeWidth="1.2" />
      <circle cx="70" cy="127" r="5" fill="none" style={{ stroke: "var(--purple)" }} strokeWidth="1.2" />

      {/* RAM stick hints */}
      <rect x="95" y="50" width="6" height="30" style={{ fill: "var(--purple)" }} opacity="0.5" />
      <rect x="103" y="50" width="6" height="30" style={{ fill: "var(--purple)" }} opacity="0.35" />

      {/* Bottom strip */}
      <rect x="20" y="158" width="80" height="12" fill="#111112" />
    </svg>
  );
}
