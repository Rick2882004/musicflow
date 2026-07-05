"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Heart } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { usePlayerStore } from "@/store/player-store";

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

export function SongCard({
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
  } = usePlayerStore(
    useShallow((state) => ({
      setTrack: state.setTrack,
      toggleLike: state.toggleLike,
      addRecentSong: state.addRecentSong,
      likedSongs: state.likedSongs,
      videoId: state.videoId,
    }))
  );

  const [hovered, setHovered] = useState(false);

  const isLiked = likedSongs.some(
    (item) => item.videoId === song.id
  );

  const isPlaying = videoId === song.id;

  const playSong = () => {
    setTrack(
      song.id,
      song.title,
      song.artist,
      song.thumbnail || "",
      0
    );

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
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative cursor-pointer rounded-2xl border border-white/5 bg-white/[0.03] p-3 shadow-lg transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-purple-500/20 backdrop-blur-xl"
      onClick={playSong}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Play ${song.title}`}
    >
      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl">
        {showRank && (
          <span className="absolute left-2 top-2 z-20 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            #{song.rank}
          </span>
        )}

        <motion.img
          animate={{
            scale: hovered ? 1.08 : 1,
          }}
          transition={{
            duration: 0.4,
          }}
          src={
            song.thumbnail ||
            "https://placehold.co/500x500/18181b/ffffff?text=Music"
          }
          alt={song.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              "https://placehold.co/500x500/18181b/ffffff?text=Music";
          }}
          className="h-full w-full object-cover"
        />

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg"
              >
                <Play
                  size={20}
                  fill="currentColor"
                  className="ml-1"
                />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: hovered || isLiked ? 1 : 0,
            scale: hovered || isLiked ? 1 : 0.8,
          }}
          whileHover={{
            scale: 1.15,
          }}
          whileTap={{
            scale: 0.9,
          }}
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
          className={`absolute bottom-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur ${
            isLiked
              ? "text-purple-500"
              : "text-zinc-300"
          }`}
        >
          <Heart
            size={14}
            fill={isLiked ? "currentColor" : "none"}
          />
        </motion.button>
      </div>

      <div>
        <h3 className="truncate pr-6 text-sm font-semibold text-white">
          {song.title}
        </h3>

        <div className="mt-1 flex items-center justify-between">
          <p className="max-w-[70%] truncate text-xs text-zinc-400">
            {song.artist}
          </p>

          {isPlaying ? (
            <div className="flex h-3 items-end gap-[3px]">
              {[1, 2, 3].map((bar) => (
                <motion.div
                  key={bar}
                  animate={{
                    height: ["40%", "100%", "40%"],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: bar * 0.2,
                  }}
                  className="w-[3px] rounded-full bg-green-500"
                />
              ))}
            </div>
          ) : (
            <span className="text-[10px] font-medium text-zinc-500">
              {formatDuration(song.duration ?? 0)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}