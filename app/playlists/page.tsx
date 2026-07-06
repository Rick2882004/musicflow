"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ListMusic, Plus, Search, Play, Music, Sparkles, Heart, MoreHorizontal, Compass, Clock, Check, X } from "lucide-react";
import { Playlist } from "@/types/music";

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
  const [name,       setName]       = useState("");
  const [search,     setSearch]     = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "created" | "shared" | "recent">("all");
  const [isFocused, setIsFocused] = useState(false);

  const { playlists, addPlaylist } = usePlayerStore(
    useShallow((s) => ({
      playlists:   s.playlists,
      addPlaylist: s.addPlaylist,
    }))
  );

  const totalSongs = playlists.reduce((total, p) => total + p.songs.length, 0);
  const totalHours = Math.round(totalSongs * 3.5 / 60);

  const filteredPlaylists = playlists.filter((p: Playlist) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const triggerCreate = () => {
    if (!name.trim()) return;
    addPlaylist(name);
    setName("");
    setIsCreating(false);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-16" style={{ background: "#07070A" }}>

        {/* 1. Hero Section */}
        <section className="relative px-6 md:px-10 pt-10 pb-6 overflow-hidden">
          {/* Ambient Background Orbs */}
          <div className="absolute top-0 left-[-10%] w-[600px] h-[400px] rounded-full bg-purple-950/[0.08] blur-[140px] pointer-events-none" />
          <div className="absolute top-20 right-0 w-[450px] h-[320px] rounded-full bg-fuchsia-950/[0.06] blur-[120px] pointer-events-none" />

          {/* Glass Hero Container */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 p-6 md:p-10 rounded-[32px] bg-white/[0.015] border border-white/[0.04] backdrop-blur-2xl"
            style={{ boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)" }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Playlist Cover Art Block */}
                <div
                  className="w-32 h-32 md:w-36 md:h-36 shrink-0 rounded-[24px] flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)",
                    boxShadow: "0 20px 50px rgba(124,58,237,0.2), 0 8px 24px rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <ListMusic size={52} className="text-white drop-shadow-xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none" />
                </div>

                <div className="space-y-4 text-left">
                  {/* Small Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
                    <Sparkles size={11} className="text-purple-450" />
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">
                      COLLECTIONS
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="font-display text-[44px] sm:text-[68px] font-black leading-[0.92] tracking-tighter text-white select-none">
                    Your Playlists.
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-sm">
                    Build collections for every mood.
                  </p>
                </div>
              </div>

              {/* Statistics Grid & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 shrink-0">
                <div className="flex items-center gap-6 text-zinc-500 font-semibold text-xs border-r border-white/5 pr-6 hidden sm:flex">
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Playlists</p>
                    <p className="text-xl font-black text-zinc-200 mt-1">{playlists.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Songs</p>
                    <p className="text-xl font-black text-zinc-200 mt-1">{totalSongs}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Hours</p>
                    <p className="text-xl font-black text-zinc-200 mt-1">{totalHours}</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIsCreating(!isCreating)}
                  className="px-6 py-3 rounded-full bg-white hover:bg-zinc-150 text-black font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                  style={{ boxShadow: "0 8px 24px rgba(255,255,255,0.12)" }}
                >
                  <Plus size={15} /> Create Playlist
                </motion.button>
              </div>

            </div>
          </motion.div>
        </section>

        {/* Create playlist collapse */}
        <AnimatePresence>
          {isCreating && (
            <section className="px-6 md:px-10">
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
        <section className="px-6 md:px-10">
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
        <section className="px-6 md:px-10 space-y-6">
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
              <p className="text-[14px] text-zinc-650">No playlists found matching &quot;{search}&quot;</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
            >
              {filteredPlaylists.map((playlist: Playlist) => {
                const updatedMock = playlist.songs.length > 0 ? "Updated 2 days ago" : "Created recently";
                return (
                  <motion.div key={playlist.id} variants={itemVariants} whileHover={{ y: -6 }}>
                    <Link href={`/playlists/${playlist.id}`}>
                      <div className="group flex flex-col gap-3 cursor-pointer focus:outline-none text-left">
                        <div
                          className="relative aspect-square rounded-[22px] overflow-hidden bg-zinc-900 border border-white/[0.05] shadow-[0_8px_24px_rgba(0,0,0,0.6)] group-hover:border-purple-500/25 transition-all duration-300"
                        >
                          {playlist.songs[0] ? (
                            <img
                              src={playlist.songs[0].thumbnail}
                              alt={playlist.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                              <Music size={36} className="text-zinc-750" />
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
                              {playlist.songs.length} Tracks · {updatedMock}
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
        <section className="px-6 md:px-10 space-y-6">
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
          <section className="px-6 md:px-10 space-y-6">
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
            <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
              {playlists.slice(0, 5).map((playlist) => (
                <motion.div
                  key={`updated-${playlist.id}`}
                  whileHover={{ y: -6 }}
                  onClick={() => router.push(`/playlists/${playlist.id}`)}
                  className="group shrink-0 w-[140px] md:w-[155px] p-3 rounded-[20px] bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-purple-500/25 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-square rounded-[14px] overflow-hidden bg-zinc-950 border border-white/5 shadow-sm mb-3">
                    {playlist.songs[0] ? (
                      <img src={playlist.songs[0].thumbnail} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

      </main>
    </ProtectedRoute>
  );
}