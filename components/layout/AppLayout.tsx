"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import BottomPlayer from "../player/BottomPlayer";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";
import { usePlayerStore } from "@/store/player-store";
import { useHasMounted } from "@/hooks/useHasMounted";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mounted = useHasMounted();
  const title = usePlayerStore((s) => s.title);
  const hasActiveTrack = mounted && Boolean(title);
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isNowPlayingPage = pathname === "/now-playing";

  if (isAuthPage || isNowPlayingPage) {
    return (
      <div className="min-h-screen text-white overflow-y-auto" style={{ background: "var(--mf-bg-base)" }}>
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
          <div
            className={cn(
              "flex-1 overflow-y-auto scrollbar-none relative",
              hasActiveTrack ? "pb-32 md:pb-[88px]" : "pb-20 md:pb-6"
            )}
          >
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


