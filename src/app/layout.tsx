import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { AdSlot } from "@/components/ads/AdSlot";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Matchups - Sports Betting Analysis & Trends",
  description: "The ultimate sports betting matchup and trends data. AI-powered analysis for NFL, NBA, NHL, MLB, and prediction markets.",
  keywords: ["sports betting", "matchup analysis", "NFL", "NBA", "NHL", "MLB", "betting trends", "prediction markets"],
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
      </body>
    </html>
  );
}
