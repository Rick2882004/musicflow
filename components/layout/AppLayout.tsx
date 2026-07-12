"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import BottomPlayer from "../player/BottomPlayer";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";
import { useEffect } from "react";
import { FriendActivity } from "../social/FriendActivity";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // Register service worker on mount
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) =>
          console.log(
            "Service Worker registered:",
            reg.scope
          )
        )
        .catch(console.error);
    }
  }, []);

  if (isAuthPage) {
    return <div className="min-h-screen bg-black text-white">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-[#07070a] text-white overflow-hidden premium-gradient font-sans p-0 gap-0 md:p-4 md:gap-4">
      {/* Desktop Glass Sidebar */}
      <Sidebar />

      {/* Main Content Area - Suspended Card on desktop, edge-to-edge on mobile */}
      <div className="flex-1 flex flex-col min-w-0 h-full rounded-none md:rounded-[24px] bg-[#07070a] md:bg-zinc-950/20 border-none md:border md:border-white/[0.05] overflow-hidden relative shadow-none md:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
        {/* Floating Glass Top Bar */}
        <Navbar />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-40 scrollbar-none relative z-10">
          {children}
        </div>
      </div>

      {/* Desktop Glass Friend Sidebar */}
      <FriendActivity />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Media Player at the bottom */}
      <BottomPlayer />
    </div>
  );
}
