"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getPartDetails, type Part, type PartDetails } from "@/lib/api";
import PartDetail from "./PartDetail";

export { nameFontPx } from "./PartDetail";
export { fullImageUrl } from "@/lib/part-page";

export default function PartDetailModal({ part, onClose }: { part: Part; onClose: () => void }) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  // Set when a link inside the popup (the model page link) navigates away:
  // the list's scroll position must not be restored onto the next page.
  const leavingRef = useRef(false);
  const [details, setDetails] = useState<PartDetails | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    getPartDetails(part.id, ctrl.signal).then(d => {
      if (ctrl.signal.aborted) return;
      if (d) setDetails(d); else setFailed(true);
    });
    return () => ctrl.abort();
  }, [part.id]);

  // Esc closes; focus moves in and back out.
  //
  // Desktop: a fixed overlay, the page behind locked, only the tab panel scrolls.
  // Phone: the sheet becomes the page itself. The rest of the page is hidden
  // and the document scrolls, because mobile Chrome only hides its toolbars on
  // a document scroll, never on an inner scroll box or a fixed overlay. The
  // list's scroll position is restored on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const pageMode = window.matchMedia("(max-width: 760px)").matches;
    const scrollY = window.scrollY;
    const overflow = document.body.style.overflow;
    if (pageMode) {
      root.classList.add("pdm-page-mode");
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      document.body.style.overflow = "hidden";
    }
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (pageMode) {
        root.classList.remove("pdm-page-mode");
        // Instant: the site sets scroll-behavior: smooth, which would animate this jump.
        if (!leavingRef.current) window.scrollTo({ top: scrollY, behavior: "instant" });
      } else {
        document.body.style.overflow = overflow;
      }
      if (!leavingRef.current) prev?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return createPortal(
    <div className="pdm-backdrop" onClick={onClose}>
      <div
        className="pdm"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
      >
        <PartDetail
          part={part}
          details={details}
          failed={failed}
          variant="modal"
          titleId={titleId}
          onLeave={() => { leavingRef.current = true; }}
          closeButton={
            <button ref={closeRef} className="pdm-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          }
        />
      </div>
    </div>,
    document.body
  );
}
