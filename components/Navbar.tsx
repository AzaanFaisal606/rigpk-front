"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { monoFont } from "@/lib/tokens";
import ThemeButton from "./ThemeButton";

const NAV_LINKS = [
  { href: "/market", label: "Market", match: (p: string) => p === "/market" },
  { href: "/build", label: "Build PC", match: (p: string) => p === "/build" },
  { href: "/trends", label: "Trends", match: (p: string) => p.startsWith("/trends") },
  { href: "/prebuilts", label: "Pre-Builts", match: (p: string) => p.startsWith("/prebuilts") },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "var(--bg)",
        borderBottom: "2px solid var(--ink)",
      }}
    >
      <div className="navbar-inner max-w-6xl mx-auto px-6 flex items-center" style={{ height: "52px" }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
          <div
            className="flex items-center justify-center w-7 h-7"
            style={{
              background: "var(--purple)",
              border: "2px solid var(--ink)",
              boxShadow: "2px 2px 0 var(--shadow)",
              overflow: "hidden",
            }}
          >
            <img
              src="/logo.png"
              alt="RigPK"
              width={28}
              height={28}
              style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <span
            className="font-bold"
            style={{ color: "var(--text)", fontSize: "0.95rem", letterSpacing: "-0.01em" }}
          >
            Rig<span style={{ color: "var(--purple-text)" }}>PK</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 ml-auto">
          {/* Desktop: the four buttons. Stays in the server HTML on mobile
              too (just hidden), so crawlers always see the nav links. */}
          <nav className="navbar-nav flex items-center gap-2">
            {NAV_LINKS.map(l => (
              <NavButton key={l.href} href={l.href} active={l.match(pathname)}>{l.label}</NavButton>
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

function navButtonStyle(active: boolean, hovered: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    background: active
      ? hovered ? "var(--purple-hover)" : "var(--purple)"
      : hovered ? "color-mix(in srgb, var(--purple) 6%, transparent)" : "var(--paper)",
    color: active ? "white" : "var(--text)",
    border: "2px solid var(--ink)",
    boxShadow: active ? "var(--gloss), 2px 2px 0 var(--shadow)" : "2px 2px 0 var(--shadow)",
    transform: "skewX(-8deg)",
    fontFamily: monoFont,
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    textDecoration: "none",
    transition: "background 0.1s",
    whiteSpace: "nowrap",
  };
}

function NavButton({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      className="navbar-nav-btn"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={navButtonStyle(active, hovered)}
    >
      {children}
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
    <div ref={wrapRef} className="navbar-menu" style={{ position: "relative" }}>
      <button
        type="button"
        className="navbar-nav-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="navbar-menu-panel"
        onClick={() => setOpen(o => !o)}
        style={{ ...navButtonStyle(!!current, false), cursor: "pointer" }}
      >
        {current?.label ?? "Menu"}
        <ChevronDown
          size={12}
          strokeWidth={3}
          aria-hidden
          style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <nav
          id="navbar-menu-panel"
          aria-label="Site"
          className="navbar-menu-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            minWidth: "168px",
            background: "var(--paper)",
            border: "2px solid var(--ink)",
            boxShadow: "4px 4px 0 var(--shadow)",
            zIndex: 60,
          }}
        >
          {NAV_LINKS.map((l, i) => {
            const active = l === current;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`navbar-menu-item${active ? " navbar-menu-item--active" : ""}`}
                style={{
                  display: "block",
                  padding: "11px 14px",
                  borderTop: i === 0 ? "none" : "1px solid var(--ink)",
                  fontFamily: monoFont,
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
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
