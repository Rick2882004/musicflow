"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Heart, Pause } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { usePlayerStore } from "@/store/player-store";
import { SafeImage } from "./SafeImage";

type Song = {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string;
  duration?: number;
  rank?: number;
};

function formatDuration(seconds: number = 0) {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export const SongCard = memo(function SongCard({
  song,
  showRank = false,
}: {
  song: Song;
  showRank?: boolean;
}) {
  const {
    setTrack,
    toggleLike,
    addRecentSong,
    likedSongs,
    videoId,
    isPlaying,
  } = usePlayerStore(
    useShallow((state) => ({
      setTrack: state.setTrack,
      toggleLike: state.toggleLike,
      addRecentSong: state.addRecentSong,
      likedSongs: state.likedSongs,
      videoId: state.videoId,
      isPlaying: state.isPlaying,
    }))
  );

  const [hovered, setHovered] = useState(false);

  const isLiked = likedSongs.some((item) => item.videoId === song.id);
  const isCurrentSong = videoId === song.id;
  const isActivePlaying = isCurrentSong && isPlaying;

  const playSong = () => {
    setTrack(song.id, song.title, song.artist, song.thumbnail || "", 0);
    void addRecentSong({
      videoId: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail || "",
      duration: song.duration ?? 0,
    });
  };

  return (
    <div
      className="group relative cursor-pointer flex flex-col gap-2.5 text-left focus:outline-none"
      onClick={playSong}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Play ${song.title}`}
      onKeyDown={(e) => e.key === "Enter" && playSong()}
    >
      {/* Artwork */}
      <div
        className="relative overflow-hidden bg-[var(--mf-bg-card)] transition-all duration-200"
        style={{
          borderRadius: "var(--mf-r-lg)",
          aspectRatio: "1",
          border: isCurrentSong
            ? "1px solid rgba(124,58,237,0.35)"
            : "1px solid rgba(255,255,255,0.05)",
          boxShadow: isCurrentSong
            ? "0 8px 28px rgba(124,58,237,0.18)"
            : hovered
            ? "0 10px 28px rgba(0,0,0,0.6)"
            : "0 4px 16px rgba(0,0,0,0.45)",
        }}
      >
        {showRank && (
          <span
            className="absolute left-2 top-2 z-20 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-sm"
            style={{
              background: "rgba(6,6,10,0.85)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--mf-text-secondary)",
            }}
          >
            #{song.rank}
          </span>
        )}

        {/* Artwork image — subtle scale on hover */}
        <div
          className="w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: hovered ? "scale(1.05)" : "scale(1)" }}
        >
          <SafeImage
            src={song.thumbnail}
            videoId={song.id}
            title={song.title}
            artist={song.artist}
            alt={song.title}
            className="h-full w-full object-cover"
            fallbackType="song"
          />
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{
            background: "rgba(0,0,0,0.38)",
            opacity: hovered || isActivePlaying ? 1 : 0,
            pointerEvents: "none",
          }}
        />

        {/* Play/Pause Button */}
        <AnimatePresence>
          {(hovered || isActivePlaying) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.80 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.80 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: "#ffffff" }}
              >
                {isActivePlaying ? (
                  <Pause size={14} fill="black" className="text-black" />
                ) : (
                  <Play size={14} fill="black" className="text-black ml-0.5" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Like Button */}
        <motion.button
          animate={{
            opacity: hovered || isLiked ? 1 : 0,
            scale: hovered || isLiked ? 1 : 0.75,
          }}
          whileTap={{ scale: 0.80 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          onClick={(e) => {
            e.stopPropagation();
            void toggleLike({
              videoId: song.id,
              title: song.title,
              artist: song.artist,
              thumbnail: song.thumbnail || "",
              duration: song.duration ?? 0,
            });
          }}
          className="absolute bottom-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{
            background: "rgba(6,6,10,0.88)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: isLiked ? "#ec4899" : "var(--mf-text-muted)",
          }}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <Heart
            size={11}
            fill={isLiked ? "#ec4899" : "none"}
          />
        </motion.button>
      </div>

      {/* Text Details */}
      <div className="space-y-0.5 px-0.5">
        <h3
          className="text-[13px] font-semibold tracking-tight truncate leading-tight transition-colors duration-150"
          style={{
            color: isCurrentSong
              ? "var(--mf-accent-light)"
              : hovered
              ? "#ffffff"
              : "var(--mf-text-primary)",
          }}
        >
          {song.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[11px] truncate leading-tight"
            style={{ color: "var(--mf-text-muted)" }}
          >
            {song.artist}
          </p>

          {isActivePlaying ? (
            <div className="flex items-end gap-[1.5px] h-3 shrink-0">
              <span
                className="mf-eq-bar h-[35%]"
                style={{ "--mf-eq-dur": "0.8s" } as React.CSSProperties}
              />
              <span
                className="mf-eq-bar h-[80%]"
                style={{ "--mf-eq-dur": "1.0s" } as React.CSSProperties}
              />
              <span
                className="mf-eq-bar h-[50%]"
                style={{ "--mf-eq-dur": "0.9s" } as React.CSSProperties}
              />
            </div>
          ) : (
            <span
              className="text-[10px] font-mono tabular-nums shrink-0"
              style={{ color: "var(--mf-text-dim)" }}
            >
              {formatDuration(song.duration ?? 0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
SongCard.displayName = "SongCard";