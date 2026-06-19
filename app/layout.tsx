import PlayerEngine from "@/components/player/PlayerEngine";
import BottomPlayer from "@/components/player/BottomPlayer";
import { Sidebar } from "@/components/layout/Sidebar";

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
        <div className="flex min-h-screen">

          <Sidebar />

          <main className="flex-1 overflow-auto">
            {children}
          </main>

        </div>

        <PlayerEngine />
<BottomPlayer />
      </body>
    </html>
  );
}