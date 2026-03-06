import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { AdSlot } from "@/components/ads/AdSlot";
import { Suspense } from "react";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Matchups - Sports Gambler Intelligence | Free AI-Powered Betting Analysis",
  description: "The ultimate FREE sports gambling intelligence platform. AI-powered betting analysis, trend finder, sharp money signals, and edge detection for NFL, NBA, NHL, MLB.",
  keywords: ["sports betting", "gambling intelligence", "betting trends", "sharp money", "NFL betting", "NBA betting", "NHL betting", "MLB betting", "betting edge", "trend finder"],
  metadataBase: new URL('https://matchups.vercel.app'),
  openGraph: {
    title: "Matchups - Sports Gambler Intelligence",
    description: "Free AI-powered betting analysis, edge detection, sharp money signals, and trend finder for NFL, NBA, NHL, MLB, and college sports.",
    url: 'https://matchups.vercel.app',
    siteName: 'Matchups',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Matchups - Sports Gambler Intelligence",
    description: "Free AI-powered betting analysis, edge detection, sharp money signals for NFL, NBA, NHL, MLB.",
    creator: '@matchups_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://matchups.vercel.app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-text-primary min-h-screen`}
      >
        <AuthProvider>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <Navbar />
          {/* Header Ad - below navbar */}
          <div className="w-full flex justify-center py-2 bg-background-secondary border-b border-border">
            <AdSlot position="header" className="mx-auto" />
          </div>
          <main className="pt-4">
            {children}
          </main>
          {/* Footer Ad - above footer */}
          <div className="w-full flex justify-center py-4 bg-background-secondary border-t border-border">
            <AdSlot position="footer" className="mx-auto" />
          </div>
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
