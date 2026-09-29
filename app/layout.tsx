import type { Metadata } from "next";
import { Fragment_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { SITE_URL } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";

// TeX Gyre Heros: a free Helvetica (GUST Font License, see app/fonts/),
// self-hosted so every OS gets the same face. Windows would swap a bare
// "Helvetica" for Arial. Regular and Bold only: 500 renders as 400, 600+ as 700.
const heros = localFont({
  variable: "--font-heros",
  display: "swap",
  src: [
    { path: "./fonts/heros-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/heros-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/heros-bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/heros-bolditalic.woff2", weight: "700", style: "italic" },
  ],
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});

// Data face: prices, specs, counts, tags. One weight exists (400).
const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: { google: "m6z967mmdOlQekmoR1OXUv2-SVPDBJax2g6SUn1lZXA" },
  applicationName: "RigPK",
  title: {
    default: "RigPK — PC Part Picker for Pakistan",
    template: "%s | RigPK",
  },
  description:
    "Compare PC part prices from Pakistani retailers. Build your dream rig and track price history.",
  keywords: [
    "PC parts Pakistan",
    "GPU price Pakistan",
    "CPU price Pakistan",
    "buy PC parts online Pakistan",
    "PC builder Pakistan",
  ],
  openGraph: {
    type: "website",
    siteName: "RigPK",
    title: "RigPK — PC Part Picker for Pakistan",
    description: "Compare PC part prices from Pakistani retailers. Build your dream rig.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RigPK — PC Part Picker for Pakistan",
    description: "Compare PC part prices from Pakistani retailers.",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${heros.variable} ${fragmentMono.variable} h-full antialiased`}
      // The theme script below sets data-theme before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col text-[var(--text)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "RigPK",
              alternateName: "RigPK — PC Part Picker for Pakistan",
              url: SITE_URL,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "RigPK",
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
            }),
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
