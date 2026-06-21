'use client'
// src/components/ui/SongCard.tsx
import { usePlayerStore } from "@/store/player-store";
import Image from 'next/image'
import { Play, Heart } from 'lucide-react'
import { useState } from 'react'

type Song = {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
  rank?: number
}

function formatDuration(
  secs: number
) {
  const totalSeconds =
    Math.floor(secs);

  const m = Math.floor(
    totalSeconds / 60
  );

  const s =
    totalSeconds % 60;

  return `${m}:${s
    .toString()
    .padStart(2, "0")}`;

}

export function SongCard({ song, showRank }: { song: Song; showRank?: boolean }) {
const {
  setTrack,
  toggleLike,
  addRecentSong,
  likedSongs,
  videoId,
} = usePlayerStore();
  const [isHovered, setIsHovered] = useState(false)
const isLiked =
  likedSongs.some(
    (s) =>
      s.videoId === song.id
  );

const isPlayingSong =
  videoId === song.id;

  const playSong = () => {
  setTrack(
    song.id,
    song.title,
    song.artist,
    song.thumbnail,
    0
  );

  addRecentSong({
    videoId: song.id,
    title: song.title,
    artist: song.artist,
    thumbnail: song.thumbnail,
  });
};

  return (
    <div
  className="mf-song-card"
  onClick={playSong}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Play ${song.title} by ${song.artist}`}
    >
      <div className="mf-song-card__thumb-wrap">
        {showRank && (
          <span className="mf-song-card__rank" aria-label={`Rank ${song.rank}`}>
            {song.rank}
          </span>
        )}
        <Image
          src={song.thumbnail}
          alt=""
          width={160}
          height={160}
          className="mf-song-card__thumb"
          unoptimized
        />
        <div className={`mf-song-card__overlay ${isHovered ? 'mf-song-card__overlay--visible' : ''}`}>
          <button className="mf-song-card__play" aria-label={`Play ${song.title}`}>
            <Play size={20} fill="currentColor" />
          </button>
        </div>
        <button
          className={`mf-song-card__like ${isLiked ? 'mf-song-card__like--active' : ''} ${isHovered || isLiked ? 'mf-song-card__like--visible' : ''}`}
          onClick={(e) => {
  e.stopPropagation();

  toggleLike({
    videoId: song.id,
    title: song.title,
    artist: song.artist,
    thumbnail: song.thumbnail,
  });

  toggleLike({
  videoId: song.id,
  title: song.title,
  artist: song.artist,
  thumbnail: song.thumbnail,
});
}}
          aria-label={isLiked ? 'Unlike' : 'Like'}
          aria-pressed={isLiked}
        >
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="mf-song-card__meta">
        <p className="mf-song-card__title">{song.title}</p>
        <p className="mf-song-card__artist">{song.artist}</p>
        {isPlayingSong && (
  <div className="mf-equalizer">
    <span />
    <span />
    <span />
  </div>
)}
        <p className="mf-song-card__duration">{formatDuration(song.duration)}</p>
      </div>

      <style>{`
        .mf-song-card {
          cursor: pointer;
          border-radius: var(--mf-radius-lg);
          padding: 12px;
          background: var(--mf-bg-card);
          border: 1px solid var(--mf-border);
          transition:
            background var(--mf-duration-base) var(--mf-ease),
            border-color var(--mf-duration-base) var(--mf-ease),
            transform var(--mf-duration-base) var(--mf-ease);
          outline: none;
        }
        .mf-song-card:hover,
        .mf-song-card:focus-visible {
          background: var(--mf-bg-overlay);
          border-color: var(--mf-border-hover);
          transform: translateY(-2px);
        }
        .mf-song-card:focus-visible { outline: 2px solid var(--mf-brand); }

        .mf-song-card__thumb-wrap {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--mf-radius-md);
          overflow: hidden;
          margin-bottom: 12px;
        }
        .mf-song-card__thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform var(--mf-duration-slow) var(--mf-ease);
        }
        .mf-song-card:hover .mf-song-card__thumb { transform: scale(1.04); }

        .mf-song-card__rank {
          position: absolute;
          top: 8px; left: 8px;
          z-index: 2;
          font-size: 11px;
          font-weight: 700;
          color: var(--mf-text-primary);
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          border-radius: var(--mf-radius-sm);
          padding: 2px 6px;
          font-variant-numeric: tabular-nums;
        }

        .mf-song-card__overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity var(--mf-duration-base) var(--mf-ease);
        }
        .mf-song-card__overlay--visible { opacity: 1; }

        .mf-song-card__play {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: var(--mf-brand);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transform: scale(0.85);
          transition: transform var(--mf-duration-fast) var(--mf-ease-spring);
          box-shadow: 0 4px 16px rgba(108,99,255,0.5);
        }
        .mf-song-card__overlay--visible .mf-song-card__play { transform: scale(1); }
        .mf-song-card__play:hover { transform: scale(1.08) !important; }
        .mf-song-card__play:active { transform: scale(0.95) !important; }

        .mf-song-card__like {
          position: absolute;
          bottom: 8px; right: 8px;
          z-index: 2;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          border: none;
          color: var(--mf-text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity var(--mf-duration-fast), color var(--mf-duration-fast), transform var(--mf-duration-fast) var(--mf-ease-spring);
        }
        .mf-song-card__like--visible { opacity: 1; }
        .mf-song-card__like--active { color: var(--mf-brand); }
        .mf-song-card__like:hover { transform: scale(1.15); }

        .mf-song-card__meta { padding: 0 2px; }
        .mf-song-card__title {
          font-size: 14px;
          font-weight: 600;
          color: var(--mf-text-primary);
          margin: 0 0 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mf-song-card__artist {
          font-size: 12px;
          color: var(--mf-text-secondary);
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mf-song-card__duration {
          font-size: 11px;
          color: var(--mf-text-muted);
          margin: 0;
          font-variant-numeric: tabular-nums;
        }
          .mf-equalizer {
  display: flex;
  gap: 3px;
  margin-top: 6px;
}

.mf-equalizer span {
  width: 3px;
  height: 12px;
  border-radius: 999px;
  background: #22c55e;
  animation: eq 1s infinite;
}

.mf-equalizer span:nth-child(2) {
  animation-delay: .2s;
}

.mf-equalizer span:nth-child(3) {
  animation-delay: .4s;
}

@keyframes eq {
  0%,100% {
    transform: scaleY(.4);
  }

  50% {
    transform: scaleY(1.3);
  }
}
      `}</style>
    </div>
  )
}
