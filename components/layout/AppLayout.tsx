"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import BottomPlayer from "../player/BottomPlayer";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";
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
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch(console.error);
    }
  }, []);

  if (isAuthPage) {
    return (
      <div className="min-h-screen text-white" style={{ background: "var(--mf-bg-base)" }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen text-white overflow-hidden font-sans relative select-none"
      style={{ background: "var(--mf-bg-base)" }}
    >
      {/* Middle Layout: Compact Sidebar + Large Main Content Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Desktop Navigation Sidebar */}
        <Sidebar />

        {/* Large Main Content Stage */}
        <div
          className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative"
          style={{ background: "var(--mf-bg-surface)" }}
        >
          {/* Top Nav Bar */}
          <Navbar />

          {/* Scrollable Main Body */}
          <div className="flex-1 overflow-y-auto scrollbar-none relative pb-36 md:pb-28">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar (hidden on md+) */}
      <MobileBottomNav />

      {/* Persistent Audio Player (docked at bottom) */}
      <BottomPlayer />
    </div>
  );
}


