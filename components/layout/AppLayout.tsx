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
    <div className="flex h-screen bg-[#07070a] text-white overflow-hidden premium-gradient font-sans">
      {/* Desktop Glass Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Floating Glass Top Bar */}
        <Navbar />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-32 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {children}
        </div>
      </div>

      {/* Media Player at the bottom */}
      <BottomPlayer />
    </div>
  );
}
