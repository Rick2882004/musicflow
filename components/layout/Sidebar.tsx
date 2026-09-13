"use client";

import { usePlayerStore } from "@/store/player-store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  Compass,
  Search,
  Radio,
  X,
  User,
  PanelLeftClose,
  PanelLeftOpen,
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
    title: "Your Collection",
    items: [
      { href: "/library",         icon: ListMusic, label: "Library" },
      { href: "/liked",           icon: Heart,     label: "Liked Songs" },
      { href: "/playlists",       icon: ListMusic, label: "Playlists" },
      { href: "/recently-played", icon: Clock,     label: "Recently Played" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const mounted = useHasMounted();
  const { playlists, addPlaylist, title } = usePlayerStore(
    useShallow((s) => ({
      playlists: s.playlists,
      addPlaylist: s.addPlaylist,
      title: s.title,
    }))
  );

  const hasActiveTrack = mounted && Boolean(title);

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("musicflow-sidebar-collapsed");
      if (saved === "true") {
        setTimeout(() => {
          setIsCollapsed(true);
        }, 0);
      }
    } catch {
      // Fallback
    }
  }, []);

  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const toggleCollapse = () => {
    console.log("[Sidebar] toggleCollapse called! current:", isCollapsed);
    setIsCollapsed((prev) => {
      const next = !prev;
      console.log("[Sidebar] setIsCollapsed updater called! next:", next);
      try {
        localStorage.setItem("musicflow-sidebar-collapsed", String(next));
      } catch {
        // Fallback
      }
      return next;
    });
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await addPlaylist(newPlaylistName.trim());
    setNewPlaylistName("");
    setShowAddPlaylist(false);
  };

  return (
    <aside
      aria-label="Main Navigation"
      className={cn(
        "hidden md:flex flex-col h-full shrink-0 z-40 select-none overflow-hidden",
        "bg-[#09090d]/95 backdrop-blur-2xl border-r border-white/[0.06] shadow-[1px_0_24px_rgba(0,0,0,0.5)]",
        "transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      )}
      style={{ width: isCollapsed ? "68px" : "240px" }}
    >
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        {/* ── Brand & Collapse Header ── */}
        <div className="h-16 shrink-0 flex items-center justify-between px-3.5 border-b border-white/[0.04]">
          {!isCollapsed ? (
            <>
              <Link
                href="/"
                aria-label="MusicFlow Home"
                title="MusicFlow"
                className="flex items-center gap-2.5 rounded-xl py-1.5 transition-opacity hover:opacity-90 group"
              >
                {/* Ambient Logo Emblem */}
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(124,58,237,0.35)] border border-purple-400/30 transition-transform duration-200 group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                  }}
                >
                  <Music2 className="w-4 h-4 text-white" />
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[15px] font-extrabold tracking-tight text-white leading-none">
                    MusicFlow
                  </span>
                  <span className="text-[9px] font-semibold text-purple-400/80 tracking-wider uppercase mt-0.5">
                    Studio
                  </span>
                </div>
              </Link>

              <button
                id="btn-collapse-sidebar"
                type="button"
                onClick={toggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] transition-colors focus-visible:ring-1 focus-visible:ring-purple-400/50 cursor-pointer"
              >
                <PanelLeftClose size={17} />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                id="btn-expand-sidebar"
                type="button"
                onClick={toggleCollapse}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:ring-1 focus-visible:ring-purple-400/50 cursor-pointer"
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── Scrollable Navigation Body ── */}
        <nav
          aria-label="Sidebar Navigation"
          className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2.5 py-3 space-y-5"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed ? (
                <p
                  className="px-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1"
                >
                  {group.title}
                </p>
              ) : (
                <div className="mx-auto w-4 h-[1px] bg-white/[0.06] my-2" />
              )}

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
                      title={isCollapsed ? label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl transition-all duration-150 overflow-hidden outline-none",
                        "focus-visible:ring-1 focus-visible:ring-purple-400/50",
                        isCollapsed
                          ? "justify-center w-10 h-10 mx-auto"
                          : "px-3 py-2 text-[12px] font-medium"
                      )}
                      style={{
                        background: active ? "rgba(168, 85, 247, 0.08)" : undefined,
                        color: active ? "#ffffff" : "var(--mf-text-muted)",
                        boxShadow: active
                          ? "inset 0 1px 0 rgba(255, 255, 255, 0.06)"
                          : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255, 255, 255, 0.04)";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--mf-text-secondary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--mf-text-muted)";
                        }
                      }}
                    >
                      {/* Active Indicator Bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                      )}

                      <Icon
                        size={16}
                        className={cn(
                          "shrink-0 transition-all duration-150",
                          active
                            ? "text-purple-400"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        )}
                      />

                      {!isCollapsed && (
                        <span
                          className={cn(
                            "truncate leading-none",
                            active ? "font-semibold text-white" : "font-medium"
                          )}
                        >
                          {label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── User Playlists Section ── */}
          <div className="space-y-1">
            {!isCollapsed ? (
              <div className="flex items-center justify-between px-2.5 mb-1">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Playlists
                </p>
                <button
                  onClick={() => setShowAddPlaylist(true)}
                  className="rounded-md p-1 text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all duration-150 active:scale-90"
                  aria-label="Create playlist"
                  title="Create playlist"
                >
                  <Plus size={13} />
                </button>
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <button
                  onClick={() => {
                    setIsCollapsed(false);
                    setShowAddPlaylist(true);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
                  title="Create Playlist"
                  aria-label="Create Playlist"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            <AnimatePresence>
              {showAddPlaylist && !isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-2 px-1"
                >
                  <div className="p-2.5 rounded-xl space-y-2 bg-white/[0.03] border border-white/[0.08] shadow-inner">
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
                        className="flex-1 bg-transparent border-none outline-none text-[12px] text-white placeholder:text-zinc-600"
                        autoFocus
                      />
                      <button
                        onClick={() => setShowAddPlaylist(false)}
                        className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <button
                      onClick={handleCreatePlaylist}
                      className="w-full text-[10px] font-bold py-1.5 rounded-lg text-white bg-purple-600 hover:bg-purple-500 transition-colors duration-150 shadow-sm"
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Playlist Items List */}
            <div className="space-y-0.5">
              {mounted ? (
                playlists.length > 0 ? (
                  playlists.map((pl: Playlist) => {
                    const active = pathname === `/playlists/${pl.id}`;
                    return (
                      <Link
                        key={pl.id}
                        href={`/playlists/${pl.id}`}
                        title={pl.name}
                        className={cn(
                          "group flex items-center rounded-xl text-[11px] transition-all duration-150 outline-none",
                          "focus-visible:ring-1 focus-visible:ring-purple-400/50",
                          isCollapsed
                            ? "justify-center w-9 h-9 mx-auto"
                            : "justify-between px-3 py-1.5"
                        )}
                        style={{
                          background: active ? "rgba(168, 85, 247, 0.08)" : undefined,
                          color: active ? "var(--mf-accent-light)" : "var(--mf-text-muted)",
                          fontWeight: active ? 700 : 500,
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background =
                              "rgba(255, 255, 255, 0.03)";
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--mf-text-secondary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = "";
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--mf-text-muted)";
                          }
                        }}
                      >
                        {isCollapsed ? (
                          <ListMusic size={14} className={active ? "text-purple-400" : "text-zinc-500"} />
                        ) : (
                          <>
                            <span className="truncate max-w-[140px]">{pl.name}</span>
                            <span className="text-[9px] font-mono text-zinc-600 shrink-0">
                              {pl.songs?.length || 0}
                            </span>
                          </>
                        )}
                      </Link>
                    );
                  })
                ) : (
                  !isCollapsed && (
                    <p className="px-3 py-2 text-[10px] italic text-zinc-600">
                      No playlists yet
                    </p>
                  )
                )
              ) : (
                !isCollapsed && (
                  <div className="space-y-1.5 px-3 py-1">
                    {[120, 90, 105].map((w) => (
                      <div
                        key={w}
                        className="h-3 rounded mf-skeleton"
                        style={{ width: w }}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </nav>

        {/* ── Fixed/Sticky Sidebar Footer — Profile & Settings ── */}
        <div className="shrink-0 p-2 border-t border-white/[0.06] space-y-0.5 bg-[#07070a]/90 backdrop-blur-md">
          <Link
            href="/profile"
            aria-label="Profile"
            title={isCollapsed ? "Profile" : undefined}
            className={cn(
              "group relative flex items-center rounded-xl text-[12px] font-medium transition-all duration-150 overflow-hidden outline-none",
              "focus-visible:ring-1 focus-visible:ring-purple-400/50",
              isCollapsed
                ? "justify-center w-10 h-10 mx-auto"
                : "gap-3 px-3 py-2",
              pathname === "/profile"
                ? "bg-purple-500/[0.08] text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
            style={{
              boxShadow: pathname === "/profile" ? "inset 0 1px 0 rgba(255, 255, 255, 0.06)" : undefined,
            }}
          >
            {pathname === "/profile" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            )}
            <User
              size={16}
              className={cn(
                "shrink-0 transition-colors",
                pathname === "/profile"
                  ? "text-purple-400"
                  : "text-zinc-400 group-hover:text-zinc-200"
              )}
            />
            {!isCollapsed && <span className="truncate">Profile</span>}
          </Link>

          <Link
            href="/settings"
            aria-label="Settings"
            title={isCollapsed ? "Settings" : undefined}
            className={cn(
              "group relative flex items-center rounded-xl text-[12px] font-medium transition-all duration-150 overflow-hidden outline-none",
              "focus-visible:ring-1 focus-visible:ring-purple-400/50",
              isCollapsed
                ? "justify-center w-10 h-10 mx-auto"
                : "gap-3 px-3 py-2",
              pathname === "/settings"
                ? "bg-purple-500/[0.08] text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
            style={{
              boxShadow: pathname === "/settings" ? "inset 0 1px 0 rgba(255, 255, 255, 0.06)" : undefined,
            }}
          >
            {pathname === "/settings" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            )}
            <Settings
              size={16}
              className={cn(
                "shrink-0 transition-colors",
                pathname === "/settings"
                  ? "text-purple-400"
                  : "text-zinc-400 group-hover:text-zinc-200"
              )}
            />
            {!isCollapsed && <span className="truncate">Settings</span>}
          </Link>
        </div>

        {/* ── Bottom Player Clearance Spacer (Reserves exactly 72px when player is active) ── */}
        <div
          className={cn(
            "shrink-0 pointer-events-none transition-[height] duration-200 ease-out",
            hasActiveTrack ? "h-[72px]" : "h-0"
          )}
          aria-hidden="true"
        />
      </div>
    </aside>
  );
}
