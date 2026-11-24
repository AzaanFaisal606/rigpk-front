"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import ThemeButton from "./ThemeButton";

// /market and /prebuilts read searchParams, so every prefetch is an uncached
// function render. Only the static/ISR pages keep Next's default prefetch.
const NAV_LINKS = [
  { href: "/market", label: "Market", prefetch: false, match: (p: string) => p === "/market" },
  { href: "/build", label: "Build PC", prefetch: undefined, match: (p: string) => p === "/build" },
  { href: "/trends", label: "Trends", prefetch: undefined, match: (p: string) => p.startsWith("/trends") },
  { href: "/prebuilts", label: "Pre-Builts", prefetch: false, match: (p: string) => p.startsWith("/prebuilts") },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="navbar-header sticky top-0 z-50">
      <div className="navbar-inner max-w-6xl mx-auto px-6 flex items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
          <div className="navbar-logo flex items-center justify-center w-7 h-7">
            <img
              src="/logo.png"
              alt="RigPK"
              width={28}
              height={28}
              className="navbar-logo-img"
            />
          </div>
          <span className="navbar-brand font-bold">
            Rig<span className="navbar-brand-accent">PK</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 ml-auto">
          {/* Desktop: the four buttons. Stays in the server HTML on mobile
              too (just hidden), so crawlers always see the nav links. */}
          <nav className="navbar-nav flex items-center gap-2">
            {NAV_LINKS.map(l => (
              <NavButton key={l.href} href={l.href} prefetch={l.prefetch} active={l.match(pathname)}>{l.label}</NavButton>
            ))}
          </nav>

          {/* Mobile: the same four collapsed into one dropdown. */}
          <MobileNavMenu pathname={pathname} />

          <ThemeButton />
        </div>
      </div>
    </header>
  );
}

function navButtonClass(active: boolean): string {
  return active ? "navbar-nav-btn navbar-nav-btn--active" : "navbar-nav-btn";
}

function NavButton({
  href,
  prefetch,
  active,
  children,
}: {
  href: string;
  prefetch?: boolean;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={navButtonClass(active)}
    >
      <span className="skew-label">{children}</span>
    </Link>
  );
}

function MobileNavMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = NAV_LINKS.find(l => l.match(pathname));

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="navbar-menu">
      <button
        type="button"
        className={navButtonClass(!!current)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="navbar-menu-panel"
        onClick={() => setOpen(o => !o)}
      >
        <span className="navbar-menu-btn-label">
        {current?.label ?? "Menu"}
        <ChevronDown
          size={12}
          strokeWidth={3}
          aria-hidden
          className="navbar-menu-caret"
        />
        </span>
      </button>

      {open && (
        <nav
          id="navbar-menu-panel"
          aria-label="Site"
          className="navbar-menu-panel"
        >
          {NAV_LINKS.map(l => {
            const active = l === current;
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch={l.prefetch}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`navbar-menu-item${active ? " navbar-menu-item--active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
