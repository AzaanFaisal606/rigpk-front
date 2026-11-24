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
    <>
      <Navbar />
      <main className="status-main mx-auto px-6 py-8 flex items-center justify-center text-center">
        <div className="status-card">
          <p className="status-title status-title--error">
            {"// TRENDS TEMPORARILY UNAVAILABLE"}
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
    </>
  );
}
