"use client";

import { usePlayerStore } from "@/store/player-store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHasMounted } from "@/hooks/useHasMounted";
import {
  Home,
  Heart,
  ListMusic,
  Clock,
  Settings,
  Music2,
  Plus,
  List,
  Compass,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { Playlist } from "@/types/music";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/library", icon: ListMusic, label: "Library" },
  { href: "/liked", icon: Heart, label: "Liked" },
  { href: "/playlists", icon: ListMusic, label: "Playlists" },
  { href: "/recently-played", icon: Clock, label: "Recent" },
  { href: "/queue", icon: List, label: "Queue" },
];

export function Sidebar() {
  const pathname = usePathname();
  const mounted = useHasMounted();
  const { playlists, addPlaylist } = usePlayerStore(
    useShallow((s) => ({
      playlists: s.playlists,
      addPlaylist: s.addPlaylist,
    }))
  );
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await addPlaylist(newPlaylistName.trim());
    setNewPlaylistName("");
    setShowAddPlaylist(false);
  };

  return (
    <>
      {/* Redesigned Floating Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-[260px] h-full rounded-[24px] bg-zinc-950/60 backdrop-blur-3xl border border-white/[0.06] p-5 shrink-0 z-40 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.9)] relative overflow-hidden">
        {/* Glow Layer */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-purple-900/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-3 px-2 mb-8 select-none relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
            <Music2 className="text-black w-4.5 h-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white leading-none">
            MusicFlow
          </span>
        </Link>

        {/* Navigation Section */}
        <nav className="space-y-0.5 flex-grow overflow-y-auto pr-1 scrollbar-none relative z-10">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group",
                  active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-white/[0.04] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={16}
                  className={cn(
                    "relative z-10 transition-colors",
                    active ? "text-purple-400" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}

          <div className="h-px bg-white/[0.05] my-4 mx-2" />

          {/* Playlists Header */}
          <div className="flex items-center justify-between px-3 py-2 text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-650">Playlists</span>
            <button
              onClick={() => setShowAddPlaylist(true)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition duration-150 active:scale-95"
              aria-label="Create playlist"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Playlist Input Form */}
          <AnimatePresence>
            {showAddPlaylist && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-2 space-y-2 bg-white/[0.03] rounded-xl border border-white/[0.05] my-2 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5 text-[10px]">
                  <button
                    onClick={() => setShowAddPlaylist(false)}
                    className="px-2 py-1 text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePlaylist}
                    className="px-2.5 py-1 bg-white text-black font-bold rounded transition-all active:scale-95"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Playlists List */}
          <div className="space-y-0.5 mt-2 max-h-[220px] overflow-y-auto scrollbar-none pr-0.5">
            {mounted ? (
              playlists.map((pl: Playlist) => {
                const active = pathname === `/playlists/${pl.id}`;
                return (
                  <Link
                    key={pl.id}
                    href={`/playlists/${pl.id}`}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2 text-[12px] rounded-lg transition-all group",
                      active
                        ? "bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                    )}
                  >
                    <span className="truncate max-w-[150px]">{pl.name}</span>
                    <span className="text-[9px] text-zinc-550 group-hover:text-zinc-450 font-bold bg-white/[0.04] px-1.5 py-0.5 rounded-full border border-white/[0.03]">
                      {pl.songs.length}
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className="space-y-2.5 px-3.5 py-2.5">
                <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              </div>
            )}
          </div>
        </nav>

        {/* Footer / Settings Link */}
        <div className="pt-4 border-t border-white/[0.05] space-y-1 relative z-10">
          <Link
            href="/settings"
            className={cn(
              "relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group",
              pathname === "/settings" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {pathname === "/settings" && (
              <motion.div
                layoutId="active-nav"
                className="absolute inset-0 bg-white/[0.04] border border-white/[0.06] rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Settings
              size={16}
              className={cn(
                "relative z-10 transition-colors",
                pathname === "/settings" ? "text-purple-400" : "text-zinc-400 group-hover:text-zinc-200"
              )}
            />
            <span className="relative z-10">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Redesigned Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-[60px] bg-zinc-950/70 backdrop-blur-3xl border border-white/[0.06] rounded-2xl flex items-center justify-around px-4 z-50 shadow-[0_16px_40px_rgba(0,0,0,0.8)]">
        {NAV_ITEMS.slice(0, 4).map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-14 h-full text-[9px] transition-colors relative",
                active ? "text-white" : "text-zinc-500"
              )}
            >
              <Icon size={18} className={active ? "text-white" : "text-zinc-500"} />
              <span className="font-semibold">{label}</span>
              {active && (
                <motion.div
                  layoutId="mobile-pip"
                  className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
