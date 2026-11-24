"use client";

import Navbar from "@/components/Navbar";

// Kept deliberately plain — no fetching. An error page that fetches can fail
// twice.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-bg flex flex-col flex-1">
      <Navbar />
      <main className="flex flex-col flex-1 items-center justify-center text-center px-6">
        <div className="status-card">
          <p className="status-title status-title--error">
            {"// SEARCH FAILED"}
          </p>
          <p className="status-text status-text--loose">
            Couldn&apos;t reach the server. Try again.
          </p>
          <button
            onClick={() => reset()}
            className="status-btn status-btn--primary status-btn--spaced"
          >
            Try again
          </button>
        </div>
      </main>
    </div>
  );
}
