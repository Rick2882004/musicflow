import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DatabaseLoader from "@/components/DatabaseLoader";
import PlayerEngine from "@/components/player/PlayerEngine";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "../src/context/AuthContext";
import { ReactQueryProvider } from "@/lib/react-query";
import { PWARegister } from "@/components/pwa/PWARegister";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#07070A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "MusicFlow",
  description: "Your personal music universe — stream millions of songs, artists, and albums.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MusicFlow",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-512.png",
  },
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
        {/* theme-color matches manifest.json background_color for consistent chrome UI */}
        <meta name="theme-color" content="#07070A" />
        {/* PWA / mobile web app capabilities */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MusicFlow" />
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#07070A" />
        <meta name="msapplication-TileImage" content="/icon-512.png" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body className="min-h-screen bg-[#07070a] text-white">
        <ReactQueryProvider>
          <AuthProvider>
            <PWARegister />
            <DatabaseLoader />
            <AppLayout>{children}</AppLayout>
            <PlayerEngine />
            <PWAInstallPrompt />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}