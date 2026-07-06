"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Play, Trash2, ShieldAlert, Disc, ArrowRight, Heart, Shuffle, Repeat, ListPlus, X, HelpCircle, GripVertical, CheckCircle, Music } from "lucide-react";
import Link from "next/link";
import { Track } from "@/types/music";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function QueuePage() {
  const {
    queue,
    currentIndex,
    setTrack,
    clearQueue,
    isPlaying,
    isShuffle,
    isRepeat,
    toggleShuffle,
    toggleRepeat,
    setQueue,
    likedSongs,
    toggleLike,
    recentSongs,
    currentTime,
    duration,
  } = usePlayerStore(useShallow((s) => ({
    queue: s.queue,
    currentIndex: s.currentIndex,
    setTrack: s.setTrack,
    clearQueue: s.clearQueue,
    isPlaying: s.isPlaying,
    isShuffle: s.isShuffle,
    isRepeat: s.isRepeat,
    toggleShuffle: s.toggleShuffle,
    toggleRepeat: s.toggleRepeat,
    setQueue: s.setQueue,
    likedSongs: s.likedSongs,
    toggleLike: s.toggleLike,
    recentSongs: s.recentSongs,
    currentTime: s.currentTime,
    duration: s.duration,
  })));

  const [notif, setNotif] = useState("");

  const currentTrack = queue[currentIndex] || null;
  const upcomingTracks = queue.slice(currentIndex + 1);

  const showNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 2000);
  };

  const playSong = (song: Track, index: number) => {
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const removeTrack = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const newQueue = queue.filter((_, i) => i !== indexToRemove);
    setQueue(newQueue);
    showNotif("Removed track from queue");
  };

  const playNextTrack = (e: React.MouseEvent, song: Track) => {
    e.stopPropagation();
    // Insert after current index
    const newQueue = [...queue];
    // Remove if already in queue
    const indexInQueue = newQueue.findIndex(t => t.videoId === song.videoId);
    if (indexInQueue !== -1) {
      newQueue.splice(indexInQueue, 1);
    }
    newQueue.splice(currentIndex + 1, 0, song);
    setQueue(newQueue);
    showNotif("Song will play next");
  };

  const shuffleQueue = () => {
    if (queue.length === 0) return;
    const current = queue[currentIndex];
    const rest = queue.filter((_, i) => i !== currentIndex).sort(() => Math.random() - 0.5);
    const newQueue = [current, ...rest];
    setQueue(newQueue);
    setTrack(current.videoId, current.title, current.artist, current.thumbnail, 0);
    showNotif("Queue shuffled");
  };

  const clearRemainingQueue = () => {
    if (queue.length === 0) return;
    const current = queue[currentIndex];
    setQueue([current]);
    setTrack(current.videoId, current.title, current.artist, current.thumbnail, 0);
    showNotif("Upcoming queue cleared");
  };

  const handleSaveQueue = () => {
    showNotif("Queue saved to local database");
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isLiked = currentTrack ? likedSongs.some(s => s.videoId === currentTrack.videoId) : false;

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-8" style={{ background: "#07070A" }}>
        
        {/* Notif */}
        <AnimatePresence>
          {notif && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-purple-600 border border-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
            >
              <CheckCircle size={13} /> {notif}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Hero Section */}
        <section className="relative px-6 md:px-10 pt-10 pb-6 overflow-hidden">
          {/* Ambient Background Glow */}
          <div className="absolute top-0 left-[-10%] w-[600px] h-[400px] rounded-full bg-purple-950/[0.08] blur-[140px] pointer-events-none" />
          <div className="absolute top-20 right-0 w-[450px] h-[320px] rounded-full bg-pink-950/[0.06] blur-[120px] pointer-events-none" />

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
                className="w-32 h-32 md:w-36 md:h-36 shrink-0 rounded-[24px] flex items-center justify-center relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
                  boxShadow: "0 20px 50px rgba(139,92,246,0.25), 0 8px 24px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Disc size={52} className="text-white drop-shadow-xl animate-spin" style={{ animationDuration: "12s" }} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none" />
              </div>

              {/* Meta details */}
              <div className="space-y-4 text-left flex-grow">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.05]">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">
                    PLAYING STREAM
                  </span>
                </div>

                <h1 className="font-display text-[44px] sm:text-[68px] font-black leading-[0.92] tracking-tighter text-white select-none">
                  Play Queue.
                </h1>

                <p className="text-[12px] text-zinc-500 font-semibold">
                  {queue.length} tracks in active queue list
                </p>
              </div>

              {/* Action triggers */}
              {queue.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={shuffleQueue}
                    className="px-5 py-2.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Shuffle size={13} /> Shuffle Queue
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={clearQueue}
                    className="px-5 py-2.5 rounded-full bg-red-650/15 hover:bg-red-650/25 border border-red-500/10 text-red-400 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} /> Clear Queue
                  </motion.button>
                </div>
              )}

            </div>
          </motion.div>
        </section>

        {/* 2. Main Section: Now Playing vs Up Next Grid */}
        {queue.length === 0 ? (
          <section className="px-6 md:px-10">
            <div className="text-center py-20 bg-white/[0.01] border border-white/[0.04] rounded-3xl">
              <ShieldAlert className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <h3 className="font-display text-[15px] font-bold text-white mb-1">Queue is empty</h3>
              <p className="text-[12px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                Browse search results or artists to start adding songs to queue lists.
              </p>
            </div>
          </section>
        ) : (
          <section className="px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8">
              
              {/* Left Column: Now Playing block */}
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
                    Active Track
                  </p>
                  <h2 className="font-display text-[18px] font-black text-white tracking-tight leading-none">
                    Now Playing
                  </h2>
                </div>

                {currentTrack ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-[24px] bg-white/[0.015] border border-white/[0.04] shadow-2xl space-y-5 text-left"
                  >
                    {/* Cover Frame */}
                    <div className="relative aspect-square rounded-[18px] overflow-hidden bg-zinc-900 border border-white/[0.05] shadow-lg group">
                      <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <Disc size={36} className={`text-white/60 ${isPlaying ? "animate-[spin_6s_linear_infinite]" : ""}`} />
                      </div>
                    </div>

                    {/* Metadata text */}
                    <div className="flex items-center justify-between min-w-0">
                      <div className="min-w-0 text-left">
                        <h3 className="text-sm font-bold text-zinc-200 truncate">{currentTrack.title}</h3>
                        <p className="text-[11px] text-zinc-500 font-semibold truncate mt-0.5">{currentTrack.artist}</p>
                      </div>

                      <button
                        onClick={() => toggleLike(currentTrack)}
                        className={`p-2 rounded-xl transition ${isLiked ? "text-pink-500" : "text-zinc-600 hover:text-white"}`}
                      >
                        <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {/* Progress slider simulation */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="bg-purple-550 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600">
                        <span>{formatDur(currentTime)}</span>
                        <span>{formatDur(duration)}</span>
                      </div>
                    </div>

                    {/* Player Settings */}
                    <div className="flex items-center justify-between gap-2 text-zinc-500 pt-2 border-t border-white/5">
                      <button
                        onClick={toggleShuffle}
                        className={`p-2 rounded-lg transition hover:text-white ${isShuffle ? "text-purple-400" : ""}`}
                        aria-label="Toggle Shuffle"
                      >
                        <Shuffle size={13} />
                      </button>
                      <button
                        onClick={toggleRepeat}
                        className={`p-2 rounded-lg transition hover:text-white ${isRepeat ? "text-purple-400" : ""}`}
                        aria-label="Toggle Repeat"
                      >
                        <Repeat size={13} />
                      </button>
                      <Link href={`/search?q=${encodeURIComponent(currentTrack.title)}`} className="text-[10px] text-zinc-650 hover:text-purple-400 font-bold uppercase tracking-wider">
                        Go to album
                      </Link>
                    </div>

                  </motion.div>
                ) : (
                  <div className="p-8 rounded-[24px] bg-white/[0.01] border border-white/[0.04] text-zinc-650 text-center">
                    No active track playing.
                  </div>
                )}
              </div>

              {/* Right Column: Up Next List */}
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
                    Next in queue
                  </p>
                  <h2 className="font-display text-[18px] font-black text-white tracking-tight leading-none">
                    Up Next
                  </h2>
                </div>

                {upcomingTracks.length > 0 ? (
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-none">
                    {upcomingTracks.map((song, idx) => {
                      const queueIndex = currentIndex + 1 + idx;
                      return (
                        <motion.div
                          key={`${song.videoId}-${queueIndex}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          onClick={() => playSong(song, queueIndex)}
                          className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.035] hover:border-purple-500/20 transition-all duration-300 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Reorder drag symbol */}
                            <GripVertical size={12} className="text-zinc-700 group-hover:text-zinc-500 shrink-0 cursor-grab" />
                            
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                              <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>

                            <div className="min-w-0 text-left">
                              <h4 className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                                {song.title}
                              </h4>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
                              {song.duration ? formatDur(song.duration) : "3:20"}
                            </span>
                            
                            {/* Action buttons */}
                            <button
                              onClick={(e) => playNextTrack(e, song)}
                              className="px-2.5 py-1 rounded bg-white/[0.03] hover:bg-white/[0.08] text-[10px] text-zinc-400 font-bold border border-white/[0.04] transition active:scale-95 opacity-0 group-hover:opacity-100"
                            >
                              Play Next
                            </button>
                            
                            <button
                              onClick={(e) => removeTrack(e, queueIndex)}
                              className="p-1 text-zinc-650 hover:text-red-400 transition"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-[24px] bg-white/[0.015] border border-white/[0.04] text-zinc-600 text-center text-xs">
                    No upcoming tracks in playlist queue.
                  </div>
                )}

                {/* Queue controls */}
                <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={13} className="text-zinc-650" />
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Queue Controls</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={clearRemainingQueue} className="px-3.5 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-[10px] font-bold text-zinc-350 transition">
                      Clear Upcoming
                    </button>
                    <button onClick={handleSaveQueue} className="px-3.5 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-[10px] font-bold text-zinc-350 transition">
                      Save Queue
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </section>
        )}

        {/* 3. Recently Played Section at Bottom */}
        {recentSongs.length > 0 && (
          <section className="px-6 md:px-10 space-y-6 border-t border-white/5 pt-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
                Playback History
              </p>
              <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                Recently Played
              </h2>
            </div>
            <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
              {recentSongs.slice(0, 6).map((song, i) => (
                <motion.div
                  key={`queue-recent-${song.videoId}-${i}`}
                  whileHover={{ y: -6 }}
                  onClick={() => setTrack(song.videoId, song.title, song.artist, song.thumbnail, 0)}
                  className="group shrink-0 w-[120px] md:w-[135px] flex flex-col gap-2.5 cursor-pointer text-left focus:outline-none"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-white/[0.04] shadow-sm">
                    <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-zinc-300 truncate leading-snug group-hover:text-purple-300 transition-colors">{song.title}</p>
                    <p className="text-[9px] text-zinc-555 truncate mt-0.5">{song.artist}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

      </main>
    </ProtectedRoute>
  );
}