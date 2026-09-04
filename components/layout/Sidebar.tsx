"use client";

import { usePlayerStore } from "@/store/player-store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  Radio,
  X,
  Mic,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { Playlist } from "@/types/music";

const NAV_GROUPS = [
  {
    title: "Discover",
    items: [
      { href: "/",          icon: Home,      label: "Home" },
      { href: "/search",    icon: Search,    label: "Search" },
      { href: "/explore",   icon: Compass,   label: "Browse" },
      { href: "/genres",    icon: Radio,     label: "Genres" },
    ],
  },
  {
    title: "Your Music",
    items: [
      { href: "/library",         icon: ListMusic, label: "Library" },
      { href: "/liked",           icon: Heart,     label: "Liked Songs" },
      { href: "/playlists",       icon: ListMusic, label: "Playlists" },
      { href: "/recently-played", icon: Clock,     label: "Recently Played" },
    ],
  },
  {
    title: "Session",
    items: [
      { href: "/queue",  icon: List, label: "Queue" },
      { href: "/lyrics", icon: Mic,  label: "Lyrics" },
    ],
  },
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
    <aside
      aria-label="Main Navigation"
      className="hidden md:flex flex-col h-full shrink-0 z-40 select-none overflow-hidden bg-[#09090e] border-r border-white/[0.05]"
      style={{ width: "var(--mf-sidebar-w)" }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 px-4 pt-4 pb-3 mb-1 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
            }}
          >
            <Music2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[14px] font-black tracking-tight text-white leading-none">
            MusicFlow
          </span>
        </Link>

        {/* Divider */}
        <div className="mx-4 mb-3" style={{ height: "1px", background: "var(--mf-border-soft)" }} />

        {/* Navigation Groups */}
        <nav
          aria-label="Sidebar Navigation"
          className="flex-1 overflow-y-auto scrollbar-none px-2 space-y-4 pb-2"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p
                className="px-3 text-[9px] font-black uppercase mb-1.5"
                style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
              >
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, icon: Icon, label }) => {
                  const active =
                    href === "/"
                      ? pathname === "/"
                      : pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-label={label}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 px-3 py-[7px] rounded-xl text-[12px] font-semibold transition-colors duration-150 overflow-hidden"
                      )}
                      style={{
                        background: active ? "rgba(124,58,237,0.10)" : undefined,
                        color: active ? "var(--mf-text-primary)" : "var(--mf-text-muted)",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                          (e.currentTarget as HTMLElement).style.color = "var(--mf-text-secondary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "";
                          (e.currentTarget as HTMLElement).style.color = "var(--mf-text-muted)";
                        }
                      }}
                    >
                      {active && <span className="mf-nav-active-bar" />}
                      <Icon
                        size={14}
                        className="shrink-0 transition-colors duration-150"
                        style={{ color: active ? "var(--mf-accent-light)" : undefined }}
                      />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Playlists Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <p
                className="text-[9px] font-black uppercase"
                style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
              >
                Playlists
              </p>
              <button
                onClick={() => setShowAddPlaylist(true)}
                className="rounded-md p-1 transition-all duration-150 active:scale-90"
                style={{ color: "var(--mf-text-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.color = "var(--mf-text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "";
                  (e.currentTarget as HTMLElement).style.color = "var(--mf-text-muted)";
                }}
                aria-label="Create playlist"
              >
                <Plus size={12} />
              </button>
            </div>

            <AnimatePresence>
              {showAddPlaylist && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-2"
                >
                  <div
                    className="mx-1 p-2.5 rounded-xl space-y-2"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid var(--mf-border)",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Playlist name..."
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreatePlaylist();
                          if (e.key === "Escape") setShowAddPlaylist(false);
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-[12px]"
                        style={{
                          color: "var(--mf-text-primary)",
                        }}
                        placeholder-style="color: var(--mf-text-dim)"
                        autoFocus
                      />
                      <button
                        onClick={() => setShowAddPlaylist(false)}
                        className="p-0.5 rounded hover:text-zinc-400 transition-colors"
                        style={{ color: "var(--mf-text-dim)" }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                    <button
                      onClick={handleCreatePlaylist}
                      className="w-full text-[10px] font-bold py-1 rounded-lg text-white transition-colors duration-150"
                      style={{ background: "var(--mf-accent)" }}
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-0.5 max-h-[140px] overflow-y-auto scrollbar-none">
              {mounted ? (
                playlists.length > 0 ? (
                  playlists.map((pl: Playlist) => {
                    const active = pathname === `/playlists/${pl.id}`;
                    return (
                      <Link
                        key={pl.id}
                        href={`/playlists/${pl.id}`}
                        className="flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] transition-colors duration-150"
                        style={{
                          background: active ? "rgba(124,58,237,0.10)" : undefined,
                          color: active ? "var(--mf-accent-light)" : "var(--mf-text-muted)",
                          fontWeight: active ? 700 : 500,
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
                            (e.currentTarget as HTMLElement).style.color = "var(--mf-text-secondary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = "";
                            (e.currentTarget as HTMLElement).style.color = "var(--mf-text-muted)";
                          }
                        }}
                      >
                        <span className="truncate max-w-[130px]">{pl.name}</span>
                        <span
                          className="text-[9px] font-mono shrink-0"
                          style={{ color: "var(--mf-text-dim)" }}
                        >
                          {pl.songs?.length || 0}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <p
                    className="px-3 py-2 text-[10px] italic"
                    style={{ color: "var(--mf-text-dim)" }}
                  >
                    No playlists yet
                  </p>
                )
              ) : (
                <div className="space-y-1.5 px-3 py-1">
                  {[120, 90, 105].map((w) => (
                    <div key={w} className="h-3 rounded mf-skeleton" style={{ width: w }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Footer — Profile & Settings */}
        <div
          className="px-2 py-2.5 mt-auto space-y-0.5"
          style={{ borderTop: "1px solid var(--mf-border-soft)" }}
        >
          <Link
            href="/profile"
            aria-label="Profile"
            className="relative flex items-center gap-2.5 px-3 py-[6px] rounded-xl text-[12px] font-semibold transition-colors duration-150 overflow-hidden"
            style={{
              background: pathname === "/profile" ? "rgba(124,58,237,0.10)" : undefined,
              color: pathname === "/profile" ? "var(--mf-text-primary)" : "var(--mf-text-muted)",
            }}
          >
            {pathname === "/profile" && <span className="mf-nav-active-bar" />}
            <User
              size={14}
              className="shrink-0"
              style={{ color: pathname === "/profile" ? "var(--mf-accent-light)" : undefined }}
            />
            <span>Profile</span>
          </Link>

          <Link
            href="/settings"
            aria-label="Settings"
            className="relative flex items-center gap-2.5 px-3 py-[6px] rounded-xl text-[12px] font-semibold transition-colors duration-150 overflow-hidden"
            style={{
              background: pathname === "/settings" ? "rgba(124,58,237,0.10)" : undefined,
              color: pathname === "/settings" ? "var(--mf-text-primary)" : "var(--mf-text-muted)",
            }}
          >
            {pathname === "/settings" && <span className="mf-nav-active-bar" />}
            <Settings
              size={14}
              className="shrink-0"
              style={{ color: pathname === "/settings" ? "var(--mf-accent-light)" : undefined }}
            />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

