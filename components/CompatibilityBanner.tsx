import type { CompatIssue } from "@/lib/compatibility";

interface Props {
  issues: CompatIssue[];
}

// Both are red so they stand out from the maroon UI around them. They differ
// only in the header: an error is a known clash, a warning is something the
// specs can't settle and the user has to check.
const TONE = {
  error: { fill: "#dc2626", title: (n: number) => `⚠ ${n} COMPATIBILITY ${n === 1 ? "ISSUE" : "ISSUES"}` },
  warning: { fill: "#dc2626", title: (n: number) => `⚠ ${n} ${n === 1 ? "THING" : "THINGS"} TO CHECK` },
} as const;

function Group({ severity, issues }: { severity: CompatIssue["severity"]; issues: CompatIssue[] }) {
  if (issues.length === 0) return null;
  const tone = TONE[severity];
  return (
    <div
      style={{
        marginTop: "20px",
        border: `2px solid ${tone.fill}`,
        boxShadow: `4px 4px 0 ${tone.fill}`,
      }}
    >
      <div
        style={{
          background: tone.fill,
          color: "white",
          padding: "10px 16px",
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontFamily: "var(--mono)",
        }}
      >
        {tone.title(issues.length)}
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
                background: tone.fill,
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
            <span style={{ fontSize: "11px", color: "var(--text)", fontWeight: 500, minWidth: 0 }}>
              {issue.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompatibilityBanner({ issues }: Props) {
  if (issues.length === 0) return null;
  return (
    <>
      <Group severity="error" issues={issues.filter(i => i.severity === "error")} />
      <Group severity="warning" issues={issues.filter(i => i.severity === "warning")} />
    </>
  );
}
