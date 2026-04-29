"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Returns true when the user scrolls down past `threshold` px.
 * Returns false when they scroll back up.
 */
export function useScrollHide(threshold = 80): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    function handler() {
      const y = window.scrollY;
      if (y > lastY.current && y > threshold) {
        setHidden(true);
      } else if (y < lastY.current) {
        setHidden(false);
      }
      lastY.current = y;
    }
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);

  return hidden;
}
