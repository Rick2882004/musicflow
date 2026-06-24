'use client'
// src/components/player/BottomPlayer.tsx
// Connects to YOUR existing Zustand store — adjust import path as needed
import { usePlayerStore } from "@/store/player-store";
import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Heart, Repeat, Shuffle, List, Mic2, Maximize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import QueueDrawer from "./QueueDrawer";
// 👇 Replace with your actual Zustand store hook
// import { usePlayerStore } from '@/store/playerStore'



function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
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
  duration,

  player,

  likedSongs,
  toggleLike,

  nextTrack,
  prevTrack,

  isShuffle,
  toggleShuffle,
  isRepeat,
toggleRepeat,
} = usePlayerStore();

const currentTrack = {
  videoId,
  title,
  artist,
  thumbnail,
  duration,
};
const currentSong = currentTrack;
const isLiked = likedSongs.some(
  (song) => song.videoId === videoId
);
const [isMuted, setIsMuted] =
  useState(false);
const [isMobileExpanded, setIsMobileExpanded] = useState(false)
const progress =
  duration > 0
    ? (currentTime / duration) * 100
    : 0;
const [volume, setVolumeState] = useState(80);

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

const playNext = nextTrack;
const playPrev = prevTrack;
const setVolume = (value: number) => {
  setVolumeState(value);

  if (player) {
    player.setVolume(value);
  }
};
  const progressRef = useRef<HTMLInputElement>(null)

  const progressStyle = `linear-gradient(to right, var(--mf-brand) ${progress}%, var(--mf-bg-overlay) ${progress}%)`
  const volumeStyle   = `linear-gradient(to right, var(--mf-text-primary) ${isMuted ? 0 : volume}%, var(--mf-bg-overlay) ${isMuted ? 0 : volume}%)`
