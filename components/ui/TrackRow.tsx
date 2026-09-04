"use client";

import { memo } from "react";
import { Play, Heart } from "lucide-react";
import { Track } from "@/types/music";
import { SafeImage } from "./SafeImage";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";

function formatDuration(s: number = 0) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface TrackRowProps {
  song: Track;
  index: number;
  onPlay: (song: Track, index: number) => void;
  showRank?: boolean;
  showArtwork?: boolean;
  showAlbum?: boolean;
  showDuration?: boolean;
  showLike?: boolean;
  albumName?: string;
}

export const TrackRow = memo(function TrackRow({
  song,
  index,
  onPlay,
  showRank = true,
  showArtwork = true,
  showAlbum = false,
  showDuration = true,
  showLike = true,
  albumName,
}: TrackRowProps) {
  const { videoId, isPlaying, likedSongs, toggleLike } = usePlayerStore(
    useShallow((s) => ({
      videoId: s.videoId,
      isPlaying: s.isPlaying,
      likedSongs: s.likedSongs,
      toggleLike: s.toggleLike,
    }))
  );

  const isCurrent = song.videoId === videoId;
  const isCurrentPlaying = isCurrent && isPlaying;
  const isLiked = likedSongs.some((item) => item.videoId === song.videoId);

  return (
    <div
      onClick={() => onPlay(song, index)}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPlay(song, index)}
      className={`group flex items-center justify-between px-3.5 py-2 rounded-xl cursor-pointer select-none transition-colors duration-150 ${
        isCurrent ? "bg-white/[0.06]" : "hover:bg-white/[0.035]"
      }`}
    >
      {/* Left: Index/Play + Artwork + Title & Artist */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
        {showRank && (
          <div className="w-5 text-center shrink-0">
            {isCurrentPlaying ? (
              <div className="flex items-end justify-center gap-0.5 h-3.5 text-purple-400">
                <span className="w-0.5 h-2.5 bg-purple-400 animate-pulse" />
                <span className="w-0.5 h-3.5 bg-purple-300 animate-pulse delay-75" />
                <span className="w-0.5 h-1.5 bg-purple-400 animate-pulse delay-150" />
              </div>
            ) : (
              <>
                <span
                  className={`text-xs font-mono font-medium group-hover:hidden ${
                    isCurrent ? "text-purple-400 font-bold" : "text-zinc-500"
                  }`}
                >
                  {index + 1}
                </span>
                <Play
                  size={12}
                  fill="white"
                  className="text-white mx-auto hidden group-hover:block"
                />
              </>
            )}
          </div>
        )}

        {showArtwork && (
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/5 relative">
            <SafeImage
              src={song.thumbnail}
              videoId={song.videoId}
              title={song.title}
              artist={song.artist}
              alt={song.title}
              className="w-full h-full object-cover"
              fallbackType="song"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={`text-[13px] font-semibold truncate leading-snug ${
              isCurrent ? "text-purple-300 font-bold" : "text-zinc-100 group-hover:text-white"
            }`}
          >
            {song.title}
          </p>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-normal">
            {song.artist}
          </p>
        </div>
      </div>

      {/* Middle: Optional Album Name (Desktop) */}
      {showAlbum && (
        <div className="hidden lg:block w-48 truncate text-[11px] text-zinc-500 mr-4">
          {albumName || song.artist}
        </div>
      )}

      {/* Right: Like + Duration */}
      <div
        className="flex items-center gap-3.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {showLike && (
          <button
            onClick={() => toggleLike(song)}
            className={`p-1.5 rounded-lg transition-colors active:scale-90 ${
              isLiked
                ? "text-pink-400"
                : "text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100"
            }`}
            aria-label={isLiked ? "Unlike song" : "Like song"}
          >
            <Heart
              size={14}
              fill={isLiked ? "#ec4899" : "none"}
              className={isLiked ? "text-pink-400" : ""}
            />
          </button>
        )}

        {showDuration && (
          <span className="text-[11px] font-mono text-zinc-500 tabular-nums w-10 text-right">
            {song.duration ? formatDuration(song.duration) : "3:30"}
          </span>
        )}
      </div>
    </div>
  );
});
