import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DatabaseLoader from "@/components/DatabaseLoader";
import PlayerEngine from "@/components/player/PlayerEngine";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "../src/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MusicFlow - Premium Music Streaming",
  description: "Experience music in high fidelity with glassmorphic aesthetics.",
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6C63FF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[#07070a] text-white">
        <AuthProvider>
          <DatabaseLoader />
          <AppLayout>{children}</AppLayout>
          <PlayerEngine />
        </AuthProvider>
      </body>
    </html>
  );
}