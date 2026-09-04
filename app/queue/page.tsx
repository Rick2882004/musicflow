"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Trash2, ShieldAlert, Disc, Heart, Shuffle, Repeat, X, HelpCircle, GripVertical, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Track } from "@/types/music";
import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { useHasMounted } from "@/hooks/useHasMounted";
import { SafeImage } from "@/components/ui/SafeImage";

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const QueueHeroProgressBar = memo(function QueueHeroProgressBar() {
  const { currentTime, duration } = usePlayerStore(
    useShallow((s) => ({
      currentTime: s.currentTime,
      duration: s.duration,
    }))
  );
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-2 pt-2 border-t border-white/5">
      <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="bg-purple-550 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600">
        <span>{formatDur(currentTime)}</span>
        <span>{formatDur(duration)}</span>
      </div>
    </div>
  );
});

export default function QueuePage() {
  const mounted = useHasMounted();
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

  const isLiked = currentTrack ? likedSongs.some(s => s.videoId === currentTrack.videoId) : false;

  if (!mounted) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center">
          <div className="text-zinc-450 text-xl font-bold animate-pulse">Loading Play Queue...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-8 px-4 md:px-8 pt-4">
        
        {/* Notif */}
        <AnimatePresence>
          {notif && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-lg"
              style={{ background: "var(--mf-accent)" }}
            >
              <CheckCircle size={13} /> {notif}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Hero Section */}
        <section className="relative pb-2 overflow-hidden">


          {/* Clean Music Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Play Queue
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {queue.length} tracks in active queue
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
          </section>

        {/* 2. Main Section: Now Playing vs Up Next Grid */}
        {queue.length === 0 ? (
          <section className="w-full">
            <div className="text-center py-16 bg-[#121216] border border-white/[0.06] rounded-xl">
              <ShieldAlert className="w-7 h-7 text-zinc-600 mx-auto mb-2.5" />
              <h3 className="font-display text-sm font-bold text-white mb-1">Queue is empty</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Browse search results or artists to start adding songs to queue lists.
              </p>
            </div>
          </section>
        ) : (
          <section className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
              
              {/* Left Column: Now Playing block */}
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Active Track
                  </p>
                  <h2 className="text-base font-bold text-white tracking-tight leading-none">
                    Now Playing
                  </h2>
                </div>

                {currentTrack ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] space-y-4 text-left"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-white/[0.06] group max-w-[280px] mx-auto">
                      <SafeImage src={currentTrack.thumbnail} videoId={currentTrack.videoId} alt={currentTrack.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Disc size={32} className={`text-white/70 ${isPlaying ? "animate-[spin_6s_linear_infinite]" : ""}`} />
                      </div>
                    </div>

                    {/* Metadata text */}
                    <div className="flex items-center justify-between min-w-0">
                      <div className="min-w-0 text-left">
                        <h3 className="text-sm font-bold text-zinc-200 truncate">{currentTrack.title}</h3>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
                      </div>

                      <button
                        onClick={() => toggleLike(currentTrack)}
                        className={`p-2 rounded-lg transition ${isLiked ? "text-pink-500" : "text-zinc-400 hover:text-white"}`}
                      >
                        <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {/* Progress slider */}
                    <QueueHeroProgressBar />

                    {/* Player Settings */}
                    <div className="flex items-center justify-between gap-2 text-zinc-400 pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={toggleShuffle}
                        className={`p-1.5 rounded-md transition hover:text-white ${isShuffle ? "text-[var(--mf-accent)] font-bold" : ""}`}
                        aria-label="Toggle Shuffle"
                      >
                        <Shuffle size={14} />
                      </button>
                      <button
                        onClick={toggleRepeat}
                        className={`p-1.5 rounded-md transition hover:text-white ${isRepeat ? "text-[var(--mf-accent)] font-bold" : ""}`}
                        aria-label="Toggle Repeat"
                      >
                        <Repeat size={14} />
                      </button>
                      <Link href={`/search?q=${encodeURIComponent(currentTrack.title)}`} className="text-[10px] text-zinc-400 hover:text-white font-medium">
                        Search track
                      </Link>
                    </div>

                  </motion.div>
                ) : (
                  <div className="p-6 rounded-xl bg-[#121216] border border-white/[0.06] text-zinc-400 text-xs text-center">
                    No active track playing.
                  </div>
                )}
              </div>

              {/* Right Column: Up Next List */}
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Next in queue
                  </p>
                  <h2 className="text-base font-bold text-white tracking-tight leading-none">
                    Up Next
                  </h2>
                </div>

                {upcomingTracks.length > 0 ? (
                  <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-none">
                    {upcomingTracks.map((song, idx) => {
                      const queueIndex = currentIndex + 1 + idx;
                      return (
                        <motion.div
                          key={`${song.videoId}-${queueIndex}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => playSong(song, queueIndex)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#121216] border border-white/[0.04] hover:bg-[#181820] hover:border-white/[0.08] transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Reorder drag symbol */}
                            <GripVertical size={13} className="text-zinc-600 group-hover:text-zinc-400 shrink-0 cursor-grab" />
                            
                            <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 border border-white/[0.06] bg-zinc-900">
                              <SafeImage src={song.thumbnail} videoId={song.videoId} alt="" className="w-full h-full object-cover" />
                            </div>

                            <div className="min-w-0 text-left">
                              <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                                {song.title}
                              </h4>
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{song.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                              {song.duration ? formatDur(song.duration) : "3:20"}
                            </span>
                            
                            {/* Action buttons */}
                            <button
                              onClick={(e) => playNextTrack(e, song)}
                              className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-[10px] text-zinc-300 font-medium transition"
                            >
                              Play Next
                            </button>
                            
                            <button
                              onClick={(e) => removeTrack(e, queueIndex)}
                              className="p-1 text-zinc-400 hover:text-red-400 transition"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-[#121216] border border-white/[0.06] text-zinc-400 text-center text-xs">
                    No upcoming tracks in playlist queue.
                  </div>
                )}

                {/* Queue controls */}
                <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.06] flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={13} className="text-zinc-400" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Queue Controls</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={clearRemainingQueue} className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-zinc-300 transition">
                      Clear Upcoming
                    </button>
                    <button onClick={handleSaveQueue} className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-zinc-300 transition">
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
          <section className="w-full space-y-3 border-t border-white/[0.06] pt-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Playback History
              </p>
              <h2 className="text-lg font-bold text-white tracking-tight leading-none">
                Recently Played
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
              {recentSongs.slice(0, 8).map((song, i) => (
                <div
                  key={`queue-recent-${song.videoId}-${i}`}
                  onClick={() => setTrack(song.videoId, song.title, song.artist, song.thumbnail, 0)}
                  className="group shrink-0 w-[110px] md:w-[124px] flex flex-col gap-2 cursor-pointer text-left focus:outline-none"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-white/[0.06]">
                    <SafeImage src={song.thumbnail} videoId={song.videoId} alt={song.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-[var(--mf-accent)] transition-colors">{song.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </ProtectedRoute>
  );
}