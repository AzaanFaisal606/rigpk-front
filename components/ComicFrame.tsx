interface Props {
  sub?: string;
  height?: number;
  accent?: string;
  children: React.ReactNode;
}

const monoFont = '"JetBrains Mono", "Fira Code", monospace';
const FOLD = 20; // px for corner fold triangle

export default function ComicFrame({
  sub,
  height = 300,
  accent = "#7c3aed",
  children,
}: Props) {
  return (
    <div
      style={{
        position: "relative",
        height,
        border: "4px solid #111112",
        boxShadow: "8px 8px 0 #111112",
        overflow: "hidden",
        background: "#f4f4f5",
      }}
    >
      {/* Halftone background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(124,58,237,0.12) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
          pointerEvents: "none",
        }}
      />
      {/* Radial gradient overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.55) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {children}
      </div>

      {/* Page corner fold — top-right */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: `${FOLD}px ${FOLD}px 0 0`,
          borderColor: `#111112 transparent transparent transparent`,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: `${FOLD - 4}px ${FOLD - 4}px 0 0`,
          borderColor: `var(--bg) transparent transparent transparent`,
        }}
      />

      {/* Sub-caption bar — bottom-right */}
      {sub && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            background: "#111112",
            color: "white",
            fontFamily: monoFont,
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            padding: "4px 10px",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
