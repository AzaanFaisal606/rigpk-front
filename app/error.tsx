"use client";

import Link from "next/link";

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
    <div className="status-page flex flex-col items-center justify-center text-center px-6">
      {/* Streamed pages can't change their status, so a backend failure on a
          first render (Render cold start) ships as 200. Keep it out of the
          index; React 19 hoists this into <head>. */}
      <meta name="robots" content="noindex" />
      <div className="status-card">
        <p className="status-title status-title--error">
          {"// SOMETHING WENT WRONG"}
        </p>
        <p className="status-text status-text--loose">
          The page hit an unexpected error. This is on us, not your connection.
        </p>
        <div className="status-actions flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="status-btn status-btn--primary"
          >
            Try again
          </button>
          <Link
            href="/"
            className="status-btn status-btn--secondary"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
