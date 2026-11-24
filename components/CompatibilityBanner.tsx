import type { CompatIssue } from "@/lib/compatibility";

interface Props {
  issues: CompatIssue[];
}

// Both are red (.compat-* in globals.css). They differ only in the header:
// an error is a known clash, a warning is something the specs can't settle
// and the user has to check.
const TONE = {
  error: { title: (n: number) => `⚠ ${n} COMPATIBILITY ${n === 1 ? "ISSUE" : "ISSUES"}` },
  warning: { title: (n: number) => `⚠ ${n} ${n === 1 ? "THING" : "THINGS"} TO CHECK` },
} as const;

function Group({ severity, issues }: { severity: CompatIssue["severity"]; issues: CompatIssue[] }) {
  if (issues.length === 0) return null;
  const tone = TONE[severity];
  return (
    <div className="compat-group">
      <div className="compat-head">
        {tone.title(issues.length)}
      </div>
      <div className="compat-list">
        {issues.map((issue, i) => (
          <div key={i} className="compat-item">
            <span className="compat-tag">
              {issue.category}
            </span>
            <span className="compat-text">
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
