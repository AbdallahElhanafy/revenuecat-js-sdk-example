import type { Metadata, Viewport } from "next";
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
  title: "RevenueCat Fullscreen Paywall Example",
  description:
    "A Next.js reference for rendering a RevenueCat purchases-js paywall fullscreen on iOS Safari.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Extends content under the notch/home-indicator so the paywall can pad
  // itself with safe-area insets instead of leaving unstyled system gaps.
  viewportFit: "cover",
  // Asks Safari to shrink the layout viewport for the keyboard instead of
  // overlaying it — the visualViewport listener in FullscreenPaywallStage
  // is the fallback for engines that ignore this.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