if (!title) return null
  

  return (
    <>
      {/* ---- Desktop / Tablet Player ---- */}
      <div className="mf-player" role="region" aria-label="Music player">

        {/* Left — song info */}
        <div className="mf-player__left">
          <div className="mf-player__art-wrap">
         <Image
  src={
    currentSong.thumbnail ||
    "https://placehold.co/100x100/png"
  }
              alt={`${currentSong.title} album art`}
              width={64}
              height={64}
              className="mf-player__art"
              unoptimized
            />
            <div className="mf-player__art-glow" aria-hidden="true" />
          </div>
          <div className="mf-player__meta">
            <p className="mf-player__title">{currentSong.title}</p>
            <p className="mf-player__artist">{currentSong.artist}</p>
          </div>
          <button
            onClick={() =>
  toggleLike(currentTrack)
}
            className={cn('mf-player__icon-btn', isLiked && 'mf-player__icon-btn--active')}
            aria-label={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
            aria-pressed={isLiked}
          >
            <Heart size={16} fill={isLiked ? 'var(--mf-brand)' : 'none'} />
          </button>
        </div>

        {/* Center — controls + progress */}
        <div className="mf-player__center">
          <div className="mf-player__controls">
           <button
  onClick={toggleShuffle}
  className="mf-player__icon-btn"
  style={{
    color: isShuffle
      ? "#22c55e"
      : undefined,
    filter: isShuffle
      ? "drop-shadow(0 0 8px #22c55e)"
      : "none",
  }}
  aria-label="Shuffle"
>
  <Shuffle size={15} />
</button>
            <button onClick={playPrev} className="mf-player__icon-btn" aria-label="Previous">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="mf-player__play-btn"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying
                ? <Pause size={18} fill="currentColor" />
                : <Play  size={18} fill="currentColor" />
              }
            </button>
            <button onClick={playNext} className="mf-player__icon-btn" aria-label="Next">
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button
  onClick={toggleRepeat}
  className="mf-player__icon-btn"
  style={{
    color: isRepeat
      ? "#22c55e"
      : undefined,
    filter: isRepeat
      ? "drop-shadow(0 0 8px #22c55e)"
      : "none",
  }}
  aria-label="Repeat"
>
  <Repeat size={15} />
</button>
          </div>

          <div className="mf-player__progress-wrap" aria-label="Song progress">
            <span className="mf-player__time">{formatTime(currentTime)}</span>
           <input
  ref={progressRef}
  type="range"
  min={0}
  max={100}
  value={progress}
  onChange={(e) => {
  if (!player) return;

  const value = Number(e.target.value);

  player.seekTo(
    (value / 100) * duration,
    true
  );
}}
  className="mf-player__progress"
  style={{ background: progressStyle }}
  aria-label="Seek"
/>
            <span className="mf-player__time">
  {formatTime(duration)}
</span>
          </div>
        </div>

        {/* Right — volume + extras */}
        <div className="mf-player__right">
          <button className="mf-player__icon-btn" aria-label="Lyrics">
            <Mic2 size={16} />
          </button>
          <button
  className="mf-player__icon-btn"
  aria-label="Queue"
  onClick={toggleQueue}
>
  <List size={16} />
</button>
          <button onClick={toggleMute} className="mf-player__icon-btn" aria-label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
       <input
  type="range"
  min={0}
  max={100}
  value={isMuted ? 0 : volume}
  onChange={(e) => setVolume(Number(e.target.value))}
  className="mf-player__volume"
  style={{ background: volumeStyle }}
  aria-label="Volume"
/>
        </div>
      </div>

      {/* ---- Mobile mini-player ---- */}
      <div
        className="mf-mini-player"
        role="region"
        aria-label="Music player"
        onClick={() => setIsMobileExpanded(true)}
      >
        <div className="mf-mini-player__left">
          <Image
  src={
    currentSong.thumbnail ||
    "https://placehold.co/100x100/png"
  }
            alt=""
            width={42}
            height={42}
            className="mf-mini-player__art"
            unoptimized
          />
          <div>
            <p className="mf-mini-player__title">{currentSong.title}</p>
            <p className="mf-mini-player__artist">{currentSong.artist}</p>
          </div>
        </div>
        <div className="mf-mini-player__actions" onClick={e => e.stopPropagation()}>
          <button onClick={playPrev} className="mf-player__icon-btn" aria-label="Previous">
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button onClick={togglePlay} className="mf-player__icon-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
          <button onClick={playNext} className="mf-player__icon-btn" aria-label="Next">
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>
        {/* Progress bar underline */}
        <div className="mf-mini-player__bar" aria-hidden="true">
          <div className="mf-mini-player__bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ---- Mobile full-screen player ---- */}
      {isMobileExpanded && (
        <div className="mf-fullscreen-player" role="dialog" aria-label="Full screen player" aria-modal="true">
          <button
            className="mf-fullscreen-player__close"
            onClick={() => setIsMobileExpanded(false)}
            aria-label="Minimize player"
          >
            <Maximize2 size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>

<div className="mf-fullscreen-player__art-wrap">
<Image
  src={
    currentSong.thumbnail ||
    "https://placehold.co/100x100/png"
  }
  alt={`${currentSong.title} album art`}
  width={70}
  height={70}
  className={`mf-player__art ${
    isPlaying ? "mf-player__art--spin" : ""
  }`}
  unoptimized
/>

<div
  className="mf-fullscreen-player__art-glow"
  aria-hidden="true"
/>
</div>

<div className="mf-fullscreen-player__meta">
  <div>
    <p className="mf-fullscreen-player__title">
      {currentSong.title}
    </p>

    <p className="mf-fullscreen-player__artist">
      {currentSong.artist}
    </p>
  </div>
</div>

</div>
)}
{isQueueOpen && (
  <QueueDrawer />
)}
<style>{`
        /* ======= Desktop Player ======= */
.mf-player {
  position: fixed;

  left: 12px;
  right: 12px;
  bottom: 12px;

  height: 90px;

  display: grid;

  grid-template-columns:
    280px
    1fr
    250px;

  align-items: center;

  padding: 0 20px;

  border-radius: 20px;

  background: rgba(15,15,15,.92);

  backdrop-filter: blur(25px);

  -webkit-backdrop-filter: blur(25px);

  border: 1px solid rgba(255,255,255,.08);

  box-shadow:
    0 10px 40px rgba(0,0,0,.45);

  z-index: 999;
}

        /* Left */
        .mf-player__left {
  display: flex;

  align-items: center;

  gap: 12px;

  min-width: 0;
}
        .mf-player__art-wrap { position: relative; flex-shrink: 0; }
      .mf-player__art {
  width: 64px;
  height: 64px;

  border-radius: 12px;

  object-fit: cover;

  display: block;
}

.mf-player__art--spin {
  animation: spinAlbum 8s linear infinite;
}

@keyframes spinAlbum {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
        .mf-player__art-glow {
          position: absolute;
          inset: 0;
          border-radius: var(--mf-radius-md);
          box-shadow: 0 0 20px rgba(108,99,255,0.3);
          pointer-events: none;
        }
        .mf-player__meta { min-width: 0; }
        .mf-player__title {
          font-size: 13px;
          font-weight: 600;
          color: var(--mf-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }
        .mf-player__artist {
          font-size: 11px;
          color: var(--mf-text-secondary);
          margin: 2px 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Center */
       .mf-player__center {
  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  gap: 10px;

  width: 100%;
}
        .mf-player__controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
       .mf-player__progress-wrap {
  display: flex;

  align-items: center;

  gap: 10px;

  width: 100%;

  max-width: 650px;
}
        .mf-player__time {
          font-size: 11px;
          color: var(--mf-text-muted);
          font-variant-numeric: tabular-nums;
          min-width: 28px;
          text-align: center;
          flex-shrink: 0;
        }
        .mf-player__progress {
        box-shadow:
  0 0 15px rgba(168,85,247,.3);
          flex: 1;
          appearance: none;
          -webkit-appearance: none;
          height: 3px;
          border-radius: var(--mf-radius-full);
          cursor: pointer;
          outline: none;
          border: none;
          transition: height var(--mf-duration-fast);
        }
        .mf-player__progress-wrap:hover .mf-player__progress { height: 4px; }
        .mf-player__progress::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: var(--mf-text-primary);
          opacity: 0;
          transition: opacity var(--mf-duration-fast);
          cursor: pointer;
          margin-top: -4px;
        }
        .mf-player__progress-wrap:hover .mf-player__progress::-webkit-slider-thumb { opacity: 1; }

        /* Right */
       .mf-player__right {
  display: flex;

  justify-content: flex-end;

  align-items: center;

  gap: 10px;
}
        .mf-player__volume {
        box-shadow:
  0 0 15px rgba(168,85,247,.6);
          width: 80px;
          appearance: none;
          -webkit-appearance: none;
          height: 3px;
          border-radius: var(--mf-radius-full);
          cursor: pointer;
          outline: none;
          border: none;
        }
        .mf-player__volume::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--mf-text-primary);
          cursor: pointer;
          margin-top: -3.5px;
        }

        /* Shared icon button */
        .mf-player__icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--mf-text-secondary);
          padding: 6px;
          border-radius: var(--mf-radius-sm);
          transition:
            color var(--mf-duration-fast) var(--mf-ease),
            transform var(--mf-duration-fast) var(--mf-ease-spring);
          flex-shrink: 0;
        }
        .mf-player__icon-btn:hover { color: var(--mf-text-primary); }
        .mf-player__icon-btn:active { transform: scale(0.9); }
        .mf-player__icon-btn--active { color: var(--mf-brand) !important; }

        /* Play button */
        .mf-player__play-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 54px; height: 54px;
          box-shadow:
0 0 20px rgba(168,85,247,.4);
          border-radius: 50%;
          background: var(--mf-text-primary);
          color: var(--mf-text-inverse);
          border: none;
          cursor: pointer;
          transition:
            transform var(--mf-duration-fast) var(--mf-ease-spring),
            background var(--mf-duration-fast);
          flex-shrink: 0;
        }
        .mf-player__play-btn:hover { transform: scale(1.06); background: white; }
        .mf-player__play-btn:active { transform: scale(0.94); }
        .mf-player__play-btn--lg { width: 56px; height: 56px; }

        /* ======= Mobile mini-player ======= */
        .mf-mini-player {
          display: none;
          position: fixed;
          bottom: 56px; left: 8px; right: 8px;
          height: 84px;
          background: var(--mf-bg-overlay);
          border: 1px solid var(--mf-border);
          border-radius: var(--mf-radius-xl);
          z-index: 45;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          cursor: pointer;
          overflow: hidden;
        }
        .mf-mini-player__left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .mf-mini-player__art {
          width: 40px; height: 40px;
          border-radius: var(--mf-radius-md);
          object-fit: cover;
          flex-shrink: 0;
        }
        .mf-mini-player__title {
          font-size: 13px;
          font-weight: 600;
          color: var(--mf-text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .mf-mini-player__artist {
          font-size: 11px;
          color: var(--mf-text-secondary);
          margin: 1px 0 0;
        }
        .mf-mini-player__actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .mf-mini-player__bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: var(--mf-border);
        }
        .mf-mini-player__bar-fill {
          height: 100%;
          background: var(--mf-brand);
          border-radius: var(--mf-radius-full);
          transition: width 0.5s linear;
        }

        /* ======= Mobile full-screen player ======= */
        .mf-fullscreen-player {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: var(--mf-bg-base);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 48px 32px 48px;
          overflow: hidden;
        }
        .mf-fullscreen-player::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 20%, rgba(108,99,255,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .mf-fullscreen-player__close {
          position: absolute;
          top: 16px; left: 16px;
          background: none; border: none;
          color: var(--mf-text-secondary);
          cursor: pointer;
          padding: 8px;
        }
        .mf-fullscreen-player__art-wrap {
          position: relative;
          margin-top: 24px;
        }
        .mf-fullscreen-player__art {
          width: 280px; height: 280px;
          border-radius: var(--mf-radius-2xl);
          object-fit: cover;
          display: block;
        }
        .mf-fullscreen-player__art-glow {
          position: absolute;
          inset: 0;
          border-radius: var(--mf-radius-2xl);
          box-shadow: 0 20px 60px rgba(108,99,255,0.35);
          pointer-events: none;
        }
        .mf-fullscreen-player__meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 320px;
          margin-top: 32px;
        }
        .mf-fullscreen-player__title {
          font-size: 22px;
          font-family: var(--mf-font-display);
          font-weight: 700;
          color: var(--mf-text-primary);
          margin: 0;
        }
        .mf-fullscreen-player__artist {
          font-size: 15px;
          color: var(--mf-text-secondary);
          margin: 4px 0 0;
        }
        .mf-fullscreen-player__progress-wrap {
          width: 100%;
          max-width: 320px;
          margin-top: 24px;
        }
        .mf-fullscreen-player__times {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
        }
        .mf-fullscreen-player__times span {
          font-size: 11px;
          color: var(--mf-text-muted);
        }

        /* ======= Responsive ======= */
        @media (max-width: 767px) {
          .mf-player { display: none; }
          .mf-mini-player { display: flex; }
        }
        @media (max-width: 900px) and (min-width: 768px) {
          .mf-player {
            grid-template-columns: 200px 1fr 160px;
          }
        }
      `}</style>
      
    </>
  )
}
