// Line drawing of a mid-tower's insides, shared by the build page's
// wireframe and the homepage's build panel. Colours are theme tokens (SVG
// attributes resolve var()), so a parent can recolour it by overriding them.
const INK = "var(--line-art)";
const PURPLE = "var(--purple)";
const CARD = "var(--bg-card)";
const DIM = "var(--faint)";
const MONO = "var(--mono)";

export function PCChassisSVG({ viewBox = "0 0 960 540" }: { viewBox?: string }) {
  // ViewBox 960×540. Chassis x=320..620 (width 300), y=30..510 (height 480).
  // Motherboard tray x=335..605, y=70..420. The homepage crops to the chassis.
  return (
    <svg
      viewBox={viewBox}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      {/* Vertical rail guide lines */}
      <line x1="300" y1="50" x2="300" y2="490" stroke={INK} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.3" />
      <line x1="640" y1="50" x2="640" y2="490" stroke={INK} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.3" />

      {/* ── Chassis outer walls ── */}
      <rect x="320" y="30" width="300" height="480" fill="none" stroke={INK} strokeWidth="2.5" />
      {/* Inner dashed inset */}
      <rect x="328" y="38" width="284" height="464" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

      {/* Top I/O strip */}
      <line x1="360" y1="38" x2="450" y2="38" stroke={INK} strokeWidth="3" />
      <circle cx="350" cy="44" r="3" fill="none" stroke={INK} strokeWidth="1.5" />
      <rect x="460" y="40" width="34" height="5" fill="none" stroke={INK} strokeWidth="1" />
      <rect x="500" y="40" width="34" height="5" fill="none" stroke={INK} strokeWidth="1" />

      {/* Motherboard tray outline */}
      <rect x="335" y="70" width="270" height="340" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.35" />

      {/* CPU zone — top-left of board */}
      <g>
        <rect x="355" y="85" width="90" height="90" fill={CARD} stroke={INK} strokeWidth="2" />
        <circle cx="400" cy="130" r="30" fill="none" stroke={INK} strokeWidth="2" />
        <circle cx="400" cy="130" r="18" fill="none" stroke={INK} strokeWidth="1" />
        <text x="400" y="134" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={INK}>CPU</text>
      </g>

      {/* RAM zone — right of CPU, fully inside board (4 sticks) */}
      <g>
        <rect x="465" y="85" width="115" height="90" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={475 + i * 25} y="95"
            width="15" height="72"
            fill={i < 2 ? CARD : "none"}
            stroke={INK}
            strokeWidth={i < 2 ? 2 : 1}
            strokeDasharray={i < 2 ? "none" : "2 2"}
            opacity={i < 2 ? 1 : 0.5}
          />
        ))}
      </g>

      {/* Cooling fans — moved BELOW RAM, near right edge so no overlap.
          Two fans stacked vertically on right side, at y=210 and y=290. */}
      <g>
        <circle cx="580" cy="210" r="22" fill="none" stroke={INK} strokeWidth="2" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1="580" y1="210"
            x2={580 + Math.cos((a * Math.PI) / 180) * 18}
            y2={210 + Math.sin((a * Math.PI) / 180) * 18}
            stroke={INK} strokeWidth="1.2" opacity="0.6"
          />
        ))}
        <circle cx="580" cy="210" r="5" fill={INK} />

        <circle cx="580" cy="290" r="22" fill="none" stroke={INK} strokeWidth="2" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1="580" y1="290"
            x2={580 + Math.cos((a * Math.PI) / 180) * 18}
            y2={290 + Math.sin((a * Math.PI) / 180) * 18}
            stroke={INK} strokeWidth="1.2" opacity="0.6"
          />
        ))}
        <circle cx="580" cy="290" r="5" fill={INK} />
      </g>

      {/* GPU — long horizontal card, mid */}
      <g>
        <rect x="340" y="235" width="215" height="55" fill={CARD} stroke={INK} strokeWidth="2" />
        <circle cx="378" cy="262" r="20" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="378" cy="262" r="7" fill={INK} opacity="0.8" />
        <circle cx="448" cy="262" r="20" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="448" cy="262" r="7" fill={INK} opacity="0.8" />
        <circle cx="518" cy="262" r="20" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="518" cy="262" r="7" fill={INK} opacity="0.8" />
      </g>

      {/* SSD — narrow horizontal rect below GPU */}
      <g>
        <rect x="345" y="308" width="190" height="22" fill={CARD} stroke={INK} strokeWidth="2" />
        <rect x="353" y="314" width="8" height="10" fill={INK} opacity="0.6" />
        <line x1="368" y1="319" x2="528" y2="319" stroke={INK} strokeWidth="0.8" opacity="0.5" />
      </g>

      {/* Chipset + mobo anchor marker */}
      <g>
        <rect x="475" y="345" width="70" height="50" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="510" cy="370" r="6" fill={PURPLE} />
        <text x="510" y="388" textAnchor="middle" fontFamily={MONO} fontSize="8" fill={DIM}>CHIPSET</text>
      </g>

      {/* PSU — bottom shroud */}
      <g>
        <rect x="325" y="420" width="290" height="70" fill={CARD} stroke={INK} strokeWidth="2" />
        <circle cx="375" cy="455" r="26" fill="none" stroke={INK} strokeWidth="1.5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={360 + i * 8} y1="435" x2={360 + i * 8} y2="475" stroke={INK} strokeWidth="0.8" opacity="0.5" />
        ))}
        <text x="520" y="460" textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="700" fill={INK}>PSU</text>
      </g>

      {/* Case feet */}
      <rect x="335" y="510" width="40" height="10" fill={INK} />
      <rect x="565" y="510" width="40" height="10" fill={INK} />
    </svg>
  );
}
