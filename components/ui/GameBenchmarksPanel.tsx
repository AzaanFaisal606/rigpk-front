import { monoFont } from "@/lib/tokens";

interface GameBenchmarksPanelProps {
  style?: React.CSSProperties;
}

export function GameBenchmarksPanel({ style }: GameBenchmarksPanelProps) {
  return (
    <div style={{ border: "2px solid #111112", boxShadow: "5px 5px 0 #111112", background: "white", ...style }}>
      <div style={{ background: "var(--purple)", padding: "8px 12px" }}>
        <span style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "white", letterSpacing: "2px", textTransform: "uppercase" }}>
          ◼ GAME BENCHMARKS
        </span>
      </div>
      <div style={{ padding: "24px 18px" }}>
        <p style={{ fontFamily: monoFont, fontSize: "11px", color: "#a1a1aa", margin: 0, lineHeight: 1.7 }}>
          {`// Game performance data coming soon.`}
          <br />
          {"We're working on it."}
        </p>
      </div>
    </div>
  );
}
