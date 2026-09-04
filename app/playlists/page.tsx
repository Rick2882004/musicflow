"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ListMusic, Plus, Search, Play, Music, MoreHorizontal, X } from "lucide-react";
import { Playlist } from "@/types/music";
import { useHasMounted } from "@/hooks/useHasMounted";
import { SafeImage } from "@/components/ui/SafeImage";

const QUICK_COLLECTIONS = [
  { name: "Workout", emoji: "⚡", bg: "from-orange-500/10 to-transparent", hoverBorder: "group-hover:border-orange-500/30" },
  { name: "Study", emoji: "📚", bg: "from-blue-500/10 to-transparent", hoverBorder: "group-hover:border-blue-500/30" },
  { name: "Coding", emoji: "💻", bg: "from-indigo-500/10 to-transparent", hoverBorder: "group-hover:border-indigo-500/30" },
  { name: "Night Drive", emoji: "🌙", bg: "from-cyan-500/10 to-transparent", hoverBorder: "group-hover:border-cyan-500/30" },
  { name: "Romantic", emoji: "💖", bg: "from-pink-500/10 to-transparent", hoverBorder: "group-hover:border-pink-500/30" },
  { name: "Party", emoji: "🎉", bg: "from-purple-500/10 to-transparent", hoverBorder: "group-hover:border-purple-500/30" },
  { name: "Focus", emoji: "🎯", bg: "from-teal-500/10 to-transparent", hoverBorder: "group-hover:border-teal-500/30" },
  { name: "Travel", emoji: "✈️", bg: "from-emerald-500/10 to-transparent", hoverBorder: "group-hover:border-emerald-500/30" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function PlaylistsPage() {
  const router = useRouter();
  const mounted = useHasMounted();
  const [name,       setName]       = useState("");
  const [search,     setSearch]     = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "created" | "shared" | "recent">("all");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isFocused, setIsFocused] = useState(false);

  const { playlists, addPlaylist } = usePlayerStore(
    useShallow((s) => ({
      playlists:   s.playlists,
      addPlaylist: s.addPlaylist,
    }))
  );

  if (!mounted) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center">
          <div className="text-zinc-450 text-xl font-bold animate-pulse">Loading Playlists...</div>
        </div>
      </ProtectedRoute>
    );
  }

  const totalSongs = playlists.reduce((total, p) => total + (p?.songs?.length || 0), 0);
  const totalHours = Math.round(totalSongs * 3.5 / 60);

  const filteredPlaylists = playlists.filter((p: Playlist) =>
    (p?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const triggerCreate = () => {
    if (!name.trim()) return;
    addPlaylist(name);
    setName("");
    setIsCreating(false);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-6" style={{ background: "#07070A" }}>

        {/* 1. Hero Section */}
        <section className="relative px-4 md:px-8 pt-4 pb-2 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white select-none">
                Your Playlists
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {playlists.length} playlists · {totalSongs} tracks{totalHours > 0 ? ` · ${totalHours}h` : ""}
              </p>
            </div>

            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md self-start sm:self-auto"
            >
              <Plus size={14} /> Create Playlist
            </button>
          </div>
        </section>

        {/* Create playlist collapse */}
        <AnimatePresence>
          {isCreating && (
            <section className="px-4 md:px-10">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex flex-col sm:flex-row gap-4 items-end max-w-lg"
              >
                <div className="flex-1 w-full text-left">
                  <label className="text-[9px] font-black uppercase tracking-[0.16em] text-purple-400 mb-2 block">
                    Playlist Title
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && triggerCreate()}
                    placeholder="My Awesome Mix..."
                    className="w-full h-11 rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 text-xs text-white placeholder:text-zinc-650 outline-none focus:border-purple-500/20 transition-all"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="h-11 px-4 rounded-xl font-bold text-xs bg-white/[0.02] hover:bg-white/[0.05] text-zinc-450 hover:text-zinc-200 transition cursor-pointer border border-white/[0.05]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={triggerCreate}
                    disabled={!name.trim()}
                    className={`h-11 px-5 rounded-xl font-black text-xs transition cursor-pointer ${
                      name.trim() ? "bg-white text-black hover:bg-zinc-150" : "bg-white/10 text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            </section>
          )}
        </AnimatePresence>

        {/* 2. Search & Filter Bar */}
        <section className="px-4 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
            
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search playlists..."
                className="w-full h-9 pl-10 pr-8 text-[12px] bg-transparent outline-none border border-white/[0.04] rounded-xl focus:border-purple-500/30 transition placeholder:text-zinc-650 font-medium"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "created", "shared", "recent"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border select-none"
                  style={{
                    background: activeFilter === filter ? "#FFFFFF" : "rgba(255,255,255,0.02)",
                    color: activeFilter === filter ? "#000000" : "#a1a1aa",
                    border: `1px solid ${activeFilter === filter ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  {filter === "all" ? "All" : filter === "created" ? "Created by Me" : filter === "shared" ? "Shared" : "Recently Updated"}
                </button>
              ))}
            </div>

          </div>
        </section>

        {/* 3. Playlist Grid */}
        <section className="px-4 md:px-10 space-y-6">
          {playlists.length === 0 ? (
            <div
              className="p-16 rounded-[32px] text-center flex flex-col items-center border border-white/[0.04]"
              style={{ background: "rgba(255,255,255,0.01)" }}
            >
              <ListMusic size={36} className="text-zinc-700 mb-4 animate-pulse" />
              <p className="text-[14px] text-zinc-350 font-bold">No playlists found</p>
              <p className="text-[12px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                Create custom song collections using the button in the top right.
              </p>
            </div>
          ) : filteredPlaylists.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[14px] text-zinc-650">{"No playlists found matching \""}{search}{"\""}</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
            >
              {filteredPlaylists.map((playlist: Playlist) => {
                const songs = playlist?.songs || [];
                return (
                  <motion.div key={playlist.id} variants={itemVariants} whileHover={{ y: -6 }}>
                    <Link href={`/playlists/${playlist.id}`}>
                      <div className="group flex flex-col gap-3 cursor-pointer focus:outline-none text-left">
                        <div
                          className="relative aspect-square rounded-[22px] overflow-hidden bg-zinc-900 border border-white/[0.05] shadow-[0_8px_24px_rgba(0,0,0,0.6)] group-hover:border-purple-500/25 transition-all duration-300"
                        >
                          {songs[0] ? (
                            <SafeImage
                              src={songs[0].thumbnail}
                              videoId={songs[0].videoId}
                              alt={playlist.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              fallbackType="song"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                              <Music size={36} className="text-zinc-755" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-lg translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                              <Play size={15} fill="black" className="text-black ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div className="px-0.5 flex items-start justify-between min-w-0">
                          <div className="min-w-0">
                            <h3 className="font-display text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate tracking-tight">
                              {playlist.name}
                            </h3>
                            <p className="text-[10px] text-zinc-555 mt-0.5 font-medium">
                              {songs.length} {songs.length === 1 ? "track" : "tracks"}
                            </p>
                          </div>
                          <button className="text-zinc-650 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-0.5 shrink-0">
                            <MoreHorizontal size={13} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        {/* 4. Quick Collections */}
        <section className="px-4 md:px-10 space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              Suggestions
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Quick Collections
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3.5">
            {QUICK_COLLECTIONS.map((c) => (
              <motion.div
                key={c.name}
                whileHover={{ y: -4 }}
                onClick={() => setSearch(c.name)}
                className="group relative h-20 rounded-2xl cursor-pointer p-4 overflow-hidden border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.035] hover:border-purple-500/20 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-zinc-600 group-hover:text-zinc-400 tracking-wider">VIBE</span>
                  <span className="text-sm">{c.emoji}</span>
                </div>
                <span className="font-display text-[12px] font-bold text-zinc-350 group-hover:text-white transition-colors text-left">{c.name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. Recently Updated (Horizontal Carousel) */}
        {playlists.length > 0 && (
          <section className="px-4 md:px-10 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
                  Recent Active
                </p>
                <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                  Recently Updated
                </h2>
              </div>
            </div>
            <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
              {playlists.slice(0, 5).map((playlist) => (
                <motion.div
                  key={`updated-${playlist.id}`}
                  whileHover={{ y: -6 }}
                  onClick={() => router.push(`/playlists/${playlist.id}`)}
                  className="group shrink-0 w-[140px] md:w-[155px] p-3 rounded-[20px] bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-purple-500/25 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-square rounded-[14px] overflow-hidden bg-zinc-950 border border-white/5 shadow-sm mb-3">
                    {playlist.songs[0] ? (
                      <SafeImage src={playlist.songs[0].thumbnail} videoId={playlist.songs[0].videoId} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="song" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                        <Music size={28} className="text-zinc-800" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-zinc-300 truncate leading-tight group-hover:text-white transition-colors text-left">{playlist.name}</p>
                  <p className="text-[9px] text-zinc-555 truncate mt-0.5 text-left">{playlist.songs.length} Songs</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Mobile Floating Action Button (FAB) to create playlist */}
        <button
          onClick={() => {
            setIsCreating(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="md:hidden fixed bottom-24 right-5 z-45 w-12 h-12 rounded-full bg-purple-600 border border-purple-500 shadow-[0_8px_24px_rgba(147,51,234,0.4)] flex items-center justify-center text-white active:scale-90 transition-transform duration-150 cursor-pointer"
          aria-label="Create new playlist"
        >
          <Plus size={20} />
        </button>

      </main>
    </ProtectedRoute>
  );
}