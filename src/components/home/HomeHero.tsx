"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Compass, Heart, Clock, ArrowRight, Pause, Flame, Sparkles } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";

export default function HomeHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { user } = useAuth();

  const { recentSongs, likedSongs, setTrack, setQueue, isPlaying, videoId } = usePlayerStore(
    useShallow((s) => ({
      recentSongs: s.recentSongs,
      likedSongs: s.likedSongs,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
      isPlaying: s.isPlaying,
      videoId: s.videoId,
    }))
  );

  const playNow = () => {
    if (!recentSongs.length) return;
    setQueue(recentSongs);
    const song = recentSongs[0];
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, 0);
  };

  const continueSong = recentSongs.length > 0 ? recentSongs[0] : null;
  const isPlayingContinue = continueSong?.videoId === videoId && isPlaying;

  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "Good Night"
      : hour < 12
      ? "Good Morning"
      : hour < 17
      ? "Good Afternoon"
      : hour < 21
      ? "Good Evening"
      : "Good Night";

  const QUICK_SEARCHES = ["Arijit Singh", "AP Dhillon", "KK", "Lofi Beats"];

  return (
    <section className="relative px-4 md:px-10 pt-6 md:pt-10 pb-6 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-[-10%] w-[600px] h-[400px] rounded-full bg-purple-950/[0.08] blur-[140px] pointer-events-none" />
      <div className="absolute top-20 right-0 w-[450px] h-[320px] rounded-full bg-pink-950/[0.06] blur-[120px] pointer-events-none" />

      {/* ── MOBILE VIEW ── */}
      <div className="block md:hidden space-y-5 relative z-10 select-none">
        {/* Top greeting bar */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550">{greeting}</span>
            <h1 className="font-display text-2xl font-black text-white mt-0.5">Your Space</h1>
          </div>
          {user && (
            <Link href="/profile" className="w-8.5 h-8.5 rounded-full overflow-hidden border border-white/[0.08] shadow-md active:scale-95 transition shrink-0">
              <SafeImage
                src={user.photoURL || `https://ui-avatars.com/api/?background=7c3aed&color=fff&name=${encodeURIComponent(user.displayName || "User")}`}
                alt="Profile"
                className="w-full h-full object-cover"
                fallbackType="artist"
              />
            </Link>
          )}
        </div>

        {/* Floating Search Pill */}
        <div className="relative" onClick={() => router.push("/search")}>
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-650" />
          <div className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center text-xs font-semibold text-zinc-500 shadow-sm">
            Search songs, artists, albums...
          </div>
        </div>

        {/* 2x3 Quick Access Continue Listening Grid */}
        {recentSongs.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-xs font-black uppercase tracking-wider text-zinc-400">Recently Played</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {recentSongs.slice(0, 6).map((song, idx) => (
                <div
                  key={`quick-${song.videoId}-${idx}`}
                  onClick={() => {
                    setQueue(recentSongs);
                    setTrack(song.videoId, song.title, song.artist, song.thumbnail, idx);
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.015] border border-white/[0.04] active:bg-white/[0.04] transition duration-150 cursor-pointer min-w-0"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                    <SafeImage src={song.thumbnail} videoId={song.videoId} alt={song.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[10px] font-bold text-zinc-200 truncate leading-snug">{song.title}</p>
                    <p className="text-[8px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP VIEW ── */}
      <div className="hidden md:block">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 p-6 md:p-10 rounded-[32px] bg-white/[0.015] border border-white/[0.04] backdrop-blur-2xl"
          style={{ boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)" }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            
            {/* Left Column: Greeting, Headline & Search */}
            <div className="space-y-6 max-w-xl text-left flex-1">
              {/* Greeting badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
                <Sparkles size={11} className="text-purple-450" />
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">
                  {greeting}
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-[44px] sm:text-[64px] font-black leading-[0.92] tracking-tighter text-white select-none">
                Your Sound.
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  Elevated.
                </span>
              </h1>

              {/* Search Input styled like Search Page */}
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-650 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) {
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                    }
                  }}
                  placeholder="Search songs, artists, albums..."
                  className="w-full h-11 pl-10 pr-24 rounded-xl bg-white/[0.02] border border-white/[0.05] outline-none text-xs font-semibold text-white placeholder:text-zinc-650 focus:border-purple-550 transition-colors"
                />
                <button
                  onClick={() => query.trim() && router.push(`/search?q=${encodeURIComponent(query)}`)}
                  className="absolute right-1.5 top-1.5 h-8 px-4 rounded-lg bg-white hover:bg-zinc-150 text-black font-black text-[11px] shadow-sm active:scale-95 transition-all duration-150"
                >
                  Search
                </button>
              </div>

              {/* Genre chips matching Explore */}
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                    className="px-4 py-1.5 rounded-full bg-white/[0.02] hover:bg-white/[0.06] text-[11px] font-bold text-zinc-450 hover:text-zinc-200 border border-white/[0.04] transition-all cursor-pointer select-none"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Continue Listening & Quick Stats */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4 shrink-0 lg:w-[400px]">
              {continueSong ? (
                <motion.div
                  whileHover={{ y: -4 }}
                  onClick={playNow}
                  className="flex-1 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-36 cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                      <SafeImage src={continueSong.thumbnail} videoId={continueSong.videoId} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="text-[8px] font-black uppercase tracking-[0.18em] text-purple-400">Continue</span>
                      <h3 className="text-xs font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{continueSong.title}</h3>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{continueSong.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 relative z-10">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Quick Resume</span>
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black shadow-md group-hover:scale-105 transition-transform shrink-0">
                      {isPlayingContinue ? <Pause size={10} fill="black" /> : <Play size={10} fill="black" className="ml-0.5" />}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex flex-col justify-center items-center text-center h-36">
                  <Compass className="w-6 h-6 text-zinc-700 mb-2" />
                  <span className="text-[11px] text-zinc-500 font-semibold">Play music to build library</span>
                </div>
              )}

              <div className="flex flex-row sm:flex-col gap-3 shrink-0 w-full sm:w-36">
                {/* Stat: Liked */}
                <div className="flex-1 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
                    <Heart size={13} fill="currentColor" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] text-zinc-555 font-bold uppercase tracking-wider block">Liked</span>
                    <span className="text-sm font-black text-white font-mono leading-none">{likedSongs.length}</span>
                  </div>
                </div>

                {/* Stat: Streak */}
                <div className="flex-1 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                    <Flame size={13} />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] text-zinc-555 font-bold uppercase tracking-wider block">Streak</span>
                    <span className="text-sm font-black text-white font-mono leading-none">14d</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
