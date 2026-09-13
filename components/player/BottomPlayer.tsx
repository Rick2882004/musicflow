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
  ListMusic,
  Timer,
  Mic,
  Laptop,
  Music2,
  Radio,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { useSmartQueue } from "@/hooks/useSmartQueue";
import { useAIRadio } from "@/hooks/useAIRadio";
import { useRadioStore } from "@/store/radio-store";
import { useMediaSession, notifyMediaSessionSeek, updateMediaSessionPosition } from "@/hooks/useMediaSession";
import { playAudioAnchor, pauseAudioAnchor } from "@/lib/audio-anchor";
import { markIntentionalUserPause, clearIntentionalUserPause } from "@/lib/playback-intent";
import { logBgDiag } from "@/lib/bg-diagnostics";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatTime(secs: number) {
  if (!secs || isNaN(secs)) return "0:00";
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
  const progressStyle = `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${progress}%, rgba(255, 255, 255, 0.08) ${progress}%, rgba(255, 255, 255, 0.08) 100%)`;

  return (
    <div className="flex items-center gap-2.5 w-full max-w-[480px] text-[11px] text-zinc-400 font-medium select-none">
      <span className="w-9 text-right font-mono text-[10px] tabular-nums text-zinc-400">
        {formatTime(currentTime)}
      </span>

      {/* Interactive Seek Bar */}
      <div className="relative flex-1 flex items-center h-4 group cursor-pointer">
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
          className="w-full h-[3px] group-hover:h-[4px] rounded-full cursor-pointer outline-none transition-all"
          style={{ background: progressStyle, appearance: "none" }}
          aria-label="Seek track position"
        />
      </div>

      {isPlaying ? (
        <div className="flex items-end gap-[2px] h-3.5 px-1 select-none shrink-0" title="Playing">
          <span className="w-[2px] h-[35%] bg-purple-400 rounded-full animate-[pulse_0.8s_infinite]" />
          <span className="w-[2px] h-[85%] bg-purple-300 rounded-full animate-[pulse_1s_infinite_0.2s]" />
          <span className="w-[2px] h-[55%] bg-purple-400 rounded-full animate-[pulse_0.9s_infinite_0.1s]" />
        </div>
      ) : (
        <span className="w-9 font-mono text-[10px] tabular-nums text-zinc-500">
          {formatTime(duration)}
        </span>
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
        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-300 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});

// Reusable Player Icon Button with polished hover & active states
function PlayerIconBtn({
  onClick,
  active,
  activeColor = "text-purple-400",
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
      title={label}
      className={cn(
        "relative p-2 rounded-xl transition-all duration-150 active:scale-90 flex items-center justify-center outline-none",
        "focus-visible:ring-1 focus-visible:ring-purple-400/50",
        active
          ? `${activeColor} bg-purple-500/10 border border-purple-500/20`
          : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] border border-transparent",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function BottomPlayer() {
  useSmartQueue();
  useAIRadio();
  useMediaSession(); // Canonical MediaSession integration
  const { radioActive, toggleRadio } = useRadioStore();
  const {
    videoId,
    title,
    artist,
    thumbnail,
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
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  // Play/Pause toggle with audio-anchor integration
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
          // Ignore iframe access restrictions
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
          // Ignore network recovery errors
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Global Keyboard Shortcuts
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

  // Polling for track progress — ONLY when actively playing
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
        // Ignored
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player, isPlaying, setCurrentTime, setDuration]);

  const speedOptions = [0.5, 1.0, 1.25, 1.5, 2.0];
  const timerOptions = [
    { label: "Off", value: null },
    { label: "5 min", value: 5 },
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "60 min", value: 60 },
  ];

  if (!mounted || !title) return null;

  const SVG_TRACK_FALLBACK =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23121216'/><path d='M44 34 v24 a7 7 0 1 1 -6 -6.9 v-17.1 l18 -5 v19 a7 7 0 1 1 -6 -6.9 v-13.1 z' fill='%23a855f7'/></svg>";
  const art = thumbnail || SVG_TRACK_FALLBACK;
  const volumePercent = isMuted ? 0 : volume;
  const volumeStyle = `linear-gradient(to right, rgb(168, 85, 247) ${volumePercent}%, rgba(255,255,255,0.08) ${volumePercent}%)`;

  const dropdownStyle: React.CSSProperties = {
    background: "rgba(12, 12, 18, 0.96)",
    backdropFilter: "blur(32px)",
    WebkitBackdropFilter: "blur(32px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.85)",
  };

  return (
    <>
      {/* ── DESKTOP/TABLET PLAYER: Premium Floating/Docked Player Dock ── */}
      <div
        className={cn(
          "hidden md:grid fixed bottom-0 left-0 right-0 h-[72px] select-none z-50",
          "grid-cols-[1.2fr_1.8fr_1.2fr] items-center px-6",
          "bg-[#09090d]/95 backdrop-blur-2xl border-t border-white/[0.06]",
          "shadow-[0_-8px_32px_rgba(0,0,0,0.6)]"
        )}
      >
        {/* Subtle top edge ambient highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent pointer-events-none" />

        {/* ── LEFT: Track Metadata & Artwork ── */}
        <div className="flex items-center gap-3.5 min-w-0 pr-2">
          {/* Album Artwork */}
          <div
            onClick={() => router.push("/now-playing")}
            className="relative shrink-0 cursor-pointer group"
            title="Open Now Playing"
          >
            <div className="w-[50px] h-[50px] rounded-xl overflow-hidden bg-zinc-900 shadow-md border border-white/[0.08] group-hover:border-purple-500/50 transition-all duration-200 relative">
              <SafeImage
                src={art}
                videoId={videoId}
                title={title}
                artist={artist}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                <Maximize2 size={16} className="text-white" />
              </div>
            </div>
          </div>

          {/* Track Titles */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h3
              onClick={() => router.push("/now-playing")}
              className="text-[13px] font-bold text-white truncate tracking-tight cursor-pointer hover:text-purple-300 transition-colors"
              title={title}
            >
              {title}
            </h3>
            <Link
              href={`/artist/${encodeURIComponent(artist)}`}
              className="text-[11px] text-zinc-400 hover:text-purple-400 hover:underline truncate mt-0.5 font-medium transition-colors"
              title={artist}
            >
              {artist}
            </Link>
          </div>
        </div>

        {/* ── CENTER: Playback Controls & Timeline ── */}
        <div className="flex flex-col items-center justify-center gap-1.5 px-2">
          {/* Controls row */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PlayerIconBtn onClick={toggleShuffle} active={isShuffle} label="Shuffle">
              <Shuffle size={14} />
            </PlayerIconBtn>

            <button
              onClick={prevTrack}
              className="p-2 text-zinc-400 hover:text-white rounded-xl active:scale-90 transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-purple-400/50"
              aria-label="Previous track"
              title="Previous"
            >
              <SkipBack size={16} fill="currentColor" />
            </button>

            {/* Play/Pause Button (Primary Focal Point) */}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-[0_2px_14px_rgba(255,255,255,0.22)] hover:shadow-[0_4px_18px_rgba(255,255,255,0.32)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </motion.button>

            <button
              onClick={nextTrack}
              className="p-2 text-zinc-400 hover:text-white rounded-xl active:scale-90 transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-purple-400/50"
              aria-label="Next track"
              title="Next"
            >
              <SkipForward size={16} fill="currentColor" />
            </button>

            <PlayerIconBtn onClick={toggleRepeat} active={isRepeat} label="Repeat">
              <Repeat size={14} />
            </PlayerIconBtn>

            <PlayerIconBtn
              onClick={toggleRadio}
              active={radioActive}
              label={radioActive ? "AI Radio (Active)" : "AI Radio"}
            >
              <Radio size={14} className={radioActive ? "animate-pulse text-purple-400" : ""} />
            </PlayerIconBtn>
          </div>

          {/* Timeline slider */}
          <DesktopProgressBar />
        </div>

        {/* ── RIGHT: Like, Volume, Queue & Utilities ── */}
        <div className="flex items-center justify-end gap-1.5 pl-2">
          {/* Like Button */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={() => toggleLike(currentTrack)}
            className="p-2 rounded-xl text-zinc-400 hover:text-pink-400 hover:bg-white/[0.05] transition-all duration-150 active:scale-90 outline-none focus-visible:ring-1 focus-visible:ring-purple-400/50"
            aria-label={isLiked ? "Unlike song" : "Like song"}
            title={isLiked ? "Liked (L)" : "Like (L)"}
          >
            <Heart
              size={16}
              fill={isLiked ? "#ec4899" : "none"}
              className={isLiked ? "text-pink-400" : ""}
            />
          </motion.button>

          {/* Lyrics Affordance -> Opens /now-playing */}
          <PlayerIconBtn
            onClick={() => router.push("/now-playing")}
            label="Lyrics"
          >
            <Mic size={14} />
          </PlayerIconBtn>

          {/* Playback speed selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowTimerMenu(false);
                setShowDeviceMenu(false);
              }}
              title="Playback speed"
              aria-label="Playback speed"
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-150 border active:scale-95 outline-none",
                "focus-visible:ring-1 focus-visible:ring-purple-400/50",
                showSpeedMenu
                  ? "text-white bg-white/[0.08] border-white/[0.10]"
                  : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/[0.04]"
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
                  className="absolute bottom-full mb-3 right-0 rounded-2xl p-1.5 w-24 space-y-0.5 z-50"
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
                          ? "text-white bg-purple-500/20 text-purple-300"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
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
              title="Sleep timer"
              aria-label="Sleep timer"
              className={cn(
                "p-2 rounded-xl transition-all duration-150 flex items-center gap-1 active:scale-95 border border-transparent outline-none",
                "focus-visible:ring-1 focus-visible:ring-purple-400/50",
                sleepTimer !== null
                  ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <Timer size={14} />
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
                  className="absolute bottom-full mb-3 right-0 rounded-2xl p-1.5 w-24 space-y-0.5 z-50"
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
                          ? "text-white bg-purple-500/20 text-purple-300"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
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
            <PlayerIconBtn
              onClick={() => {
                setShowDeviceMenu(!showDeviceMenu);
                setShowSpeedMenu(false);
                setShowTimerMenu(false);
              }}
              active={showDeviceMenu}
              label="Devices"
            >
              <Laptop size={14} />
            </PlayerIconBtn>
            <AnimatePresence>
              {showDeviceMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-3 right-0 rounded-2xl p-3 w-52 space-y-2 z-50"
                  style={dropdownStyle}
                >
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Connect Device
                  </p>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/15 border border-purple-500/20 text-white">
                    <Laptop size={14} className="text-purple-400" />
                    <span className="text-[11px] font-bold">This Device</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all">
                    <Music2 size={14} />
                    <span className="text-[11px] font-medium">Web Audio Engine</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Up Next / Queue Button -> Open Dedicated Now Playing Page */}
          <PlayerIconBtn
            onClick={() => router.push("/now-playing")}
            label="Now Playing & Up Next Queue"
          >
            <ListMusic size={15} />
          </PlayerIconBtn>

          {/* Mute and Volume Bar */}
          <div className="flex items-center gap-1.5 ml-1 pl-1 border-l border-white/[0.05]">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-white/[0.04] transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-purple-400/50"
              aria-label={isMuted ? "Unmute (M)" : "Mute (M)"}
              title={isMuted ? "Unmute (M)" : "Mute (M)"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <div className="relative flex items-center group py-2">
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-16 lg:w-20 h-[3px] group-hover:h-[4px] cursor-pointer outline-none rounded-full transition-all"
                style={{ background: volumeStyle, appearance: "none" }}
                aria-label="Volume slider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE PLAYER: Floating Compact Mini Player ── */}
      <div
        className={cn(
          "md:hidden fixed bottom-[60px] left-2.5 right-2.5 h-[52px] rounded-2xl z-40 select-none cursor-pointer",
          "bg-[#111119]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_10px_28px_rgba(0,0,0,0.7)]",
          "flex items-center justify-between px-3"
        )}
        onClick={() => router.push("/now-playing")}
      >
        {/* Left: Artwork + Titles */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10 shadow-sm">
            <SafeImage
              src={art}
              videoId={videoId}
              title={title}
              artist={artist}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[12px] font-bold text-white truncate leading-tight tracking-tight">
              {title}
            </h4>
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

        {/* Right: Quick Controls */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={() => toggleLike(currentTrack)}
            className="p-1.5 text-zinc-400 hover:text-pink-400"
            aria-label={isLiked ? "Unlike song" : "Like song"}
          >
            <Heart
              size={15}
              fill={isLiked ? "#ec4899" : "none"}
              className={isLiked ? "text-pink-400" : ""}
            />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-md"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={13} fill="currentColor" />
            ) : (
              <Play size={13} fill="currentColor" className="ml-0.5" />
            )}
          </motion.button>

          <button
            onClick={nextTrack}
            className="p-1.5 text-zinc-400 hover:text-white"
            aria-label="Next track"
          >
            <SkipForward size={15} fill="currentColor" />
          </button>
        </div>

        {/* Progress Underline */}
        <MobileMiniProgressUnderline />
      </div>
    </>
  );
}
