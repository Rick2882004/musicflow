"use client";

import { usePlayerStore } from "@/store/player-store";
import { useRadioStore } from "@/store/radio-store";
import { useShallow } from "zustand/react/shallow";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Radio,
  Volume2,
  VolumeX,
  ChevronDown,
  X,
  ListMusic,
  Mic,
  BookmarkPlus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Music2,
  Timer,
  FileText,
} from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import { Track } from "@/types/music";
import { playAudioAnchor, pauseAudioAnchor } from "@/lib/audio-anchor";
import { markIntentionalUserPause, clearIntentionalUserPause } from "@/lib/playback-intent";
import { notifyMediaSessionSeek, updateMediaSessionPosition } from "@/hooks/useMediaSession";
import { logBgDiag } from "@/lib/bg-diagnostics";
import Link from "next/link";

function formatTime(secs: number) {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDur(s: number = 0) {
  if (!s || isNaN(s)) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function NowPlayingPage() {
  const router = useRouter();

  const {
    videoId,
    title,
    artist,
    thumbnail,
    duration,
    currentTime,
    setCurrentTime,
    setDuration,
    isPlaying,
    setIsPlaying,
    player,
    queue,
    currentIndex,
    setTrack,
    setQueue,
    reorderQueue,
    clearQueue,
    nextTrack,
    prevTrack,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    likedSongs,
    toggleLike,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    playbackSpeed,
    setPlaybackSpeed,
    sleepTimer,
    setSleepTimer,
    addPlaylist,
    addSongToPlaylist,
  } = usePlayerStore(
    useShallow((s) => ({
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
      duration: s.duration,
      currentTime: s.currentTime,
      setCurrentTime: s.setCurrentTime,
      setDuration: s.setDuration,
      isPlaying: s.isPlaying,
      setIsPlaying: s.setIsPlaying,
      player: s.player,
      queue: s.queue,
      currentIndex: s.currentIndex,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
      reorderQueue: s.reorderQueue,
      clearQueue: s.clearQueue,
      nextTrack: s.nextTrack,
      prevTrack: s.prevTrack,
      isShuffle: s.isShuffle,
      toggleShuffle: s.toggleShuffle,
      isRepeat: s.isRepeat,
      toggleRepeat: s.toggleRepeat,
      likedSongs: s.likedSongs,
      toggleLike: s.toggleLike,
      volume: s.volume,
      setVolume: s.setVolume,
      isMuted: s.isMuted,
      setIsMuted: s.setIsMuted,
      playbackSpeed: s.playbackSpeed,
      setPlaybackSpeed: s.setPlaybackSpeed,
      sleepTimer: s.sleepTimer,
      setSleepTimer: s.setSleepTimer,
      addPlaylist: s.addPlaylist,
      addSongToPlaylist: s.addSongToPlaylist,
    }))
  );

  const { radioActive, toggleRadio } = useRadioStore();

  // On desktop: Right panel shows Up Next vs Lyrics
  const [panelTab, setPanelTab] = useState<"queue" | "lyrics">("queue");
  // On mobile (< 1024px): Switches between Player, Up Next, and Lyrics views
  const [mobileTab, setMobileTab] = useState<"player" | "queue" | "lyrics">("player");

  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [notif, setNotif] = useState("");

  const queueContainerRef = useRef<HTMLDivElement>(null);

  const showNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 2000);
  };

  const currentTrack: Track | null = useMemo(() => {
    if (queue.length > 0 && currentIndex >= 0 && currentIndex < queue.length) {
      return queue[currentIndex];
    }
    if (videoId) {
      return { videoId, title, artist, thumbnail, duration };
    }
    return null;
  }, [queue, currentIndex, videoId, title, artist, thumbnail, duration]);

  const isLiked = currentTrack
    ? likedSongs.some((s) => s.videoId === currentTrack.videoId)
    : false;

  const upcomingTracks = useMemo(() => {
    if (queue.length === 0) return [];
    return queue.slice(currentIndex + 1).map((song, idx) => ({
      song,
      actualIndex: currentIndex + 1 + idx,
    }));
  }, [queue, currentIndex]);

  const previousTracks = useMemo(() => {
    if (queue.length === 0 || currentIndex <= 0) return [];
    return queue.slice(0, currentIndex).map((song, idx) => ({
      song,
      actualIndex: idx,
    }));
  }, [queue, currentIndex]);

  // Polling for progress bar update on active playback
  useEffect(() => {
    if (!isPlaying || !player || typeof player.getCurrentTime !== "function") return;
    const interval = setInterval(() => {
      try {
        const time = player.getCurrentTime();
        const dur = player.getDuration();
        if (typeof time === "number") setCurrentTime(time);
        if (typeof dur === "number" && dur > 0) {
          setDuration(dur);
          const rate = player.getPlaybackRate?.() || 1;
          updateMediaSessionPosition(time, dur, rate, false);
        }
      } catch {
        // Transition ignore
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player, isPlaying, setCurrentTime, setDuration]);

  // Fetch lyrics dynamically when lyrics tab is opened or videoId changes
  useEffect(() => {
    const isLyricsActive = panelTab === "lyrics" || mobileTab === "lyrics";
    if (!videoId || !isLyricsActive) return;
    let isCurrent = true;
    async function fetchLyrics() {
      setLyricsLoading(true);
      setLyrics(null);
      try {
        const res = await fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}`);
        if (res.ok && isCurrent) {
          const data = await res.json();
          setLyrics(data.lyrics || null);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isCurrent) setLyricsLoading(false);
      }
    }
    fetchLyrics();
    return () => {
      isCurrent = false;
    };
  }, [videoId, panelTab, mobileTab]);

  // Controls
  const togglePlay = () => {
    if (!player) return;
    const store = usePlayerStore.getState();
    if (isPlaying) {
      logBgDiag("call-pauseVideo", { source: "NowPlaying:togglePlay", isPlaying: true });
      markIntentionalUserPause();
      pauseAudioAnchor();
      player.pauseVideo();
      setIsPlaying(false);
      updateMediaSessionPosition(store.currentTime, store.duration, store.playbackSpeed, true);
    } else {
      logBgDiag("call-playVideo", { source: "NowPlaying:togglePlay", isPlaying: false });
      clearIntentionalUserPause();
      playAudioAnchor();
      player.playVideo();
      setIsPlaying(true);
      updateMediaSessionPosition(store.currentTime, store.duration, store.playbackSpeed, true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player || duration <= 0) return;
    const target = (Number(e.target.value) / 100) * duration;
    player.seekTo(target, true);
    setCurrentTime(target);
    notifyMediaSessionSeek(target, duration, playbackSpeed);
  };

  const handleMinimize = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleMoveUp = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index > 0) {
      reorderQueue(index, index - 1);
    }
  };

  const handleMoveDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index < queue.length - 1) {
      reorderQueue(index, index + 1);
    }
  };

  const handleRemoveTrack = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const updatedQueue = queue.filter((_, idx) => idx !== indexToRemove);
    setQueue(updatedQueue);
    showNotif("Removed from queue");
  };

  const handleClearUpcoming = () => {
    if (queue.length === 0) return;
    const current = queue[currentIndex] || currentTrack;
    if (current) {
      setQueue([current]);
      setTrack(current.videoId, current.title, current.artist, current.thumbnail, 0);
      showNotif("Upcoming queue cleared");
    } else {
      clearQueue();
    }
  };

  const handleSaveQueueAsPlaylist = async () => {
    if (queue.length === 0) return;
    const name = `Queue Mix (${new Date().toLocaleDateString()})`;
    await addPlaylist(name);
    const { playlists } = usePlayerStore.getState();
    const created = playlists[playlists.length - 1];
    if (created) {
      for (const song of queue) {
        await addSongToPlaylist(created.id, song);
      }
      showNotif(`Saved ${queue.length} songs to "${name}"`);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressStyle = `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${progress}%, rgb(39 39 42) ${progress}%, rgb(39 39 42) 100%)`;
  const volumeStyle = `linear-gradient(to right, rgba(255,255,255,0.7) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.08) ${isMuted ? 0 : volume}%)`;

  const speedOptions = [0.5, 1.0, 1.25, 1.5, 2.0];
  const timerOptions = [
    { label: "Off", value: null },
    { label: "5 min", value: 5 },
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "60 min", value: 60 },
  ];

  const dropdownStyle: React.CSSProperties = {
    background: "rgba(12, 12, 18, 0.95)",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.85)",
  };

  return (
    <div className="h-screen bg-[#07070a] text-white flex flex-col justify-between overflow-hidden select-none relative">
      {/* Dynamic Background Ambient Aura */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 blur-[120px] transition-all duration-1000"
        style={{
          background: isPlaying
            ? "radial-gradient(circle at 30% 40%, rgba(147, 51, 234, 0.25) 0%, transparent 60%)"
            : "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Notification Toast */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white font-bold text-xs flex items-center gap-2 shadow-2xl bg-purple-600 border border-purple-400/30"
          >
            <span>{notif}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP HEADER ── */}
      <header className="w-full max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between z-20 shrink-0">
        {/* Left: Minimize button */}
        <button
          onClick={handleMinimize}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
          aria-label="Minimize Player"
        >
          <ChevronDown size={15} />
          <span>Minimize</span>
        </button>

        {/* Center: Desktop context badge OR Mobile tab switcher */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] font-bold text-zinc-400">
          {radioActive ? (
            <div className="flex items-center gap-1.5 text-purple-400">
              <Radio size={12} className="animate-pulse" />
              <span>AI Radio Session</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Music2 size={12} className="text-zinc-500" />
              <span>Playing from Queue</span>
            </div>
          )}
        </div>

        {/* Mobile View Switcher (< 1024px) */}
        <div className="flex lg:hidden items-center gap-1 bg-white/[0.04] border border-white/[0.06] p-1 rounded-full text-xs">
          <button
            onClick={() => setMobileTab("player")}
            className={cn(
              "px-3 py-1 rounded-full font-bold transition cursor-pointer",
              mobileTab === "player"
                ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Player
          </button>
          <button
            onClick={() => setMobileTab("queue")}
            className={cn(
              "px-3 py-1 rounded-full font-bold transition cursor-pointer",
              mobileTab === "queue"
                ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Up Next ({queue.length})
          </button>
          <button
            onClick={() => setMobileTab("lyrics")}
            className={cn(
              "px-3 py-1 rounded-full font-bold transition cursor-pointer",
              mobileTab === "lyrics"
                ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Lyrics
          </button>
        </div>

        {/* Right: Close button */}
        <button
          onClick={handleMinimize}
          className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 lg:px-12 py-2 flex items-center justify-center min-h-0 z-10">
        <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 min-h-0">
          
          {/* ══════════════════════════════════════════════════════════
              LEFT / MAIN NOW PLAYING AREA (Artwork, Title, Controls)
             ══════════════════════════════════════════════════════════ */}
          <div
            className={cn(
              "flex flex-col items-center justify-center shrink-0 w-full",
              mobileTab === "player" ? "flex" : "hidden lg:flex"
            )}
            style={{ maxWidth: 440 }}
          >
            {/* Large Album Artwork */}
            <motion.div
              animate={{ scale: isPlaying ? 1 : 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="rounded-[28px] overflow-hidden bg-zinc-900 border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.85)] relative group"
              style={{
                width: "100%",
                maxWidth: 380,
                aspectRatio: "1/1",
              }}
            >
              <SafeImage
                src={thumbnail}
                videoId={videoId}
                title={title}
                artist={artist}
                alt={title || "Now Playing"}
                className="w-full h-full object-cover"
                fallbackType="song"
              />
              {isPlaying && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-[10px] font-bold text-purple-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                  <span>LIVE</span>
                </div>
              )}
            </motion.div>

            {/* Song Metadata & Like Button */}
            <div className="w-full flex items-center justify-between gap-4 mt-5 px-1">
              <div className="min-w-0 flex-1 text-left">
                <h1 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
                  {title || "No track playing"}
                </h1>
                <Link
                  href={artist ? `/artist/${encodeURIComponent(artist)}` : "#"}
                  className="text-xs sm:text-sm text-zinc-400 hover:text-purple-400 font-medium truncate mt-0.5 block transition-colors"
                >
                  {artist || "Select a song to begin"}
                </Link>
              </div>

              {currentTrack && (
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={() => toggleLike(currentTrack)}
                  className="p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-pink-400 transition cursor-pointer shrink-0"
                  aria-label={isLiked ? "Unlike track" : "Like track"}
                >
                  <Heart
                    size={19}
                    fill={isLiked ? "#ec4899" : "none"}
                    className={isLiked ? "text-pink-400" : ""}
                  />
                </motion.button>
              )}
            </div>

            {/* Progress Bar & Timestamps */}
            <div className="w-full space-y-1.5 mt-4 px-1">
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={handleSeek}
                className="w-full h-1.5 rounded-full cursor-pointer outline-none transition-all"
                style={{ background: progressStyle, appearance: "none" }}
                aria-label="Seek track"
              />
              <div className="flex justify-between text-[11px] font-mono text-zinc-500 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Primary Controls Row: Shuffle, Previous, Play/Pause, Next, Repeat */}
            <div className="w-full flex items-center justify-between py-2 px-1 mt-1">
              <button
                onClick={toggleShuffle}
                className={cn(
                  "p-2 rounded-xl transition active:scale-90 cursor-pointer",
                  isShuffle
                    ? "text-purple-400 bg-purple-500/10 border border-purple-500/20"
                    : "text-zinc-500 hover:text-zinc-200"
                )}
                aria-label="Toggle Shuffle"
                title="Shuffle"
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={prevTrack}
                className="p-2 text-zinc-300 hover:text-white transition active:scale-90 cursor-pointer"
                aria-label="Previous Track"
                title="Previous"
              >
                <SkipBack size={22} fill="currentColor" />
              </button>

              {/* Play/Pause Main Button */}
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={togglePlay}
                className="w-15 h-15 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_25px_rgba(255,255,255,0.25)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.35)] transition cursor-pointer"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-1" />
                )}
              </motion.button>

              <button
                onClick={nextTrack}
                className="p-2 text-zinc-300 hover:text-white transition active:scale-90 cursor-pointer"
                aria-label="Next Track"
                title="Next"
              >
                <SkipForward size={22} fill="currentColor" />
              </button>

              <button
                onClick={toggleRepeat}
                className={cn(
                  "p-2 rounded-xl transition active:scale-90 cursor-pointer",
                  isRepeat
                    ? "text-purple-400 bg-purple-500/10 border border-purple-500/20"
                    : "text-zinc-500 hover:text-zinc-200"
                )}
                aria-label="Toggle Repeat"
                title="Repeat"
              >
                <Repeat size={18} />
              </button>
            </div>

            {/* Secondary Controls Bar: Sleep Timer, AI Radio Pill, Speed, Volume */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-white/[0.06] px-1 text-xs">
              {/* Sleep Timer */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTimerMenu(!showTimerMenu);
                    setShowSpeedMenu(false);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 cursor-pointer active:scale-95",
                    sleepTimer !== null
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : "bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-zinc-200"
                  )}
                  title="Sleep Timer"
                >
                  <Timer size={13} />
                  <span className="font-bold">{sleepTimer !== null ? `${sleepTimer}m` : "SLEEP"}</span>
                </button>
                <AnimatePresence>
                  {showTimerMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute bottom-full mb-2 left-0 rounded-2xl p-1.5 w-28 space-y-0.5 z-30"
                      style={dropdownStyle}
                    >
                      {timerOptions.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => {
                            setSleepTimer(opt.value);
                            setShowTimerMenu(false);
                          }}
                          className={cn(
                            "w-full text-center py-1.5 text-xs rounded-xl transition font-semibold cursor-pointer",
                            sleepTimer === opt.value
                              ? "text-white bg-purple-600/30"
                              : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* AI Radio Toggle Pill */}
              <button
                onClick={toggleRadio}
                className={cn(
                  "px-3.5 py-1.5 rounded-full border font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm",
                  radioActive
                    ? "bg-purple-500/25 text-purple-300 border-purple-500/40 shadow-purple-500/10"
                    : "bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-zinc-200"
                )}
                title="Toggle AI Radio Continuous Refill"
              >
                <Radio size={13} className={radioActive ? "animate-pulse text-purple-400" : ""} />
                <span>{radioActive ? "RADIO ON" : "RADIO"}</span>
              </button>

              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowTimerMenu(false);
                  }}
                  className="px-2.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 font-bold cursor-pointer active:scale-95"
                  title="Playback Speed"
                >
                  {playbackSpeed}×
                </button>
                <AnimatePresence>
                  {showSpeedMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute bottom-full mb-2 right-0 rounded-2xl p-1.5 w-24 space-y-0.5 z-30"
                      style={dropdownStyle}
                    >
                      {speedOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setPlaybackSpeed(opt);
                            if (player) player.setPlaybackRate(opt);
                            setShowSpeedMenu(false);
                          }}
                          className={cn(
                            "w-full text-center py-1.5 text-xs rounded-xl transition font-semibold cursor-pointer",
                            playbackSpeed === opt
                              ? "text-white bg-purple-600/30"
                              : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                          )}
                        >
                          {opt}×
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Volume Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-zinc-400 hover:text-white transition cursor-pointer"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-16 sm:w-20 h-1 cursor-pointer outline-none rounded-full"
                  style={{ background: volumeStyle, appearance: "none" }}
                  aria-label="Volume Slider"
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT / UP NEXT & LYRICS CARD (Synchronized Queue & Lyrics)
             ══════════════════════════════════════════════════════════ */}
          <div
            className={cn(
              "w-full rounded-3xl bg-[#101016]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden min-h-0",
              mobileTab !== "player" ? "flex" : "hidden lg:flex"
            )}
            style={{
              maxWidth: 480,
              height: "100%",
              maxHeight: 580,
            }}
          >
            {/* Card Header with Tabs & Actions */}
            <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                {/* Up Next Tab Button */}
                <button
                  onClick={() => {
                    setPanelTab("queue");
                    setMobileTab("queue");
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition cursor-pointer",
                    (panelTab === "queue" || mobileTab === "queue") && mobileTab !== "lyrics"
                      ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  )}
                >
                  <ListMusic size={14} />
                  <span>Up Next ({queue.length})</span>
                </button>

                {/* Lyrics Tab Button */}
                <button
                  onClick={() => {
                    setPanelTab("lyrics");
                    setMobileTab("lyrics");
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition cursor-pointer",
                    panelTab === "lyrics" || mobileTab === "lyrics"
                      ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  )}
                >
                  <Mic size={14} />
                  <span>Lyrics</span>
                </button>
              </div>

              {/* Right Tab Actions (Save / Clear Queue) */}
              {(panelTab === "queue" || mobileTab === "queue") && mobileTab !== "lyrics" && queue.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveQueueAsPlaylist}
                    className="p-1.5 text-zinc-400 hover:text-purple-300 hover:bg-white/5 rounded-lg transition cursor-pointer"
                    title="Save Queue as Playlist"
                    aria-label="Save Queue"
                  >
                    <BookmarkPlus size={15} />
                  </button>
                  <button
                    onClick={handleClearUpcoming}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition cursor-pointer"
                    title="Clear Upcoming Queue"
                    aria-label="Clear Upcoming"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Card Body — Content Switched by Active Tab */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {(panelTab === "queue" || mobileTab === "queue") && mobileTab !== "lyrics" ? (
                /* ── 1. UP NEXT QUEUE TAB CONTENT ── */
                <div
                  ref={queueContainerRef}
                  className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
                >
                  {queue.length === 0 && !currentTrack ? (
                    <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                      <Music2 size={32} className="text-zinc-600 mb-2" />
                      <h3 className="text-sm font-bold text-white mb-1">Queue is empty</h3>
                      <p className="text-xs text-zinc-500 max-w-xs">
                        Play a track from Search, Home, or your Library to start the session.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Active Track Highlight */}
                      {currentTrack && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wider text-purple-400">
                            <span>Now Playing</span>
                            {isPlaying && (
                              <div className="flex items-center gap-1 text-purple-300 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                                <span>Playing</span>
                              </div>
                            )}
                          </div>

                          <div className="p-2.5 rounded-2xl bg-purple-950/25 border border-purple-500/30 flex items-center justify-between gap-3 shadow-sm">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                              <SafeImage
                                src={currentTrack.thumbnail}
                                videoId={currentTrack.videoId}
                                title={currentTrack.title}
                                artist={currentTrack.artist}
                                alt={currentTrack.title}
                                className="w-full h-full object-cover"
                              />
                              {isPlaying && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Volume2 size={14} className="text-purple-300 animate-pulse" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <h4 className="text-xs font-bold text-white truncate leading-tight">
                                {currentTrack.title}
                              </h4>
                              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                                {currentTrack.artist}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 tabular-nums shrink-0">
                              {formatDur(currentTrack.duration || duration)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Upcoming Songs List */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          <span>Upcoming</span>
                          <span className="font-mono text-zinc-500">
                            {upcomingTracks.length > 0
                              ? `${upcomingTracks.length} tracks`
                              : "End of queue"}
                          </span>
                        </div>

                        {upcomingTracks.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/5 text-center text-zinc-500 text-xs">
                            {radioActive ? (
                              <div className="flex items-center justify-center gap-2 text-purple-300 font-medium">
                                <Radio size={13} className="animate-pulse" />
                                <span>AI Radio is generating next tracks...</span>
                              </div>
                            ) : (
                              <p>No upcoming songs. Turn on AI Radio for endless recommendations.</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {upcomingTracks.map(({ song, actualIndex }) => (
                              <div
                                key={`${song.videoId}-${actualIndex}`}
                                onClick={() =>
                                  setTrack(song.videoId, song.title, song.artist, song.thumbnail, actualIndex)
                                }
                                className="p-2 rounded-xl flex items-center justify-between gap-2.5 border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10 text-zinc-300 hover:text-white cursor-pointer group transition-all duration-150"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="relative w-8.5 h-8.5 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/5">
                                    <SafeImage
                                      src={song.thumbnail}
                                      videoId={song.videoId}
                                      title={song.title}
                                      artist={song.artist}
                                      alt={song.title}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Play size={12} fill="white" className="text-white ml-0.5" />
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1 text-left">
                                    <h4 className="text-xs font-semibold truncate group-hover:text-white transition-colors">
                                      {song.title}
                                    </h4>
                                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                      {song.artist}
                                    </p>
                                  </div>
                                </div>

                                {/* Duration & Hover Controls */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums pr-1 group-hover:hidden">
                                    {formatDur(song.duration)}
                                  </span>

                                  <div className="hidden group-hover:flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => handleMoveUp(e, actualIndex)}
                                      disabled={actualIndex <= currentIndex + 1}
                                      className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded transition cursor-pointer"
                                      title="Move Up"
                                      aria-label="Move Up"
                                    >
                                      <ArrowUp size={11} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleMoveDown(e, actualIndex)}
                                      disabled={actualIndex >= queue.length - 1}
                                      className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded transition cursor-pointer"
                                      title="Move Down"
                                      aria-label="Move Down"
                                    >
                                      <ArrowDown size={11} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleRemoveTrack(e, actualIndex)}
                                      className="p-1 text-zinc-500 hover:text-red-400 rounded transition cursor-pointer"
                                      title="Remove from queue"
                                      aria-label="Remove Track"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Previous Tracks / History */}
                      {previousTracks.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600 px-1">
                            History ({previousTracks.length})
                          </span>
                          <div className="space-y-1 opacity-50 hover:opacity-100 transition-opacity">
                            {previousTracks.map(({ song, actualIndex }) => (
                              <div
                                key={`hist-${song.videoId}-${actualIndex}`}
                                onClick={() =>
                                  setTrack(song.videoId, song.title, song.artist, song.thumbnail, actualIndex)
                                }
                                className="p-1.5 rounded-lg flex items-center justify-between gap-2.5 bg-white/[0.005] hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-7 h-7 rounded-md overflow-hidden bg-zinc-900 shrink-0">
                                    <SafeImage
                                      src={song.thumbnail}
                                      videoId={song.videoId}
                                      title={song.title}
                                      artist={song.artist}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1 text-left">
                                    <p className="text-[10px] font-medium truncate">{song.title}</p>
                                    <p className="text-[9px] text-zinc-600 truncate">{song.artist}</p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-mono text-zinc-600 tabular-nums">
                                  {formatDur(song.duration)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                /* ── 2. LYRICS TAB CONTENT ── */
                <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {lyricsLoading ? (
                    <div className="space-y-3.5 animate-pulse pt-4 text-center">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="h-4.5 bg-white/5 rounded-md mx-auto"
                          style={{ width: `${55 + (i % 3) * 15}%` }}
                        />
                      ))}
                    </div>
                  ) : lyrics && lyrics.length > 0 ? (
                    <div className="space-y-3.5 text-center py-2">
                      {lyrics.map((line, idx) => {
                        const isEmpty = !line.trim();
                        return isEmpty ? (
                          <div key={idx} className="h-3" />
                        ) : (
                          <p
                            key={idx}
                            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors leading-relaxed"
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                      <FileText size={28} className="text-zinc-600 mb-1" />
                      <h3 className="text-sm font-bold text-zinc-300">No lyrics available</h3>
                      <p className="text-xs text-zinc-500 max-w-xs">
                        We couldn&apos;t find lyrics for &quot;{title}&quot;. The song may be an instrumental.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Subtle bottom footer padding spacer */}
      <div className="h-2 shrink-0" />
    </div>
  );
}
