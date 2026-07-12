"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { motion, Variants } from "framer-motion";
import { Play, Shuffle, Heart, Clock, Music, Search, ArrowUpDown, MoreHorizontal, Calendar, Trash2, Volume2, X } from "lucide-react";
import Link from "next/link";
import { Track } from "@/types/music";
import { useState } from "react";
import { useHasMounted } from "@/hooks/useHasMounted";
import { SafeImage } from "@/components/ui/SafeImage";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function LikedSongsPage() {
  const mounted = useHasMounted();
  const { likedSongs, setTrack, setQueue, toggleLike, videoId, isPlaying } = usePlayerStore(
    useShallow((s) => ({
      likedSongs: s.likedSongs,
      setTrack:   s.setTrack,
      setQueue:   s.setQueue,
      toggleLike: s.toggleLike,
      videoId:    s.videoId,
      isPlaying:  s.isPlaying,
    }))
  );

  const [localSearch, setLocalSearch] = useState("");
  const [sortBy, setSortBy] = useState<"added" | "artist" | "title" | "duration">("added");

  if (!mounted) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center">
          <div className="text-zinc-450 text-xl font-bold animate-pulse">Loading Liked Songs...</div>
        </div>
      </ProtectedRoute>
    );
  }

  const totalDuration = likedSongs.reduce((acc, song) => acc + (song.duration || 0), 0);
  const hours   = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  // Filter
  const filteredSongs = likedSongs.filter(song => {
    const s = localSearch.toLowerCase();
    return song.title.toLowerCase().includes(s) || song.artist.toLowerCase().includes(s);
  });

  // Sort
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "artist") return a.artist.localeCompare(b.artist);
    if (sortBy === "duration") return (a.duration || 0) - (b.duration || 0);
    return 0; // Default order
  });

  const playSong = (song: Track, index: number) => {
    setQueue(sortedSongs);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const playAll = () => {
    if (sortedSongs.length === 0) return;
    setQueue(sortedSongs);
    const s = sortedSongs[0];
    setTrack(s.videoId, s.title, s.artist, s.thumbnail, 0);
  };

  const playShuffle = () => {
    if (sortedSongs.length === 0) return;
    const shuffled = [...sortedSongs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    const s = shuffled[0];
    setTrack(s.videoId, s.title, s.artist, s.thumbnail, 0);
  };

  // 1. Empty State
  if (likedSongs.length === 0) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen pb-36 text-white" style={{ background: "#07070A" }}>
          {/* Ambient blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-pink-600/[0.05] blur-[150px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-[32px] bg-white/[0.015] border border-white/[0.04] flex flex-col items-center max-w-sm"
              style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6">
                <Heart size={28} fill="currentColor" />
              </div>
              <h2 className="font-display text-[22px] font-black text-white mb-2">
                Your favourites will appear here
              </h2>
              <p className="text-[12px] text-zinc-500 leading-relaxed mb-6">
                Tap the heart icon on any song across the platform to add it to your library collection.
              </p>
              <Link href="/explore">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-6 py-2.5 rounded-full font-bold text-xs bg-white text-black hover:bg-zinc-150 transition active:scale-95 cursor-pointer shadow-md"
                >
                  Explore Music
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-8" style={{ background: "#07070A" }}>

        {/* 2. Hero Header */}
        <section className="relative px-6 md:px-10 pt-10 pb-6 overflow-hidden">
          {/* Ambient background blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-pink-650/[0.07] blur-[150px] pointer-events-none" />
          <div className="absolute top-10 left-0 w-[400px] h-[300px] rounded-full bg-violet-850/[0.07] blur-[130px] pointer-events-none" />

          {/* Glass Hero Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 p-6 md:p-10 rounded-[32px] bg-white/[0.015] border border-white/[0.04] backdrop-blur-2xl"
            style={{ boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)" }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-end gap-8">
              {/* Artwork Block */}
              <div
                className="w-40 h-40 md:w-48 md:h-48 shrink-0 rounded-[24px] flex items-center justify-center relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #db2777 0%, #7c3aed 100%)",
                  boxShadow: "0 20px 50px rgba(219,39,119,0.2), 0 8px 24px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Heart size={64} fill="white" className="text-white drop-shadow-xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none" />
              </div>

              {/* Meta information */}
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">
                    PLAYLIST
                  </span>
                </div>

                <h1 className="font-display text-[44px] sm:text-[68px] font-black leading-[0.92] tracking-tighter text-white select-none">
                  Liked Songs.
                </h1>

                <div className="flex flex-wrap items-center gap-2.5 text-[12px] text-zinc-500 font-semibold">
                  <span className="text-zinc-200">Your Library</span>
                  <span className="text-zinc-700">·</span>
                  <span>{likedSongs.length} songs</span>
                  <span className="text-zinc-700">·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-zinc-650" />
                    {hours > 0 ? `${hours} hr ` : ""}{minutes} min
                  </span>
                </div>
              </div>
            </div>

            {/* Play & Shuffle Actions */}
            <div className="flex items-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={playAll}
                className="px-8 py-3 rounded-full bg-white hover:bg-zinc-150 text-black font-black text-sm flex items-center gap-2.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                style={{ boxShadow: "0 8px 24px rgba(255,255,255,0.12)" }}
              >
                <Play size={14} fill="black" className="text-black ml-0.5" /> Play All
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={playShuffle}
                className="px-6 py-3 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-white font-bold text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Shuffle size={14} /> Shuffle
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* 3. Local Filters & Sort */}
        <section className="px-6 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
            {/* Local Search input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search within liked songs..."
                className="w-full h-9 pl-10 pr-8 text-[12px] bg-transparent outline-none border border-white/[0.04] rounded-xl focus:border-purple-500/30 transition placeholder:text-zinc-650"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch("")}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={12} className="text-zinc-600" />
              <span className="text-[11px] text-zinc-550 font-bold uppercase tracking-wider">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "added" | "artist" | "title" | "duration")}
                className="bg-transparent border border-white/[0.05] rounded-xl text-[11px] font-bold text-zinc-350 px-3 py-1.5 outline-none cursor-pointer hover:border-purple-500/20"
              >
                <option value="added" className="bg-zinc-950">Recently Added</option>
                <option value="artist" className="bg-zinc-950">Artist</option>
                <option value="title" className="bg-zinc-950">Title</option>
                <option value="duration" className="bg-zinc-950">Duration</option>
              </select>
            </div>
          </div>
        </section>

        {/* 4. Songs Table */}
        <section className="px-6 md:px-10">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-zinc-300">
              <thead>
                <tr className="border-b border-white/[0.04] text-[10px] uppercase font-black tracking-wider text-zinc-600">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Artist</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">Album</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">
                    <span className="flex items-center gap-1.5"><Calendar size={11} /> Date Added</span>
                  </th>
                  <th className="py-3.5 px-4 text-right w-20"><Clock size={11} className="ml-auto" /></th>
                  <th className="py-3.5 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {sortedSongs.map((song, index) => {
                  const isCurrent = song.videoId === videoId;
                  const isCurrentPlaying = isCurrent && isPlaying;
                  return (
                    <tr
                      key={`${song.videoId}-${index}`}
                      className="group border-b border-white/[0.02] hover:bg-white/[0.015] transition duration-200 cursor-pointer"
                      onClick={() => playSong(song, index)}
                    >
                      {/* Index / Play indicator */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[12px] font-mono text-zinc-600 group-hover:hidden">
                          {isCurrentPlaying ? (
                            <Volume2 size={13} className="text-pink-500 animate-pulse mx-auto" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <Play size={11} fill="white" className="text-white mx-auto hidden group-hover:block" />
                      </td>

                      {/* Title block */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                            <SafeImage src={song.thumbnail} videoId={song.videoId} alt={song.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${isCurrent ? "text-pink-500 font-black" : "text-zinc-200"}`}>
                              {song.title}
                            </p>
                            <p className="text-[10px] text-zinc-555 truncate mt-0.5 md:hidden">
                              {song.artist}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Artist */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-zinc-350 hidden md:table-cell">
                        {song.artist}
                      </td>

                      {/* Album (Mock) */}
                      <td className="py-3.5 px-4 text-xs text-zinc-500 hidden sm:table-cell">
                        {song.title.includes("Hits") || song.title.includes("Collection") ? song.title : `${song.artist} Essentials`}
                      </td>

                      {/* Added Date (Mock) */}
                      <td className="py-3.5 px-4 text-[11px] text-zinc-600 hidden lg:table-cell">
                        Jul 6, 2026
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-right text-zinc-500 font-mono text-[11px] tabular-nums">
                        {song.duration
                          ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
                          : "3:10"}
                      </td>

                      {/* Heart (Unlike action) & Menu */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => toggleLike(song)}
                            className="text-pink-500 hover:scale-105 active:scale-95 transition"
                            aria-label="Unlike track"
                          >
                            <Heart size={13} fill="currentColor" />
                          </button>
                          <button className="text-zinc-600 hover:text-zinc-350 opacity-0 group-hover:opacity-100 transition">
                            <MoreHorizontal size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </ProtectedRoute>
  );
}