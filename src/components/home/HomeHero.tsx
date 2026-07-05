"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Search, Play, Compass, Heart, Clock } from "lucide-react";

export default function HomeHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { recentSongs, likedSongs, setTrack, setQueue } = usePlayerStore(useShallow((s) => ({
    recentSongs: s.recentSongs,
    likedSongs: s.likedSongs,
    setTrack: s.setTrack,
    setQueue: s.setQueue,
  })));

  const playNow = () => {
    if (!recentSongs.length) return;
    setQueue(recentSongs);
    const song = recentSongs[0];
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, 0);
  };

  const continueSong = recentSongs.length > 0 ? recentSongs[0] : null;

  const greeting =
    new Date().getHours() < 12
      ? "☀️ Good Morning"
      : new Date().getHours() < 18
      ? "🌤 Good Afternoon"
      : "🌙 Good Evening";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[32px] p-8 md:p-10 border border-white/5 bg-zinc-950/40 backdrop-blur-3xl shadow-2xl"
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-32 -left-32 w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        {/* Left Info Area */}
        <div className="lg:col-span-3 space-y-6">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-bold">
            {greeting}
          </p>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
            Discover Your{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-pink-500 bg-clip-text text-transparent">
              MusicFlow
            </span>
          </h1>

          <p className="text-zinc-400 text-sm md:text-base max-w-md">
            Stream your favorite tracks, search catalog suggestions, and build collaborative playlists.
          </p>

          {/* Quick Search Box */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                }
              }}
              placeholder="Search songs, artists, playlists..."
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 pl-11 pr-24 outline-none text-sm focus:border-purple-500 text-white placeholder:text-zinc-500 transition-all"
            />
            <Search className="absolute left-4 top-3.5 text-zinc-500 w-4 h-4" />
            <button
              onClick={() => {
                if (query.trim()) {
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                }
              }}
              className="absolute right-2 top-2 h-8 px-4 rounded-lg bg-white text-black font-semibold text-xs hover:scale-105 transition"
            >
              Search
            </button>
          </div>

          {/* Artist Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {["Arijit Singh", "KK", "Sonu Nigam", "Shreya Ghoshal", "Atif Aslam"].map((artist) => (
              <button
                key={artist}
                onClick={() => router.push(`/search?q=${encodeURIComponent(artist)}`)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-300 text-xs font-medium transition"
              >
                {artist}
              </button>
            ))}
          </div>
        </div>

        {/* Right Continue / Stats Card */}
        <div className="lg:col-span-2 space-y-4">
          {continueSong ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={playNow}
              className="glass p-5 rounded-2xl border border-white/10 cursor-pointer flex items-center gap-4 bg-zinc-950/60 transition-all group"
            >
              <img
                src={continueSong.thumbnail}
                alt={continueSong.title}
                className="w-16 h-16 rounded-xl object-cover shadow-lg border border-white/5"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">
                  Continue Listening
                </span>
                <h3 className="font-bold text-zinc-100 truncate mt-0.5 group-hover:text-purple-300 transition-colors">
                  {continueSong.title}
                </h3>
                <p className="text-xs text-zinc-400 truncate">{continueSong.artist}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-600 group-hover:bg-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/30">
                <Play size={16} fill="white" className="text-white ml-0.5" />
              </div>
            </motion.div>
          ) : (
            <div className="glass p-5 rounded-2xl border border-white/5 text-center bg-zinc-950/40 py-8">
              <Compass className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">Play some tracks to build your continue list!</p>
            </div>
          )}

          {/* Quick Statistics Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4 rounded-xl border border-white/5 bg-zinc-950/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Heart size={14} className="text-pink-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Liked Songs</span>
                <span className="text-lg font-bold">{likedSongs.length}</span>
              </div>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5 bg-zinc-950/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Clock size={14} className="text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Recently Played</span>
                <span className="text-lg font-bold">{recentSongs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
