"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHasMounted } from "@/hooks/useHasMounted";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Repeat,
  Shuffle,
  List,
  Gauge,
  Timer,
  ChevronDown,
  Mic,
  Laptop,
  Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import QueueDrawer from "./QueueDrawer";
import { SafeImage } from "@/components/ui/SafeImage";

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Local SafeImage helper removed - using global SafeImage instead

// Icon button helper
function IconBtn({
  onClick,
  active,
  activeColor = "text-white",
  label,
  children,
  className = "",
}: {
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative p-2 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center",
        active
          ? `${activeColor} bg-white/[0.06] border border-white/[0.08]`
          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function BottomPlayer() {
  const {
    videoId,
    title,
    artist,
    thumbnail,
    isQueueOpen,
    toggleQueue,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    player,
    likedSongs,
    toggleLike,
    nextTrack,
    prevTrack,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    playbackSpeed,
    setPlaybackSpeed,
    sleepTimer,
    setSleepTimer,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
  } = usePlayerStore(
    useShallow((s) => ({
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
      isQueueOpen: s.isQueueOpen,
      toggleQueue: s.toggleQueue,
      isPlaying: s.isPlaying,
      setIsPlaying: s.setIsPlaying,
      currentTime: s.currentTime,
      setCurrentTime: s.setCurrentTime,
      duration: s.duration,
      setDuration: s.setDuration,
      player: s.player,
      likedSongs: s.likedSongs,
      toggleLike: s.toggleLike,
      nextTrack: s.nextTrack,
      prevTrack: s.prevTrack,
      isShuffle: s.isShuffle,
      toggleShuffle: s.toggleShuffle,
      isRepeat: s.isRepeat,
      toggleRepeat: s.toggleRepeat,
      playbackSpeed: s.playbackSpeed,
      setPlaybackSpeed: s.setPlaybackSpeed,
      sleepTimer: s.sleepTimer,
      setSleepTimer: s.setSleepTimer,
      volume: s.volume,
      setVolume: s.setVolume,
      isMuted: s.isMuted,
      setIsMuted: s.setIsMuted,
    }))
  );

  const currentTrack = { videoId, title, artist, thumbnail, duration };
  const isLiked = likedSongs.some((song) => song.videoId === videoId);

  const mounted = useHasMounted();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressRef = useRef<HTMLInputElement>(null);

  // Controls
  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      player.playVideo();
      setIsPlaying(true);
    }
  };

  const seekDelta = (delta: number) => {
    if (!player) return;
    player.seekTo(Math.min(Math.max(player.getCurrentTime() + delta, 0), duration), true);
  };

  const adjustVolume = (delta: number) => {
    setVolume(Math.min(Math.max(volume + delta, 0), 100));
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Sleep Timer
  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      if (player && isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      }
      setSleepTimer(null);
      return;
    }
    const timer = setTimeout(() => {
      setSleepTimer(sleepTimer - 1);
    }, 60000);
    return () => clearTimeout(timer);
  }, [sleepTimer, player, isPlaying, setSleepTimer, setIsPlaying]);

  // Polling for current track progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === "function") {
        setCurrentTime(player.getCurrentTime());
        setDuration(player.getDuration());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [player, setCurrentTime, setDuration]);

  // Fetch lyrics dynamically when lyrics panel opens or videoId changes
  useEffect(() => {
    if (!videoId || !isLyricsOpen) return;
    async function fetchLyrics() {
      setLyricsLoading(true);
      setLyrics(null);
      try {
        const res = await fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}`);
        if (res.ok) {
          const data = await res.json();
          setLyrics(data.lyrics || null);
        }
      } catch (err) {
        console.error("Error fetching lyrics in BottomPlayer:", err);
      } finally {
        setLyricsLoading(false);
      }
    }
    fetchLyrics();
  }, [videoId, isLyricsOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl && (
          activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable ||
          activeEl.tagName === "BUTTON" ||
          activeEl.getAttribute("role") === "button"
        )
      ) {
        return;
      }

      const store = usePlayerStore.getState();
      const currentTrackObj = {
        videoId: store.videoId,
        title: store.title,
        artist: store.artist,
        thumbnail: store.thumbnail,
        duration: store.duration
      };

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (store.player) {
            if (store.isPlaying) {
              store.player.pauseVideo();
              store.setIsPlaying(false);
            } else {
              store.player.playVideo();
              store.setIsPlaying(true);
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (store.player) {
            store.player.seekTo(Math.max(store.player.getCurrentTime() - 5, 0), true);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (store.player) {
            store.player.seekTo(Math.min(store.player.getCurrentTime() + 5, store.duration), true);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          store.setVolume(Math.min(store.volume + 5, 100));
          break;
        case "ArrowDown":
          e.preventDefault();
          store.setVolume(Math.max(store.volume - 5, 0));
          break;
        case "KeyL":
          e.preventDefault();
          if (currentTrackObj.videoId) {
            void store.toggleLike(currentTrackObj);
          }
          break;
        case "KeyN":
          e.preventDefault();
          store.nextTrack();
          break;
        case "KeyP":
          e.preventDefault();
          store.prevTrack();
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const speedOptions = [0.5, 1.0, 1.25, 1.5, 2.0];
  const timerOptions = [
    { label: "Off", value: null },
    { label: "5 min", value: 5 },
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "60 min", value: 60 },
  ];

  if (!mounted || !title) return null;

  const art = thumbnail || "https://placehold.co/100x100/111/fff?text=♪";
  const progressStyle = `linear-gradient(to right, #8B5CF6 ${progress}%, rgba(255,255,255,0.06) ${progress}%)`;
  const volumeStyle = `linear-gradient(to right, rgba(255,255,255,0.7) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.06) ${isMuted ? 0 : volume}%)`;

  const dropdownStyle: React.CSSProperties = {
    background: "rgba(10, 10, 14, 0.95)",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.85)",
  };

  return (
    <>
      {/* ── DESKTOP/TABLET PLAYER: Floating Glass Capsule Dock ── */}
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.15 }}
        className="hidden md:grid fixed left-1/2 bottom-8 -translate-x-1/2 w-[calc(100%-4rem)] max-w-5xl h-20 grid-cols-[1.2fr_1.6fr_1.2fr] items-center px-6 rounded-[28px] select-none z-50 bg-zinc-950/80 backdrop-blur-3xl border border-white/[0.06] shadow-[0_32px_60px_-15px_rgba(0,0,0,0.9)]"
      >
        {/* Left Side: Track Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <motion.div
            animate={isPlaying ? { y: [0, -2, 0] } : { y: 0 }}
            transition={
              isPlaying
                ? { duration: 5, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
            className="relative shrink-0"
          >
            <div
              className="w-13 h-13 rounded-2xl overflow-hidden bg-zinc-900 shadow-lg"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: isPlaying ? "0 8px 24px rgba(139,92,246,0.15)" : undefined,
              }}
            >
              <SafeImage src={art} videoId={videoId} alt={title} className="w-full h-full object-cover" />
            </div>
          </motion.div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-zinc-100 truncate tracking-tight">{title}</h3>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-medium">{artist}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => toggleLike(currentTrack)}
            className="text-zinc-500 hover:text-pink-400 p-2 rounded-xl transition duration-150 active:scale-90"
            aria-label={isLiked ? "Unlike song" : "Like song"}
          >
            <Heart
              size={15}
              fill={isLiked ? "#ec4899" : "none"}
              className={isLiked ? "text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]" : ""}
            />
          </motion.button>
        </div>

        {/* Center Side: Media Controls & Timeline */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <IconBtn onClick={toggleShuffle} active={isShuffle} label="Shuffle">
              <Shuffle size={13} />
            </IconBtn>

            <button
              onClick={prevTrack}
              className="p-2 text-zinc-400 hover:text-white rounded-xl active:scale-90 transition duration-150"
              aria-label="Previous"
            >
              <SkipBack size={15} fill="currentColor" />
            </button>

            {/* Play Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-md hover:shadow-lg transition-all"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={15} fill="currentColor" />
              ) : (
                <Play size={15} fill="currentColor" className="ml-0.5" />
              )}
            </motion.button>

            <button
              onClick={nextTrack}
              className="p-2 text-zinc-400 hover:text-white rounded-xl active:scale-90 transition duration-150"
              aria-label="Next"
            >
              <SkipForward size={15} fill="currentColor" />
            </button>

            <IconBtn onClick={toggleRepeat} active={isRepeat} label="Repeat">
              <Repeat size={13} />
            </IconBtn>
          </div>

          {/* Timeline slider */}
          <div className="flex items-center gap-3 w-full max-w-[420px] text-[10px] text-zinc-500 font-bold">
            <span className="w-8 text-right font-mono tabular-nums">{formatTime(currentTime)}</span>
            <input
              ref={progressRef}
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => {
                if (!player) return;
                player.seekTo((Number(e.target.value) / 100) * duration, true);
              }}
              className="flex-1 h-1 rounded-full cursor-pointer outline-none transition-all"
              style={{ background: progressStyle, appearance: "none" }}
              aria-label="Seek"
            />
            {isPlaying ? (
              <div className="flex items-end gap-[1.5px] h-3 px-1 text-purple-400 select-none shrink-0">
                <span className="w-[1.5px] h-[35%] bg-purple-500 rounded-full animate-[pulse_0.8s_infinite]" />
                <span className="w-[1.5px] h-[80%] bg-purple-400 rounded-full animate-[pulse_1s_infinite_0.2s]" />
                <span className="w-[1.5px] h-[50%] bg-purple-500 rounded-full animate-[pulse_0.9s_infinite_0.1s]" />
              </div>
            ) : (
              <span className="w-8 font-mono tabular-nums">{formatTime(duration)}</span>
            )}
          </div>
        </div>

        {/* Right Side: Extra Controls */}
        <div className="flex items-center justify-end gap-1">
          {/* Lyrics Toggle */}
          <IconBtn onClick={() => setIsLyricsOpen(!isLyricsOpen)} active={isLyricsOpen} label="Lyrics">
            <Mic size={13} />
          </IconBtn>

          {/* Playback speed selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowTimerMenu(false);
                setShowDeviceMenu(false);
              }}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-[9px] font-bold transition duration-150 border active:scale-95",
                showSpeedMenu
                  ? "text-white bg-white/[0.08] border-white/[0.08]"
                  : "text-zinc-500 hover:text-zinc-200 border-transparent hover:bg-white/[0.03]"
              )}
            >
              {playbackSpeed}×
            </button>
            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full mb-3 right-0 rounded-2xl p-1.5 w-24 space-y-0.5"
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
                        "w-full text-center py-1.5 text-[11px] rounded-[10px] transition font-semibold",
                        playbackSpeed === opt
                          ? "text-white bg-white/[0.08]"
                          : "text-zinc-500 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      {opt}×
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTimerMenu(!showTimerMenu);
                setShowSpeedMenu(false);
                setShowDeviceMenu(false);
              }}
              className={cn(
                "p-2 rounded-xl transition duration-150 flex items-center gap-1 active:scale-95 border border-transparent",
                sleepTimer !== null
                  ? "text-white bg-white/[0.08] border-white/[0.08]"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"
              )}
            >
              <Timer size={13} />
              {sleepTimer !== null && (
                <span className="text-[9px] font-black">{sleepTimer}m</span>
              )}
            </button>
            <AnimatePresence>
              {showTimerMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full mb-3 right-0 rounded-2xl p-1.5 w-24 space-y-0.5"
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
                        "w-full text-center py-1.5 text-[11px] rounded-[10px] transition font-semibold",
                        sleepTimer === opt.value
                          ? "text-white bg-white/[0.08]"
                          : "text-zinc-500 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Connect Device */}
          <div className="relative">
            <IconBtn
              onClick={() => {
                setShowDeviceMenu(!showDeviceMenu);
                setShowSpeedMenu(false);
                setShowTimerMenu(false);
              }}
              active={showDeviceMenu}
              label="Devices"
            >
              <Laptop size={13} />
            </IconBtn>
            <AnimatePresence>
              {showDeviceMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-3 right-0 rounded-2xl p-3 w-52 space-y-2"
                  style={dropdownStyle}
                >
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Connect Device</p>
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white">
                    <Laptop size={13} />
                    <span className="text-[11px] font-bold">This Device</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-zinc-200 cursor-pointer transition-all">
                    <Music2 size={13} />
                    <span className="text-[11px] font-semibold">Web Audio Engine</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Queue Drawer Button */}
          <IconBtn onClick={toggleQueue} active={isQueueOpen} label="Play Queue">
            <List size={13} />
          </IconBtn>

          {/* Mute and Volume Bar */}
          <div className="flex items-center gap-2 ml-1">
            <button
              onClick={toggleMute}
              className="text-zinc-500 hover:text-zinc-200 p-1.5 transition duration-150"
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
              className="w-16 h-1 cursor-pointer outline-none rounded-full"
              style={{ background: volumeStyle, appearance: "none" }}
              aria-label="Volume"
            />
          </div>
        </div>
      </motion.div>

      {/* ── MOBILE MINI PLAYER ── */}
      <div
        className="md:hidden fixed bottom-[72px] left-3 right-3 h-14 rounded-2xl bg-zinc-950/80 border border-white/[0.08] backdrop-blur-3xl flex items-center justify-between px-3.5 z-40 select-none cursor-pointer shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
        onClick={() => setIsMobileExpanded(true)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            <SafeImage src={art} videoId={videoId} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-bold text-white truncate leading-tight tracking-tight">{title}</h4>
            <p className="text-[9px] text-zinc-555 truncate mt-0.5 font-medium">{artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={togglePlay}
            className="w-8.5 h-8.5 rounded-full bg-white flex items-center justify-center text-black"
          >
            {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
          </motion.button>
          <button onClick={nextTrack} className="p-2 text-zinc-400 hover:text-white">
            <SkipForward size={14} fill="currentColor" />
          </button>
        </div>

        {/* Progress Underline */}
        <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <AnimatePresence>
        {isMobileExpanded && (
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 150) {
                setIsMobileExpanded(false);
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.55 }}
            className="md:hidden fixed inset-0 z-[60] flex flex-col select-none overflow-hidden bg-[#07070A] touch-none"
          >
            {/* Pull Dismiss Indicator Bar */}
            <div className="absolute top-2 left-0 right-0 z-20 flex justify-center py-2">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Blurred background artwork with dynamic rotating glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <SafeImage
                src={art}
                videoId={videoId}
                alt=""
                className="w-full h-full object-cover scale-150 blur-[100px] opacity-[0.12]"
              />
              <div className="absolute inset-0 bg-[#07070A]/85" />
              {/* Active ambient glow orb rotating */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.18),rgba(236,72,153,0.12),transparent_50%)]"
              />
            </div>

            <div className="relative z-10 flex flex-col h-full px-6 pt-10 justify-between pb-8">
              {/* Header */}
              <div className="flex items-center justify-between py-4">
                <button
                  onClick={() => setIsMobileExpanded(false)}
                  className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-400 active:scale-90"
                >
                  <ChevronDown size={18} />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Now Playing
                </span>
                <button
                  onClick={() => setIsLyricsOpen(true)}
                  className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-400 active:scale-90"
                >
                  <Mic size={14} />
                </button>
              </div>

              {/* Album art with subtle interactive float */}
              <div className="flex-1 flex items-center justify-center py-4">
                <motion.div
                  animate={{ scale: isPlaying ? 1 : 0.93 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22 }}
                  className="w-68 h-68 rounded-[32px] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.85)] border border-white/[0.08]"
                >
                  <SafeImage src={art} videoId={videoId} alt="" className="w-full h-full object-cover" />
                </motion.div>
              </div>

              {/* Track info & Playback sliders */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-4 text-left">
                    <h2 className="text-xl font-bold text-white truncate leading-tight tracking-tight">
                      {title}
                    </h2>
                    <p className="text-xs text-zinc-450 font-medium truncate mt-1">{artist}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => toggleLike(currentTrack)}
                    className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <Heart
                      size={18}
                      fill={isLiked ? "#ec4899" : "none"}
                      className={isLiked ? "text-pink-400" : "text-zinc-550"}
                    />
                  </motion.button>
                </div>

                {/* Progress Timeline */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => {
                      if (!player) return;
                      player.seekTo((Number(e.target.value) / 100) * duration, true);
                    }}
                    className="w-full h-1 rounded-full cursor-pointer outline-none"
                    style={{ background: progressStyle, appearance: "none" }}
                    aria-label="Seek"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Major controls row */}
                <div className="flex items-center justify-between py-1 px-1">
                  <button
                    onClick={toggleShuffle}
                    className={cn("p-2", isShuffle ? "text-purple-400" : "text-zinc-650")}
                  >
                    <Shuffle size={18} />
                  </button>

                  <button onClick={prevTrack} className="p-2 text-zinc-300">
                    <SkipBack size={22} fill="currentColor" />
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black shadow-lg"
                  >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                  </motion.button>

                  <button onClick={nextTrack} className="p-2 text-zinc-300">
                    <SkipForward size={22} fill="currentColor" />
                  </button>

                  <button
                    onClick={toggleRepeat}
                    className={cn("p-2", isRepeat ? "text-purple-400" : "text-zinc-650")}
                  >
                    <Repeat size={18} />
                  </button>
                </div>

                {/* Mobile Volume Control Slider */}
                <div className="flex items-center gap-3 px-1.5 py-1">
                  <button
                    onClick={toggleMute}
                    className="text-zinc-500 hover:text-zinc-300 transition"
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-1 cursor-pointer outline-none rounded-full"
                    style={{ background: volumeStyle, appearance: "none" }}
                    aria-label="Mobile Volume Control"
                  />
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 text-[10px] font-medium text-zinc-600">
                  <div className="flex items-center gap-1.5">
                    <Gauge size={12} className="text-zinc-700" />
                    <span>{playbackSpeed}× speed</span>
                  </div>
                  <button
                    onClick={() => {
                      toggleQueue();
                      setIsMobileExpanded(false);
                    }}
                    className="flex items-center gap-1.5 hover:text-white"
                  >
                    <List size={12} />
                    <span>Up Next</span>
                  </button>
                  {sleepTimer !== null && (
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <Timer size={12} />
                      <span>{sleepTimer}m sleep</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sliding Glass Lyrics Overlay ── */}
      <AnimatePresence>
        {isLyricsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-3xl px-6 select-none"
          >
            {/* Ambient blur orbs */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/[0.08] blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-pink-900/[0.06] blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-2xl w-full flex flex-col h-[75vh] justify-between">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08]">
                    <SafeImage
                      src={art}
                      videoId={videoId}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-white leading-tight">{title}</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{artist}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLyricsOpen(false)}
                  className="px-4.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-[10px] font-bold text-zinc-400 hover:text-white transition"
                >
                  Close
                </button>
              </div>

              {/* Dynamic scrollable content */}
              <div className="flex-1 overflow-y-auto my-8 scrollbar-none space-y-6 text-center px-4 py-2">
                {lyricsLoading ? (
                  <div className="space-y-4 animate-pulse pt-10">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-6 bg-white/5 rounded-md w-3/4 mx-auto" />
                    ))}
                  </div>
                ) : lyrics && lyrics.length > 0 ? (
                  <div className="space-y-5 py-4">
                    {lyrics.map((line, idx) => (
                      <p
                        key={idx}
                        className="text-base sm:text-lg font-bold text-zinc-350 hover:text-white transition-all duration-200"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 pt-10">
                    <p className="text-lg font-bold text-zinc-400">
                      Lyrics not available for this track
                    </p>
                    <p className="text-xs text-zinc-650">
                      We couldn&apos;t retrieve lines for &quot;{title}&quot;.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer details */}
              <div className="text-center text-[9px] text-zinc-700 tracking-widest font-mono border-t border-white/[0.05] pt-4 uppercase">
                PLAYING FROM SYSTEM • SOUND HYDRATED VIA YTENGINE
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Drawer Component */}
      {isQueueOpen && <QueueDrawer />}
    </>
  );
}
