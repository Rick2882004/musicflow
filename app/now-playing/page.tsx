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
  Film,
  Sliders,
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

  // Unified Shared Navigation & Feature States (synchronized between Desktop & Mobile)
  const [activeTab, setActiveTab] = useState<"queue" | "lyrics" | "equalizer">("queue");
  const [mediaMode, setMediaMode] = useState<"song" | "video">("song");
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);

  // Equalizer Preset (synchronized across desktop, mobile, and settings via localStorage)
  const [equalizerPreset, setEqualizerPreset] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("musicflow-eq") || "flat";
      } catch {
        return "flat";
      }
    }
    return "flat";
  });

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

  const handleSelectEqualizer = (preset: string) => {
    setEqualizerPreset(preset);
    try {
      localStorage.setItem("musicflow-eq", preset);
    } catch {}
    showNotif(`Equalizer: ${preset.toUpperCase()}`);
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
    const isLyricsActive = activeTab === "lyrics";
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
  }, [videoId, activeTab]);

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

  const eqPresets = [
    { id: "flat", label: "Flat / Normal", bars: [40, 40, 40, 40, 40] },
    { id: "bass", label: "Bass Booster", bars: [85, 75, 50, 40, 35] },
    { id: "acoustic", label: "Acoustic", bars: [50, 65, 60, 70, 55] },
    { id: "electronic", label: "Electronic", bars: [75, 60, 45, 65, 80] },
    { id: "classical", label: "Classical", bars: [60, 55, 50, 65, 70] },
    { id: "pop", label: "Pop", bars: [45, 65, 75, 60, 50] },
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

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP VIEW (>= 1024px, lg:flex)
          Left player + Right Up Next / Lyrics / Equalizer card
          ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col h-full w-full justify-between">
        {/* Desktop Header with [Song | Video] toggle matching mobile */}
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

          {/* Center: Desktop [ Song | Video ] Toggle Pill + Context Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center p-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
              <button
                onClick={() => setMediaMode("song")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  mediaMode === "song"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Music2 size={12} />
                <span>Song</span>
              </button>
              <button
                onClick={() => setMediaMode("video")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  mediaMode === "video"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Film size={12} />
                <span>Video</span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] font-bold text-zinc-400">
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

        {/* Desktop Main Content Area */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-6 lg:px-12 py-2 flex items-center justify-center min-h-0 z-10">
          <div className="w-full h-full flex items-center justify-center gap-8 lg:gap-14 min-h-0">
            
            {/* Desktop Left Column: Artwork / Video Container, Title, Controls */}
            <div
              className="flex flex-col items-center justify-center shrink-0 w-full"
              style={{ maxWidth: 440 }}
            >
              {/* Artwork / Video Container */}
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
                {mediaMode === "song" ? (
                  <>
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
                  </>
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
                    <SafeImage
                      src={thumbnail}
                      videoId={videoId}
                      title={title}
                      artist={artist}
                      alt={title || "Video Stream"}
                      className="w-full h-full object-cover opacity-60 scale-105"
                      fallbackType="song"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60" />
                    
                    {/* Top video stream badge */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      <div className="px-2.5 py-1 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-500/30 flex items-center gap-1.5 text-[10px] font-bold text-purple-300">
                        <Film size={12} className="text-purple-400" />
                        <span>VIDEO MODE</span>
                      </div>
                      {isPlaying && (
                        <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-[10px] font-bold text-purple-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                          <span>AUDIO SYNCED</span>
                        </div>
                      )}
                    </div>

                    {/* Center video stream visualizer icon */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-purple-600/30 border border-purple-500/40 backdrop-blur-md flex items-center justify-center shadow-lg">
                        <Film size={26} className="text-purple-300" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-200">YouTube Audio-Synced Stream</p>
                    </div>

                    {/* Bottom video overlay badge */}
                    <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="truncate">{title}</span>
                      <span className="text-[10px] font-mono text-purple-400 shrink-0">HD 1080p</span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Metadata & Like Button */}
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

              {/* Primary Controls Row */}
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

              {/* Utility Row */}
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

            {/* Desktop Right Column: Up Next / Lyrics / Equalizer Card */}
            <div
              className="w-full rounded-3xl bg-[#101016]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden min-h-0"
              style={{
                maxWidth: 480,
                height: "100%",
                maxHeight: 580,
              }}
            >
              {/* Card Header with 3 Tabs: [ Up Next ] [ Lyrics ] [ Equalizer ] */}
              <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-white/[0.01]">
                <div className="flex items-center gap-1.5">
                  {/* Up Next Tab */}
                  <button
                    onClick={() => setActiveTab("queue")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer",
                      activeTab === "queue"
                        ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    )}
                  >
                    <ListMusic size={14} />
                    <span>Up Next ({queue.length})</span>
                  </button>

                  {/* Lyrics Tab */}
                  <button
                    onClick={() => setActiveTab("lyrics")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer",
                      activeTab === "lyrics"
                        ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    )}
                  >
                    <Mic size={14} />
                    <span>Lyrics</span>
                  </button>

                  {/* Equalizer Tab */}
                  <button
                    onClick={() => setActiveTab("equalizer")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer",
                      activeTab === "equalizer"
                        ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    )}
                  >
                    <Sliders size={14} />
                    <span>Equalizer</span>
                  </button>
                </div>

                {activeTab === "queue" && queue.length > 0 && (
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

              {/* Card Body with 3 Views */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {activeTab === "queue" ? (
                  /* ── UP NEXT QUEUE TAB CONTENT ── */
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
                        {/* Now Playing highlighted item */}
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

                        {/* Upcoming Tracks */}
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

                        {/* History */}
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
                ) : activeTab === "lyrics" ? (
                  /* ── LYRICS TAB CONTENT ── */
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
                ) : (
                  /* ── EQUALIZER TAB CONTENT (DESKTOP) ── */
                  <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h3 className="text-sm font-bold text-white">Audio Equalizer</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">Select a frequency response curve profile</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-mono font-bold text-purple-300 uppercase">
                        {equalizerPreset}
                      </span>
                    </div>

                    {/* Animated Frequency Bars Graphic */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-end justify-center gap-5 h-28">
                      {eqPresets
                        .find((p) => p.id === equalizerPreset)
                        ?.bars.map((h, i) => (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div
                              className="w-5 rounded-full bg-gradient-to-t from-purple-600 via-purple-500 to-indigo-400 transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                              style={{ height: `${h * 0.75}px` }}
                            />
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {["60Hz", "230Hz", "910Hz", "3.6k", "14kHz"][i]}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Preset Buttons Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {eqPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectEqualizer(preset.id)}
                          className={cn(
                            "p-3 rounded-2xl text-left border transition flex items-center justify-between cursor-pointer",
                            equalizerPreset === preset.id
                              ? "bg-purple-600/20 border-purple-500/40 text-purple-200 font-bold shadow-sm"
                              : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                          )}
                        >
                          <div>
                            <span className="text-xs font-semibold block">{preset.label}</span>
                            <span className="text-[10px] text-zinc-500 block mt-0.5 font-mono">
                              Preset profile
                            </span>
                          </div>
                          {equalizerPreset === preset.id && (
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] text-zinc-500 text-center pt-1">
                      Audio presets are synchronized across Desktop, Mobile, and Settings.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>

        <div className="h-2 shrink-0" />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE VIEW (< 1024px, lg:hidden)
          Matches reference mobile player:
          - Top bar: [ Minimize ]  [ Song | Video ]  [ X ]
          - Upper: Centered Artwork, Title/Artist + Like, Progress, Playback, Utility
          - Lower: Bottom Sheet with drag handle, [ Up Next (N) ] [ Lyrics ] [ Equalizer ], scrollable queue
          ══════════════════════════════════════════════════════════════ */}
      <div className="flex lg:hidden flex-col h-full w-full justify-between overflow-hidden relative">
        
        {/* Mobile Top Bar */}
        <header className="w-full px-4 py-3 flex items-center justify-between z-20 shrink-0">
          {/* Left: Minimize button */}
          <button
            onClick={handleMinimize}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            aria-label="Minimize Player"
          >
            <ChevronDown size={18} />
          </button>

          {/* Center: [ Song | Video ] Toggle Pill */}
          <div className="flex items-center p-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
            <button
              onClick={() => setMediaMode("song")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                mediaMode === "song"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Music2 size={12} />
              <span>Song</span>
            </button>
            <button
              onClick={() => setMediaMode("video")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                mediaMode === "video"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Film size={12} />
              <span>Video</span>
            </button>
          </div>

          {/* Right: Close X */}
          <button
            onClick={handleMinimize}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        {/* Mobile Upper Player Area (Artwork, Info, Scrubber, Controls, Utility) */}
        <div className="flex-1 flex flex-col items-center justify-evenly px-5 py-1 min-h-0 z-10 w-full max-w-sm mx-auto">
          {/* Centered Large Album Artwork / Video Container */}
          <div
            className="rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] relative shrink-0 aspect-square"
            style={{
              width: "100%",
              maxWidth: "min(64vw, 220px)",
              maxHeight: "min(64vw, 220px)",
            }}
          >
            {mediaMode === "song" ? (
              <>
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
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1 text-[9px] font-bold text-purple-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                    <span>LIVE</span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
                <SafeImage
                  src={thumbnail}
                  videoId={videoId}
                  title={title}
                  artist={artist}
                  alt={title || "Video Stream"}
                  className="w-full h-full object-cover opacity-60 scale-105"
                  fallbackType="song"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60" />
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-500/30 flex items-center gap-1 text-[9px] font-bold text-purple-300">
                  <Film size={10} className="text-purple-400" />
                  <span>VIDEO</span>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-500/40 backdrop-blur-md flex items-center justify-center">
                    <Film size={18} className="text-purple-300" />
                  </div>
                  <p className="text-[10px] font-semibold text-zinc-300">Synced Stream</p>
                </div>
              </div>
            )}
          </div>

          {/* Track Information & Like Button */}
          <div className="w-full flex items-center justify-between gap-3 mt-1.5 px-1 shrink-0">
            <div className="min-w-0 flex-1 text-left">
              <h1 className="text-base sm:text-lg font-black text-white truncate tracking-tight">
                {title || "No track playing"}
              </h1>
              <Link
                href={artist ? `/artist/${encodeURIComponent(artist)}` : "#"}
                className="text-xs text-zinc-400 hover:text-purple-400 font-medium truncate block transition-colors mt-0.5"
              >
                {artist || "Select a song to begin"}
              </Link>
            </div>

            {currentTrack && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => toggleLike(currentTrack)}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-pink-400 transition cursor-pointer shrink-0"
                aria-label={isLiked ? "Unlike track" : "Like track"}
              >
                <Heart
                  size={18}
                  fill={isLiked ? "#ec4899" : "none"}
                  className={isLiked ? "text-pink-400" : ""}
                />
              </motion.button>
            )}
          </div>

          {/* Progress Bar & Timestamps */}
          <div className="w-full space-y-1 mt-1 px-1 shrink-0">
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
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls Row */}
          <div className="w-full flex items-center justify-between px-1 py-0.5 shrink-0">
            <button
              onClick={toggleShuffle}
              className={cn(
                "p-2 rounded-xl transition active:scale-90 cursor-pointer",
                isShuffle
                  ? "text-purple-400 bg-purple-500/10 border border-purple-500/20"
                  : "text-zinc-500 hover:text-zinc-200"
              )}
              aria-label="Toggle Shuffle"
            >
              <Shuffle size={17} />
            </button>

            <button
              onClick={prevTrack}
              className="p-2 text-zinc-300 hover:text-white transition active:scale-90 cursor-pointer"
              aria-label="Previous Track"
            >
              <SkipBack size={21} fill="currentColor" />
            </button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={togglePlay}
              className="w-13 h-13 rounded-full bg-white text-black flex items-center justify-center shadow-[0_6px_20px_rgba(255,255,255,0.25)] transition cursor-pointer shrink-0"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" className="ml-0.5" />
              )}
            </motion.button>

            <button
              onClick={nextTrack}
              className="p-2 text-zinc-300 hover:text-white transition active:scale-90 cursor-pointer"
              aria-label="Next Track"
            >
              <SkipForward size={21} fill="currentColor" />
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
            >
              <Repeat size={17} />
            </button>
          </div>

          {/* Utility Controls Row: [SLEEP] [RADIO] [1x] [VOLUME] */}
          <div className="w-full flex items-center justify-between gap-1.5 pt-1 px-1 text-[11px] shrink-0 border-t border-white/[0.05]">
            {/* Sleep Timer */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTimerMenu(!showTimerMenu);
                  setShowSpeedMenu(false);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-full border transition flex items-center gap-1 cursor-pointer active:scale-95 text-[10px] font-bold",
                  sleepTimer !== null
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-white/[0.04] text-zinc-400 border-white/[0.08]"
                )}
              >
                <Timer size={11} />
                <span>{sleepTimer !== null ? `${sleepTimer}m` : "SLEEP"}</span>
              </button>
              <AnimatePresence>
                {showTimerMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute bottom-full mb-2 left-0 rounded-2xl p-1.5 w-26 space-y-0.5 z-40"
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
                          "w-full text-center py-1 text-[10px] rounded-xl transition font-semibold cursor-pointer",
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

            {/* AI Radio */}
            <button
              onClick={toggleRadio}
              className={cn(
                "px-2.5 py-1 rounded-full border font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 text-[10px]",
                radioActive
                  ? "bg-purple-500/25 text-purple-300 border-purple-500/40"
                  : "bg-white/[0.04] text-zinc-400 border-white/[0.08]"
              )}
            >
              <Radio size={11} className={radioActive ? "animate-pulse text-purple-400" : ""} />
              <span>{radioActive ? "RADIO ON" : "RADIO"}</span>
            </button>

            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowTimerMenu(false);
                }}
                className="px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400 font-bold cursor-pointer active:scale-95 text-[10px]"
              >
                {playbackSpeed}×
              </button>
              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute bottom-full mb-2 right-0 rounded-2xl p-1.5 w-22 space-y-0.5 z-40"
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
                          "w-full text-center py-1 text-[10px] rounded-xl transition font-semibold cursor-pointer",
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

            {/* Volume */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-14 h-1 cursor-pointer outline-none rounded-full"
                style={{ background: volumeStyle, appearance: "none" }}
                aria-label="Volume Slider"
              />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            MOBILE BOTTOM QUEUE SHEET
            ══════════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "w-full rounded-t-[28px] bg-[#0c0c12]/95 backdrop-blur-2xl border-t border-x border-white/[0.08] shadow-[0_-16px_50px_rgba(0,0,0,0.85)] flex flex-col transition-all duration-300 z-30 shrink-0",
            isMobileSheetExpanded ? "h-[74vh]" : "h-[36vh] sm:h-[38vh]"
          )}
        >
          {/* Drag Handle */}
          <div
            onClick={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
            className="w-full pt-2.5 pb-1 flex items-center justify-center cursor-pointer active:opacity-60 select-none shrink-0"
            title={isMobileSheetExpanded ? "Tap to collapse" : "Tap to expand"}
          >
            <div className="w-10 h-1 rounded-full bg-white/25 hover:bg-white/40 transition-colors" />
          </div>

          {/* Bottom Sheet Tabs: [ Up Next (N) ] [ Lyrics ] [ Equalizer ] */}
          <div className="px-3.5 py-1.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              {/* Up Next Tab */}
              <button
                onClick={() => setActiveTab("queue")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer",
                  activeTab === "queue"
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <ListMusic size={13} />
                <span>Up Next ({queue.length})</span>
              </button>

              {/* Lyrics Tab */}
              <button
                onClick={() => setActiveTab("lyrics")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer",
                  activeTab === "lyrics"
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Mic size={13} />
                <span>Lyrics</span>
              </button>

              {/* Equalizer Tab */}
              <button
                onClick={() => setActiveTab("equalizer")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer",
                  activeTab === "equalizer"
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Sliders size={13} />
                <span>Equalizer</span>
              </button>
            </div>

            {/* Action icons */}
            {activeTab === "queue" && queue.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearUpcoming}
                  className="p-1 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                  title="Clear Upcoming Queue"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Content inside Bottom Sheet */}
          <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0 overscroll-contain scrollbar-thin scrollbar-thumb-zinc-800">
            {activeTab === "queue" ? (
              /* Up Next Queue Content */
              <div className="space-y-3 pb-2">
                {queue.length === 0 && !currentTrack ? (
                  <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                    <Music2 size={24} className="text-zinc-600 mb-1" />
                    <p className="text-xs text-zinc-400 font-semibold">Queue is empty</p>
                  </div>
                ) : (
                  <>
                    {/* Active Track */}
                    {currentTrack && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-wider text-purple-400">
                          <span>Now Playing</span>
                          {isPlaying && (
                            <span className="text-purple-300 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                              Playing
                            </span>
                          )}
                        </div>

                        <div className="p-2 rounded-xl bg-purple-950/25 border border-purple-500/30 flex items-center justify-between gap-2.5 shadow-sm">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
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
                                <Volume2 size={12} className="text-purple-300 animate-pulse" />
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

                    {/* Upcoming Tracks */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-wider text-zinc-400">
                        <span>Upcoming</span>
                        <span className="font-mono text-zinc-500">
                          {upcomingTracks.length > 0 ? `${upcomingTracks.length} tracks` : "End of queue"}
                        </span>
                      </div>

                      {upcomingTracks.length === 0 ? (
                        <div className="p-3 rounded-xl bg-white/[0.015] border border-white/5 text-center text-zinc-500 text-xs">
                          {radioActive ? (
                            <div className="flex items-center justify-center gap-1.5 text-purple-300 font-medium text-[11px]">
                              <Radio size={12} className="animate-pulse" />
                              <span>AI Radio generating next tracks...</span>
                            </div>
                          ) : (
                            <p className="text-[11px]">No upcoming songs. Turn on AI Radio for endless flow.</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {upcomingTracks.map(({ song, actualIndex }) => (
                            <div
                              key={`mobile-${song.videoId}-${actualIndex}`}
                              onClick={() =>
                                setTrack(song.videoId, song.title, song.artist, song.thumbnail, actualIndex)
                              }
                              className="p-1.5 rounded-lg flex items-center justify-between gap-2 border border-white/[0.03] bg-white/[0.01] active:bg-white/[0.05] text-zinc-300 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/5">
                                  <SafeImage
                                    src={song.thumbnail}
                                    videoId={song.videoId}
                                    title={song.title}
                                    artist={song.artist}
                                    alt={song.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                  <h4 className="text-xs font-semibold truncate text-zinc-200">
                                    {song.title}
                                  </h4>
                                  <p className="text-[10px] text-zinc-500 truncate">
                                    {song.artist}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                                  {formatDur(song.duration)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveTrack(e, actualIndex)}
                                  className="p-1 text-zinc-500 hover:text-red-400 transition"
                                  title="Remove"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* History */}
                    {previousTracks.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600 px-1">
                          History ({previousTracks.length})
                        </span>
                        <div className="space-y-1 opacity-60">
                          {previousTracks.map(({ song, actualIndex }) => (
                            <div
                              key={`mobile-hist-${song.videoId}-${actualIndex}`}
                              onClick={() =>
                                setTrack(song.videoId, song.title, song.artist, song.thumbnail, actualIndex)
                              }
                              className="p-1 rounded-lg flex items-center justify-between gap-2 text-zinc-400 active:bg-white/[0.03] cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-6 h-6 rounded-md overflow-hidden bg-zinc-900 shrink-0">
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
            ) : activeTab === "lyrics" ? (
              /* Lyrics Content */
              <div className="py-2 text-center">
                {lyricsLoading ? (
                  <div className="space-y-2.5 animate-pulse pt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-3.5 bg-white/5 rounded-md mx-auto"
                        style={{ width: `${60 + (i % 3) * 15}%` }}
                      />
                    ))}
                  </div>
                ) : lyrics && lyrics.length > 0 ? (
                  <div className="space-y-2 py-1">
                    {lyrics.map((line, idx) => {
                      const isEmpty = !line.trim();
                      return isEmpty ? (
                        <div key={idx} className="h-2.5" />
                      ) : (
                        <p
                          key={idx}
                          className="text-xs font-medium text-zinc-300 hover:text-white transition-colors leading-relaxed"
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500 space-y-1">
                    <FileText size={22} className="text-zinc-600 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-zinc-400">No lyrics available</p>
                    <p className="text-[10px] text-zinc-600">Instrumental or uncataloged track</p>
                  </div>
                )}
              </div>
            ) : (
              /* Equalizer Content */
              <div className="py-2 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Audio Profile Presets
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 uppercase">
                    {equalizerPreset}
                  </span>
                </div>

                {/* Animated Frequency Bars Preview */}
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-end justify-center gap-3 h-20">
                  {eqPresets
                    .find((p) => p.id === equalizerPreset)
                    ?.bars.map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div
                          className="w-4 rounded-full bg-gradient-to-t from-purple-600 to-indigo-400 transition-all duration-300"
                          style={{ height: `${h * 0.55}px` }}
                        />
                        <span className="text-[8px] text-zinc-500 font-mono">
                          {["60", "230", "910", "3.6k", "14k"][i]}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-2 gap-1.5">
                  {eqPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectEqualizer(preset.id)}
                      className={cn(
                        "p-2 rounded-xl text-left border transition text-xs flex items-center justify-between cursor-pointer",
                        equalizerPreset === preset.id
                          ? "bg-purple-600/20 border-purple-500/40 text-purple-200 font-bold"
                          : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white"
                      )}
                    >
                      <span>{preset.label}</span>
                      {equalizerPreset === preset.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
