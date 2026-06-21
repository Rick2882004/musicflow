import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Navbar from "@/components/layout/Navbar";
import DatabaseLoader from "@/components/DatabaseLoader";

import PlayerEngine from "@/components/player/PlayerEngine";
import BottomPlayer from "@/components/player/BottomPlayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MusicFlow",
  description: "Music Streaming Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-black text-white">
        <DatabaseLoader />

        <Navbar />

        <main className="pb-28">
          {children}
        </main>

        <PlayerEngine />
        <BottomPlayer />
      </body>
    </html>
  );
}