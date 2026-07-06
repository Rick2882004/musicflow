"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import BottomPlayer from "../player/BottomPlayer";
import Navbar from "./Navbar";
import { useEffect } from "react";

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
    <div className="flex h-screen bg-[#07070a] text-white overflow-hidden premium-gradient font-sans p-4 gap-4">
      {/* Desktop Glass Sidebar */}
      <Sidebar />

      {/* Main Content Area - Suspended Card */}
      <div className="flex-1 flex flex-col min-w-0 h-full rounded-[24px] bg-zinc-950/20 border border-white/[0.05] overflow-hidden relative shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
        {/* Floating Glass Top Bar */}
        <Navbar />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-36 scrollbar-none relative z-10">
          {children}
        </div>
      </div>

      {/* Media Player at the bottom */}
      <BottomPlayer />
    </div>
  );
}
