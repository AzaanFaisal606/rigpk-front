import { monoFont } from "@/lib/tokens";

interface Props {
  sub?: string;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

const FOLD = 20; // px for corner fold triangle

export default function ComicFrame({
  sub,
  height = 300,
  className,
  children,
}: Props) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        height,
        border: "4px solid var(--ink)",
        boxShadow: "8px 8px 0 var(--shadow)",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* Halftone background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--purple) 12%, transparent) 1px, transparent 1px)",
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
            "radial-gradient(ellipse at 50% 40%, var(--glow) 0%, transparent 70%)",
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
          borderColor: `var(--ink) transparent transparent transparent`,
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
            background: "var(--bar)",
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
