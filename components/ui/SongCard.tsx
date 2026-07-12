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
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className="group relative cursor-pointer flex flex-col gap-3 text-left focus:outline-none"
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
        className="relative aspect-square overflow-hidden bg-[#0a0a0c]"
        style={{
          borderRadius: "16px",
          boxShadow: isCurrentSong
            ? "0 12px 40px rgba(139,92,246,0.22), 0 4px 16px rgba(0,0,0,0.5)"
            : hovered
            ? "0 16px 44px rgba(0,0,0,0.65), 0 4px 16px rgba(0,0,0,0.4)"
            : "0 8px 28px rgba(0,0,0,0.55)",
          transition: "box-shadow 0.3s ease",
          border: isCurrentSong
            ? "1px solid rgba(139,92,246,0.35)"
            : "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {showRank && (
          <span className="absolute left-2.5 top-2.5 z-20 rounded-full bg-[#06060a]/85 border border-white/[0.06] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-zinc-300 backdrop-blur-sm">
            #{song.rank}
          </span>
        )}

        <motion.div
          className="h-full w-full"
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <SafeImage
            src={song.thumbnail}
            videoId={song.id}
            alt={song.title}
            className="h-full w-full object-cover"
          />
        </motion.div>

        {/* Hover overlay */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 bg-black/45"
        />

        {/* Play/Pause Button */}
        <AnimatePresence>
          {(hovered || isActivePlaying) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ type: "spring", stiffness: 480, damping: 26 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg">
                {isActivePlaying ? (
                  <Pause size={15} fill="black" className="text-black" />
                ) : (
                  <Play size={15} fill="black" className="text-black ml-0.5" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Like Button */}
        <motion.button
          animate={{
            opacity: hovered || isLiked ? 1 : 0,
            scale: hovered || isLiked ? 1 : 0.7,
          }}
          whileTap={{ scale: 0.78 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
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
          className="absolute bottom-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-[#06060a]/90 backdrop-blur-sm flex items-center justify-center border border-white/[0.08] hover:border-pink-500/35 text-zinc-400 hover:text-pink-400 transition-colors duration-150"
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <Heart
            size={12}
            fill={isLiked ? "#ec4899" : "none"}
            className={isLiked ? "text-pink-400" : ""}
          />
        </motion.button>
      </div>

      {/* Text Details */}
      <div className="space-y-0.5 px-0.5">
        <h3
          className="text-[13px] font-semibold tracking-tight truncate leading-tight transition-colors duration-200"
          style={{
            color: isCurrentSong ? "#c084fc" : hovered ? "#ffffff" : "#e4e4e7",
          }}
        >
          {song.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-zinc-550 truncate max-w-[75%] leading-tight">
            {song.artist}
          </p>

          {/* Equalizer Visualizer or Duration */}
          {isActivePlaying ? (
            <div className="flex items-end gap-[1.5px] h-3 px-1 text-purple-400 select-none shrink-0">
              <span className="w-[1.5px] h-[35%] bg-purple-500 rounded-full animate-[pulse_0.8s_infinite]" />
              <span className="w-[1.5px] h-[80%] bg-purple-400 rounded-full animate-[pulse_1s_infinite_0.2s]" />
              <span className="w-[1.5px] h-[50%] bg-purple-500 rounded-full animate-[pulse_0.9s_infinite_0.1s]" />
            </div>
          ) : (
            <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
              {formatDuration(song.duration ?? 0)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
SongCard.displayName = "SongCard";