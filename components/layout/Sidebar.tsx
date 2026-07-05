"use client";

import { usePlayerStore } from "@/store/player-store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Heart,
  ListMusic,
  Clock,
  Settings,
  Music2,
  Plus,
  List,
  Compass,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

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
  const { playlists, addPlaylist } = usePlayerStore(useShallow((s) => ({
    playlists: s.playlists,
    addPlaylist: s.addPlaylist,
  })));
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] h-full glass-sidebar-panel border-r border-white/5 p-5 shrink-0 z-40">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-2 mb-8 select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Music2 className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent tracking-tight">
            MusicFlow
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1 mb-6 flex-grow overflow-y-auto pr-1 scrollbar-none">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                  active
                    ? "text-white"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-purple-600/20 rounded-xl border border-purple-500/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={18}
                  className={cn(
                    "relative z-10 transition-colors",
                    active ? "text-purple-400" : "group-hover:text-zinc-100"
                  )}
                />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}

          <div className="h-px bg-white/5 my-4 mx-2" />

          {/* Playlists Section Header */}
          <div className="flex items-center justify-between px-4 py-2 text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Playlists</span>
            <button
              onClick={() => setShowAddPlaylist(true)}
              className="text-zinc-400 hover:text-white hover:bg-white/10 p-1 rounded-lg transition"
              aria-label="Create playlist"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Create Playlist Form */}
          <AnimatePresence>
            {showAddPlaylist && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-2 space-y-2 bg-white/5 rounded-xl border border-white/5 my-2"
              >
                <input
                  type="text"
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => setShowAddPlaylist(false)}
                    className="px-2 py-1 text-[10px] text-zinc-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePlaylist}
                    className="px-2 py-1 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Playlists List */}
          <div className="space-y-0.5 mt-2">
            {playlists.map((pl: any) => {
              const active = pathname === `/playlists/${pl.id}`;
              return (
                <Link
                  key={pl.id}
                  href={`/playlists/${pl.id}`}
                  className={cn(
                    "flex items-center justify-between px-4 py-2 text-xs rounded-lg transition-all",
                    active
                      ? "bg-purple-900/10 text-purple-300 font-medium"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  )}
                >
                  <span className="truncate max-w-[150px]">{pl.name}</span>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 font-semibold bg-zinc-950/40 px-1.5 py-0.5 rounded-full">
                    {pl.songs.length}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer / Settings Link */}
        <div className="pt-4 border-t border-white/5 space-y-1">
          <Link
            href="/settings"
            className={cn(
              "relative flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              pathname === "/settings"
                ? "text-white"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
            )}
          >
            {pathname === "/settings" && (
              <motion.div
                layoutId="active-nav"
                className="absolute inset-0 bg-purple-600/20 rounded-xl border border-purple-500/20"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Settings
              size={18}
              className={cn(
                "relative z-10 transition-colors",
                pathname === "/settings" ? "text-purple-400" : "group-hover:text-zinc-100"
              )}
            />
            <span className="relative z-10">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] glass border-t border-white/5 flex items-center justify-around px-4 z-50">
        {NAV_ITEMS.slice(0, 4).map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full text-[10px] transition-colors relative",
                active ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon size={20} className={active ? "text-purple-400" : "text-zinc-500"} />
              <span className="font-medium">{label}</span>
              {active && (
                <motion.div
                  layoutId="mobile-pip"
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-purple-500"
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
