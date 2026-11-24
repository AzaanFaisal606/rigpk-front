interface GameBenchmarksPanelProps {
  style?: React.CSSProperties;
}

export function GameBenchmarksPanel({ style }: GameBenchmarksPanelProps) {
  return (
    <div className="bench-panel" style={style}>
      <div className="bench-head">
        <span className="bench-title">
          ◼ GAME BENCHMARKS
        </span>
      </div>
      <div className="bench-body">
        <p className="bench-text">
          {`// Game performance data coming soon.`}
          <br />
          {"We're working on it."}
        </p>
      </div>
    </div>
  );
}
