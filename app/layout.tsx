import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rigpk.vercel.app"),
  title: "RigPK — PC Part Picker for Pakistan",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
