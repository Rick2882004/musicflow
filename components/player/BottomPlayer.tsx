"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { useState, useEffect, memo } from "react";
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
import { useSmartQueue } from "@/hooks/useSmartQueue";
import { useMediaSession, notifyMediaSessionSeek, updateMediaSessionPosition } from "@/hooks/useMediaSession";
import { playAudioAnchor, pauseAudioAnchor } from "@/lib/audio-anchor";
import { markIntentionalUserPause, clearIntentionalUserPause } from "@/lib/playback-intent";
import { logBgDiag } from "@/lib/bg-diagnostics";
import Link from "next/link";
import { useRouter } from "next/navigation";


function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Isolated Desktop Progress Bar — only rerenders on time tick
const DesktopProgressBar = memo(function DesktopProgressBar() {
  const { currentTime, duration, player, isPlaying } = usePlayerStore(
    useShallow((s) => ({
      currentTime: s.currentTime,
      duration: s.duration,
      player: s.player,
      isPlaying: s.isPlaying,
    }))
  );
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressStyle = `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${progress}%, rgb(39 39 42) ${progress}%, rgb(39 39 42) 100%)`;

  return (
    <div className="flex items-center gap-3 w-full max-w-[420px] text-[10px] text-zinc-500 font-bold">
      <span className="w-8 text-right font-mono tabular-nums">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={progress}
        onChange={(e) => {
          if (!player || duration <= 0) return;
          const target = (Number(e.target.value) / 100) * duration;
          player.seekTo(target, true);
          usePlayerStore.getState().setCurrentTime(target);
          notifyMediaSessionSeek(target, duration, usePlayerStore.getState().playbackSpeed);
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
  );
});

// Isolated Mobile Mini Progress Underline
const MobileMiniProgressUnderline = memo(function MobileMiniProgressUnderline() {
  const { currentTime, duration } = usePlayerStore(
    useShallow((s) => ({
      currentTime: s.currentTime,
      duration: s.duration,
    }))
  );
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});
const MobileProgressBar = memo(function MobileProgressBar() {
  const { currentTime, duration, player } = usePlayerStore(
    useShallow((s) => ({
      currentTime: s.currentTime,
      duration: s.duration,
      player: s.player,
    }))
  );
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressStyle = `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${progress}%, rgb(39 39 42) ${progress}%, rgb(39 39 42) 100%)`;

  return (
    <div className="space-y-2">
      <input
        type="range"
        min={0}
        max={100}
        value={progress}
        onChange={(e) => {
          if (!player || duration <= 0) return;
          const target = (Number(e.target.value) / 100) * duration;
          player.seekTo(target, true);
          usePlayerStore.getState().setCurrentTime(target);
          notifyMediaSessionSeek(target, duration, usePlayerStore.getState().playbackSpeed);
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
  );
});

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
  useSmartQueue();
  useMediaSession(); // Canonical Android/iOS MediaSession integration
  const {
    videoId,
    title,
    artist,
    thumbnail,
    isQueueOpen,
    toggleQueue,
    isPlaying,
    setIsPlaying,
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
  const router = useRouter();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);

  // Controls
  const togglePlay = () => {
    if (!player) return;
    const store = usePlayerStore.getState();
    if (isPlaying) {
      logBgDiag("call-pauseVideo", { source: "BottomPlayer:togglePlay", isPlaying: true });
      markIntentionalUserPause();
      pauseAudioAnchor();
      player.pauseVideo();
      setIsPlaying(false);
      updateMediaSessionPosition(store.currentTime, store.duration, store.playbackSpeed, true);
    } else {
      logBgDiag("call-playVideo", { source: "BottomPlayer:togglePlay", isPlaying: false });
      clearIntentionalUserPause();
      playAudioAnchor();
      player.playVideo();
      setIsPlaying(true);
      updateMediaSessionPosition(store.currentTime, store.duration, store.playbackSpeed, true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // [MediaSession handlers are now managed by useMediaSession hook above]
  // Metadata is updated automatically when videoId/title/artist/thumbnail change.


  // Visibility change & Network recovery for background playback
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        const store = usePlayerStore.getState();
        if (!store.isPlaying || !store.player) return;
        try {
          const state = store.player.getPlayerState();
          // Resume if paused (2) or ended (0) or unstarted (-1)
          if (state === 2 || state === 0 || state === -1) {
            logBgDiag("call-playVideo", { source: "BottomPlayer:handleVisibilityChange", previousState: state });
            store.player.playVideo();
          }
        } catch {
          // Ignore iframe access restrictions on page background
        }
      }
    }

    function handleOnline() {
      const currentPlayer = usePlayerStore.getState().player;
      const currentlyPlaying = usePlayerStore.getState().isPlaying;
      if (currentPlayer && currentlyPlaying) {
        try {
          logBgDiag("call-playVideo", { source: "BottomPlayer:handleOnline" });
          currentPlayer.playVideo();
        } catch {
          // Ignore network reconnect recovery errors
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [isPlaying]);


  // Consolidated Global Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl && (
          activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable ||
          activeEl.getAttribute("role") === "textbox"
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
        duration: store.duration,
      };

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (store.player) {
            if (store.isPlaying) {
              logBgDiag("call-pauseVideo", { source: "BottomPlayer:Spacebar" });
              markIntentionalUserPause();
              pauseAudioAnchor();
              store.player.pauseVideo();
              store.setIsPlaying(false);
              updateMediaSessionPosition(store.currentTime, store.duration, store.playbackSpeed, true);
            } else {
              logBgDiag("call-playVideo", { source: "BottomPlayer:Spacebar" });
              clearIntentionalUserPause();
              playAudioAnchor();
              store.player.playVideo();
              store.setIsPlaying(true);
              updateMediaSessionPosition(store.currentTime, store.duration, store.playbackSpeed, true);
            }
          }
          break;
        case "KeyM":
          store.setIsMuted(!store.isMuted);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (store.player && store.duration > 0) {
            const target = Math.max(store.player.getCurrentTime() - 5, 0);
            store.player.seekTo(target, true);
            store.setCurrentTime(target);
            notifyMediaSessionSeek(target, store.duration, store.playbackSpeed);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (store.player && store.duration > 0) {
            const target = Math.min(store.player.getCurrentTime() + 5, Math.max(store.duration - 0.1, 0));
            store.player.seekTo(target, true);
            store.setCurrentTime(target);
            notifyMediaSessionSeek(target, store.duration, store.playbackSpeed);
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

  // Sleep Timer Countdown (minute interval)
  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      if (player && isPlaying) {
        logBgDiag("call-pauseVideo", { source: "BottomPlayer:sleepTimer" });
        markIntentionalUserPause();
        pauseAudioAnchor();
        player.pauseVideo();
        setIsPlaying(false);
      }
      setSleepTimer(null);
      return;
    }
    const interval = setInterval(() => {
      const current = usePlayerStore.getState().sleepTimer;
      if (current !== null) {
        setSleepTimer(current > 1 ? current - 1 : null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [sleepTimer, player, isPlaying, setSleepTimer, setIsPlaying]);

  // Polling for current track progress — ONLY when actively playing
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
        // Ignored if player is transitioning
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player, isPlaying, setCurrentTime, setDuration]);

  // Fetch lyrics dynamically when lyrics panel opens or videoId changes
  useEffect(() => {
    if (!videoId || !isLyricsOpen) return;
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
  }, [videoId, isLyricsOpen]);

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
      {/* ── DESKTOP/TABLET PLAYER: Compact Persistent Bottom Player ── */}
      <div
        className="hidden md:grid fixed bottom-0 left-0 right-0 h-[72px] grid-cols-[1.2fr_1.8fr_1.2fr] items-center px-6 select-none z-50 bg-[#09090e] border-t border-white/[0.06]"
      >
        {/* Left Side: Track Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div
              className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 shadow-md border border-white/[0.08]"
            >
              <SafeImage src={art} videoId={videoId} title={title} artist={artist} alt={title} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-zinc-100 truncate tracking-tight">{title}</h3>
            <Link
              href={`/artist/${encodeURIComponent(artist)}`}
              className="text-[10px] text-zinc-500 hover:text-purple-400 hover:underline truncate mt-0.5 font-medium block transition-colors"
            >
              {artist}
            </Link>
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
              className={isLiked ? "text-pink-400" : ""}
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
          <DesktopProgressBar />
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
      </div>

      <div
        className="md:hidden fixed bottom-[60px] left-2 right-2 h-12 rounded-lg bg-[#14141c] border border-white/[0.08] flex items-center justify-between px-2.5 z-40 select-none cursor-pointer shadow-lg"
        onClick={() => setIsMobileExpanded(true)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/5">
            <SafeImage src={art} videoId={videoId} title={title} artist={artist} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-bold text-white truncate leading-tight tracking-tight">{title}</h4>
            <p
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/artist/${encodeURIComponent(artist)}`);
              }}
              className="text-[10px] text-zinc-400 hover:text-purple-400 hover:underline truncate mt-0.5 font-medium cursor-pointer"
            >
              {artist}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black"
          >
            {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
          </motion.button>
          <button onClick={nextTrack} className="p-1.5 text-zinc-400 hover:text-white">
            <SkipForward size={14} fill="currentColor" />
          </button>
        </div>


        {/* Progress Underline */}
        <MobileMiniProgressUnderline />
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
            className="md:hidden fixed inset-0 z-[60] flex flex-col select-none overflow-hidden touch-none"
            style={{ background: "var(--mf-bg-base)" }}
          >
            {/* Pull Dismiss Indicator Bar */}
            <div className="absolute top-2 left-0 right-0 z-20 flex justify-center py-2">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Clean dark backdrop */}
            <div className="absolute inset-0 bg-[#09090e] pointer-events-none" />


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
                  <SafeImage src={art} videoId={videoId} title={title} artist={artist} alt="" className="w-full h-full object-cover" />
                </motion.div>
              </div>

              {/* Track info & Playback sliders */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-4 text-left">
                    <h2 className="text-xl font-bold text-white truncate leading-tight tracking-tight">
                      {title}
                    </h2>
                    <Link
                      href={`/artist/${encodeURIComponent(artist)}`}
                      onClick={() => setIsMobileExpanded(false)}
                      className="text-xs text-zinc-400 hover:text-purple-400 hover:underline font-medium truncate mt-1 block transition-colors"
                    >
                      {artist}
                    </Link>
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
                <MobileProgressBar />

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
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/98 backdrop-blur-md px-6 select-none"
          >

            <div className="relative z-10 max-w-2xl w-full flex flex-col h-[75vh] justify-between">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08]">
                    <SafeImage
                      src={art}
                      videoId={videoId}
                      title={title}
                      artist={artist}
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
