import AmbientLoops from "./AmbientLoops";

/**
 * Animated diagonal dashed lines filling the hero panel.
 *
 * Every line is a static dashed strip that slides along its own direction,
 * so the whole effect is a transform animation the compositor runs without
 * repainting anything. (Animating stroke-dashoffset instead repaints the SVG
 * on every frame: cheap in Chrome, but on iOS WebKit paints on the CPU at 3×
 * and the hero stuttered.)
 *
 * Smooth loop: a strip moves exactly one dash + gap per cycle, so the
 * pattern lands back on itself with no visible jump.
 *
 * Two fields are rendered and CSS shows one: a wide one for the desktop
 * panel and a tighter, denser one for the phone panel. The hidden field is
 * display:none, so its animations don't run at all.
 */

interface Spec {
  strokeWidth: number;
  opacity: number;
  dash: number;   // visible dash length
  gap: number;    // gap between dashes
  dur: number;    // seconds per dash + gap
  color: string;
}

// One cycle of ten looks, repeated across the field.
const SPECS: Spec[] = [
  { strokeWidth: 3.5, opacity: 0.20, dash: 300, gap: 130, dur: 5.0, color: "var(--grey-500)" },
  { strokeWidth: 4.5, opacity: 0.42, dash: 280, gap: 120, dur: 3.5, color: "var(--purple-text)" },
  { strokeWidth: 3.0, opacity: 0.22, dash: 260, gap: 140, dur: 4.2, color: "var(--grey-600)" },
  { strokeWidth: 5.0, opacity: 0.50, dash: 310, gap: 115, dur: 3.0, color: "var(--purple-accent)" },
  { strokeWidth: 3.2, opacity: 0.28, dash: 270, gap: 135, dur: 4.6, color: "var(--purple-text)" },
  { strokeWidth: 4.2, opacity: 0.38, dash: 295, gap: 120, dur: 3.8, color: "var(--purple-accent)" },
  { strokeWidth: 3.0, opacity: 0.24, dash: 255, gap: 145, dur: 4.0, color: "var(--grey-500)" },
  { strokeWidth: 5.0, opacity: 0.46, dash: 305, gap: 118, dur: 3.2, color: "var(--purple-text)" },
  { strokeWidth: 3.0, opacity: 0.22, dash: 265, gap: 138, dur: 4.4, color: "var(--faint)" },
  { strokeWidth: 4.0, opacity: 0.40, dash: 285, gap: 125, dur: 3.6, color: "var(--purple-accent)" },
];

const SQRT2 = Math.SQRT2;

interface Field {
  key: string;
  w: number;
  h: number;
  spacing: number;
}

// Sized to the largest panel each layout draws; the panel clips the rest.
const FIELDS: Field[] = [
  { key: "wide", w: 1400, h: 780, spacing: 36 },
  { key: "narrow", w: 420, h: 820, spacing: 27 },
];

/**
 * Lines at 45° from lower-left to upper-right: every point on line i has
 * x + y = c. A strip runs down-left along its line (the way the dashes
 * flow), starting one repeat unit before the line enters the field, so
 * sliding it by one unit never uncovers an end.
 */
function strips({ w, h, spacing }: Field) {
  const out = [];
  for (let c = spacing / 2, i = 0; c < w + h; c += spacing, i++) {
    const s = SPECS[i % SPECS.length];
    const xTop = Math.min(w, c);
    const xBottom = Math.max(0, c - h);
    const span = (xTop - xBottom) * SQRT2;
    const unit = s.dash + s.gap;
    const pad = s.strokeWidth; // room for the round caps
    const back = unit + pad;
    const x0 = xTop + back / SQRT2;
    const y0 = c - xTop - back / SQRT2;
    const length = Math.ceil(back + span + pad);
    const height = Math.ceil(s.strokeWidth + 2);
    // Stagger the phase so neighbouring dashes don't line up.
    const delay = -(((i * 137) % unit) / unit) * s.dur;
    out.push({ ...s, i, x0, y0, length, height, unit, delay });
  }
  return out;
}

export default function DiagLines() {
  const fields = FIELDS.map(f => ({ ...f, strips: strips(f) }));
  const units = [...new Set(fields.flatMap(f => f.strips.map(s => s.unit)))];

  return (
    <AmbientLoops className="diag-lines">
      <style>{units.map(u => `
        @keyframes dl${u} {
          from { transform: rotate(135deg) translateX(0); }
          to   { transform: rotate(135deg) translateX(${u}px); }
        }
      `).join("")}</style>
      {fields.map(f => (
        <div key={f.key} className={`diag-field diag-field--${f.key}`} style={{ width: f.w, height: f.h }}>
          {f.strips.map(s => (
            <svg
              key={s.i}
              className="diag-strip ambient-loop"
              width={s.length}
              height={s.height}
              viewBox={`0 0 ${s.length} ${s.height}`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                left: s.x0,
                top: s.y0 - s.height / 2,
                animation: `dl${s.unit} ${s.dur}s linear ${s.delay.toFixed(3)}s infinite`,
              }}
            >
              <line
                x1={s.strokeWidth / 2}
                y1={s.height / 2}
                x2={s.length}
                y2={s.height / 2}
                style={{ stroke: s.color }}
                strokeWidth={s.strokeWidth}
                strokeOpacity={Math.min(1, s.opacity * 0.9)}
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeLinecap="round"
              />
            </svg>
          ))}
        </div>
      ))}
    </AmbientLoops>
  );
}
