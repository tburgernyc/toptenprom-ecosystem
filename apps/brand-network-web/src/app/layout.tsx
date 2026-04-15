import type { Metadata, Viewport } from "next";
import { Bodoni_Moda } from "next/font/google";
import "./globals.css";

// ---------------------------------------------------------------------------
// Fonts
// Bodoni Moda (display / editorial) — loaded via next/font/google,
// injected as CSS variable --font-bodoni consumed in globals.css @theme.
//
// Satoshi (body copy) — loaded via @font-face in globals.css from Fontshare
// CDN and referenced via --font-satoshi CSS variable.
// ---------------------------------------------------------------------------

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-bodoni",
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_ROOT_DOMAIN"]
      ? `https://${process.env["NEXT_PUBLIC_ROOT_DOMAIN"]}`
      : "http://localhost:3000"
  ),
  title: {
    template: "%s | Top 10 Prom",
    default: "Top 10 Prom — Luxury Prom & Bridal Boutiques",
  },
  description:
    "Discover the most exclusive prom and bridal gowns at Top 10 Prom boutiques across the country.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [{ color: "#0B0A0E" }],
  width: "device-width",
  initialScale: 1,
};

// ---------------------------------------------------------------------------
// Root layout — renders <html> and <body> shell
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={bodoniModa.variable} suppressHydrationWarning>
      <head>
        {/* Satoshi body font from Fontshare CDN */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
