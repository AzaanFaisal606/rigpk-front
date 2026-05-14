import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rigpk.vercel.app"),
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-[var(--text)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "RigPK",
              alternateName: "RigPK — PC Part Picker for Pakistan",
              url: "https://rigpk.vercel.app",
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
