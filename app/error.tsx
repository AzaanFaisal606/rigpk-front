"use client";

import Link from "next/link";
import { monoFont } from "@/lib/tokens";

// Kept deliberately plain — an error page that itself fetches something can
// fail twice. No network calls, no data-dependent components.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "60vh", background: "var(--bg)" }}
    >
      <div
        style={{
          border: "2px solid #111112",
          boxShadow: "6px 6px 0 #111112",
          background: "var(--bg-card)",
          padding: "40px 32px",
          maxWidth: "440px",
        }}
      >
        <p
          style={{
            fontFamily: monoFont,
            fontSize: "0.9rem",
            fontWeight: 900,
            color: "var(--purple)",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          {"// SOMETHING WENT WRONG"}
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "12px" }}>
          The page hit an unexpected error. This is on us, not your connection.
        </p>
        <div className="flex items-center justify-center gap-3" style={{ marginTop: "24px" }}>
          <button
            onClick={() => reset()}
            className="mono"
            style={{
              border: "2px solid #111112",
              boxShadow: "2px 2px 0 #111112",
              background: "var(--purple)",
              color: "white",
              padding: "8px 16px",
              fontSize: "0.65rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transform: "skewX(-8deg)",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="mono"
            style={{
              border: "2px solid #111112",
              boxShadow: "2px 2px 0 #111112",
              background: "white",
              color: "#111112",
              padding: "8px 16px",
              fontSize: "0.65rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transform: "skewX(-8deg)",
              display: "inline-block",
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
