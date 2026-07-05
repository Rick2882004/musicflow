"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  Mic2,
  Maximize2,
  Gauge,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import QueueDrawer from "./QueueDrawer";

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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
    }))
  );

  const currentTrack = { videoId, title, artist, thumbnail, duration };
  const isLiked = likedSongs.some((song) => song.videoId === videoId);

  const [isMuted, setIsMuted] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressRef = useRef<HTMLInputElement>(null);

  // Sleep Timer Countdown Logic
  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      if (player && isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      }
      setSleepTimer(null);
      alert("Sleep timer finished. Playback stopped.");
      return;
    }

    const timer = setTimeout(() => {
      setSleepTimer(sleepTimer - 1);
    }, 60000);

    return () => clearTimeout(timer);
  }, [sleepTimer, player, isPlaying, setSleepTimer, setIsPlaying]);

  // Player Polling Logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === "function") {
        setCurrentTime(player.getCurrentTime());
        setDuration(player.getDuration());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, setCurrentTime, setDuration]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekDelta(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekDelta(5);
          break;
        case "ArrowUp":
          e.preventDefault();
          adjustVolume(5);
          break;
        case "ArrowDown":
          e.preventDefault();
          adjustVolume(-5);
          break;
        case "KeyL":
          e.preventDefault();
          toggleLike(currentTrack);
          break;
        case "KeyN":
          e.preventDefault();
          nextTrack();
          break;
        case "KeyP":
          e.preventDefault();
          prevTrack();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videoId, player, isPlaying, volume, isMuted, likedSongs]);

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
    const current = player.getCurrentTime();
    const dest = Math.min(Math.max(current + delta, 0), duration);
    player.seekTo(dest, true);
  };

  const adjustVolume = (delta: number) => {
    const nextVolume = Math.min(Math.max(volume + delta, 0), 100);
    setVolume(nextVolume);
  };

  const toggleMute = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const setVolume = (value: number) => {
    setVolumeState(value);
    if (player) {
      player.setVolume(value);
    }
  };

  const speedOptions = [0.5, 1.0, 1.25, 1.5, 2.0];
  const timerOptions = [
    { label: "Off", value: null },
    { label: "5 Min", value: 5 },
    { label: "15 Min", value: 15 },
    { label: "30 Min", value: 30 },
    { label: "60 Min", value: 60 },
  ];

  const progressStyle = `linear-gradient(to right, #9333ea ${progress}%, rgba(255,255,255,0.06) ${progress}%)`;
  const volumeStyle = `linear-gradient(to right, #ffffff ${isMuted ? 0 : volume}%, rgba(255,255,255,0.06) ${isMuted ? 0 : volume}%)`;

  if (!title) return null;

  return (
    <>
      {/* ---- Desktop/Tablet Player ---- */}
      <div className="hidden md:grid fixed left-4 right-4 bottom-4 h-24 grid-cols-3 items-center px-6 rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-white/5 shadow-2xl z-50 select-none">

        {/* Left Side: Track Info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-md border border-white/5 shrink-0">
            <img
              src={thumbnail || "https://placehold.co/100x100/png"}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">{title}</h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{artist}</p>
          </div>
          <button
            onClick={() => toggleLike(currentTrack)}
            className="text-zinc-400 hover:text-pink-500 transition shrink-0 p-1.5"
            aria-label={isLiked ? "Unlike song" : "Like song"}
          >
            <Heart size={16} fill={isLiked ? "#ec4899" : "none"} className={isLiked ? "text-pink-500" : ""} />
          </button>
        </div>

        {/* Center Side: Media Controls */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={cn("p-1.5 rounded transition text-zinc-400 hover:text-white", isShuffle && "text-green-400 hover:text-green-300")}
              aria-label="Shuffle"
            >
              <Shuffle size={15} />
            </button>
            <button
              onClick={prevTrack}
              className="p-1.5 text-zinc-400 hover:text-white transition"
              aria-label="Previous"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white hover:scale-105 text-black flex items-center justify-center transition active:scale-95 shadow-md"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              onClick={nextTrack}
              className="p-1.5 text-zinc-400 hover:text-white transition"
              aria-label="Next"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button
              onClick={toggleRepeat}
              className={cn("p-1.5 rounded transition text-zinc-400 hover:text-white", isRepeat && "text-green-400 hover:text-green-300")}
              aria-label="Repeat"
            >
              <Repeat size={15} />
            </button>
          </div>

          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-3 w-full max-w-xl text-[10px] text-zinc-500 font-bold">
            <span className="w-8 text-right font-mono">{formatTime(currentTime)}</span>
            <input
              ref={progressRef}
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => {
                if (!player) return;
                const pct = Number(e.target.value);
                player.seekTo((pct / 100) * duration, true);
              }}
              className="flex-1 h-1.5 rounded-full appearance-none bg-zinc-800 outline-none cursor-pointer"
              style={{ background: progressStyle }}
            />
            <span className="w-8 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Side: Extras Controls */}
        <div className="flex items-center justify-end gap-3.5">
          {/* Playback speed trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowTimerMenu(false);
              }}
              className={cn("p-1.5 text-zinc-400 hover:text-white transition rounded-lg hover:bg-white/5", showSpeedMenu && "text-purple-400 bg-white/5")}
              aria-label="Playback speed"
            >
              <Gauge size={16} />
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-10 right-0 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl p-1 w-24">
                {speedOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setPlaybackSpeed(opt);
                      setShowSpeedMenu(false);
                    }}
                    className={cn("w-full text-center py-1.5 text-[10px] rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition font-semibold", playbackSpeed === opt && "text-purple-400 bg-purple-500/10")}
                  >
                    {opt}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sleep Timer Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTimerMenu(!showTimerMenu);
                setShowSpeedMenu(false);
              }}
              className={cn("p-1.5 text-zinc-400 hover:text-white transition rounded-lg hover:bg-white/5 flex items-center gap-1", sleepTimer !== null && "text-purple-400 bg-white/5")}
              aria-label="Sleep timer"
            >
              <Timer size={16} />
              {sleepTimer !== null && <span className="text-[9px] font-bold">{sleepTimer}m</span>}
            </button>
            {showTimerMenu && (
              <div className="absolute bottom-10 right-0 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl p-1 w-24">
                {timerOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setSleepTimer(opt.value);
                      setShowTimerMenu(false);
                    }}
                    className={cn("w-full text-center py-1.5 text-[10px] rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition font-semibold", sleepTimer === opt.value && "text-purple-400 bg-purple-500/10")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleQueue}
            className={cn("p-1.5 text-zinc-400 hover:text-white transition rounded-lg hover:bg-white/5", isQueueOpen && "text-purple-400 bg-white/5")}
            aria-label="Open queue drawer"
          >
            <List size={16} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white transition p-1.5"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 h-1 rounded-full appearance-none bg-zinc-800 outline-none cursor-pointer"
              style={{ background: volumeStyle }}
              aria-label="Volume slider"
            />
          </div>
        </div>
      </div>

      {/* ---- Mobile Mini Player ---- */}
      <div
        className="md:hidden fixed bottom-16 left-2 right-2 h-16 rounded-2xl glass border border-white/5 p-2 flex items-center justify-between z-40 select-none shadow-xl cursor-pointer"
        onClick={() => setIsMobileExpanded(true)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={thumbnail || "/logo.png"}
            alt=""
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-zinc-200 truncate">{title}</h4>
            <p className="text-[10px] text-zinc-500 truncate">{artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={togglePlay}
            className="p-2 text-zinc-200 hover:text-white"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            onClick={nextTrack}
            className="p-2 text-zinc-200 hover:text-white"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>

        {/* Underline progress bar indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/5 overflow-hidden rounded-b-2xl">
          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ---- Mobile Full Screen Player View ---- */}
      <AnimatePresence>
        {isMobileExpanded && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="md:hidden fixed inset-0 bg-[#07070a] z-50 flex flex-col justify-between p-8 select-none"
          >
            {/* Header / Minimize button */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <button
                onClick={() => setIsMobileExpanded(false)}
                className="text-zinc-500 hover:text-white p-2"
                aria-label="Minimize"
              >
                <Maximize2 size={16} className="rotate-180" />
              </button>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Now Playing</span>
              <div className="w-8" />
            </div>

            {/* Album Cover art */}
            <div className="flex-grow flex items-center justify-center py-6">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border border-white/5 animate-pulse-slow">
                <img
                  src={thumbnail || "/logo.png"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Metadata & Liked Song button */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-grow pr-4">
                  <h2 className="text-xl font-bold text-white truncate">{title}</h2>
                  <p className="text-sm text-zinc-400 truncate mt-1">{artist}</p>
                </div>
                <button
                  onClick={() => toggleLike(currentTrack)}
                  className="text-zinc-400 p-2"
                >
                  <Heart size={20} fill={isLiked ? "#ec4899" : "none"} className={isLiked ? "text-pink-500" : ""} />
                </button>
              </div>

              {/* Progress Slider */}
              <div className="space-y-2 text-[10px] text-zinc-500 font-bold">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => {
                    if (!player) return;
                    const pct = Number(e.target.value);
                    player.seekTo((pct / 100) * duration, true);
                  }}
                  className="w-full h-1 rounded-full appearance-none bg-zinc-800 outline-none cursor-pointer"
                  style={{ background: progressStyle }}
                />
                <div className="flex justify-between font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Media Controls */}
              <div className="flex items-center justify-around py-4">
                <button
                  onClick={toggleShuffle}
                  className={cn("p-2", isShuffle ? "text-green-400" : "text-zinc-500")}
                >
                  <Shuffle size={18} />
                </button>
                <button onClick={prevTrack} className="p-2 text-white">
                  <SkipBack size={22} fill="currentColor" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition"
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={nextTrack} className="p-2 text-white">
                  <SkipForward size={22} fill="currentColor" />
                </button>
                <button
                  onClick={toggleRepeat}
                  className={cn("p-2", isRepeat ? "text-green-400" : "text-zinc-500")}
                >
                  <Repeat size={18} />
                </button>
              </div>

              {/* Playback speed trigger */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs font-semibold text-zinc-400">
                <div className="flex items-center gap-1">
                  <Gauge size={14} />
                  Speed: {playbackSpeed}x
                </div>
                {sleepTimer !== null && (
                  <div className="flex items-center gap-1 text-purple-400">
                    <Timer size={14} />
                    Timer: {sleepTimer}m
                  </div>
                )}
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
