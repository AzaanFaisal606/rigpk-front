import type { CompatIssue } from "@/lib/compatibility";

interface Props {
  issues: CompatIssue[];
}

export default function CompatibilityBanner({ issues }: Props) {
  if (issues.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "20px",
        border: "2px solid #dc2626",
        boxShadow: "4px 4px 0 #dc2626",
      }}
    >
      <div
        style={{
          background: "#dc2626",
          color: "white",
          padding: "10px 16px",
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontFamily: "var(--mono)",
        }}
      >
        {`⚠ ${issues.length} COMPATIBILITY ${issues.length === 1 ? "ISSUE" : "ISSUES"}`}
      </div>
      <div
        style={{
          background: "var(--bg-card)",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {issues.map((issue, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span
              style={{
                background: "#dc2626",
                color: "white",
                padding: "2px 8px",
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                fontFamily: "var(--mono)",
                flexShrink: 0,
              }}
            >
              {issue.category}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text)", fontWeight: 500 }}>
              {issue.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
