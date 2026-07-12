"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, Music2, ListMusic, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Library", href: "/library", icon: Music2 },
  { name: "Playlists", href: "/playlists", icon: ListMusic },
  { name: "Profile", href: "/profile", icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#0a0a0e]/80 backdrop-blur-xl border-t border-white/[0.05] flex items-center justify-around px-2 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
        const Icon = tab.icon;

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className="relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition duration-150 active:scale-90"
          >
            {/* Background Active Pill Indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-purple-500/10 border border-purple-500/20 rounded-xl"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}

            <Icon
              size={18}
              className={cn(
                "relative z-10 transition-colors duration-200",
                isActive ? "text-purple-400" : "text-zinc-500"
              )}
            />
            <span
              className={cn(
                "text-[9px] font-bold tracking-wide mt-1 relative z-10 transition-colors duration-200",
                isActive ? "text-purple-300" : "text-zinc-500"
              )}
            >
              {tab.name}
            </span>

            {/* Micro Active Glow Dot */}
            {isActive && (
              <motion.span
                layoutId="activeTabDot"
                className="absolute bottom-1 w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
