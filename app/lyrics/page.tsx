"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, FileText } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { AudioVisualizer } from "@/components/player/AudioVisualizer";

export default function LyricsPage() {
  const { videoId, title, artist, thumbnail, player, isPlaying } = usePlayerStore(
    useShallow((s) => ({
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
      player: s.player,
      isPlaying: s.isPlaying,
    }))
  );

  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    async function fetchSongLyrics() {
      setLoading(true);
      setLyrics(null);
      try {
        const res = await fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}`);
        if (!res.ok) throw new Error("Lyrics fetch failed");
        const data = await res.json();
        setLyrics(data.lyrics || null);
      } catch (err) {
        console.error("Lyrics page fetch error:", err);
        setLyrics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSongLyrics();
  }, [videoId]);

  if (!title) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 select-none">
        <Music className="w-12 h-12 text-zinc-650 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-zinc-300">No Song Playing</h2>
        <p className="text-zinc-500 text-xs mt-1">Play a track to view lyrics</p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto space-y-6 select-none relative min-h-[80vh] pb-32">
      {/* Dynamic Track Header */}
      <div className="relative z-10 flex items-center gap-4 p-4 rounded-2xl bg-[#121216] border border-white/[0.06]">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-zinc-950 shadow-md">
          <SafeImage
            src={thumbnail}
            videoId={videoId}
            title={title}
            artist={artist}
            alt={title}
            className="w-full h-full object-cover"
            fallbackType="song"
          />
        </div>
        <div className="min-w-0 text-left flex-grow">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Lyrics
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 font-medium">
              Reading View
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white truncate mt-0.5">
            {title}
          </h1>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{artist}</p>
        </div>
        <div className="shrink-0 hidden sm:block">
          <AudioVisualizer isPlaying={Boolean(isPlaying && player)} bars={12} barColor="bg-purple-400" />
        </div>
      </div>

      {/* Lyrics Reading Container */}
      <div className="relative z-10 p-6 sm:p-10 rounded-2xl border border-white/[0.06] bg-[#121216] min-h-[460px]">
        {loading ? (
          <div className="space-y-4 animate-pulse pt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-5 bg-white/5 rounded-md mx-auto"
                style={{ width: `${60 + (i % 4) * 10}%` }}
              />
            ))}
          </div>
        ) : lyrics && lyrics.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 text-center py-6"
            >
              {lyrics.map((line, idx) => {
                const isEmpty = !line.trim();
                return isEmpty ? (
                  <div key={idx} className="h-4" />
                ) : (
                  <p
                    key={idx}
                    className="text-zinc-300 hover:text-white text-base sm:text-lg font-medium leading-relaxed tracking-wide transition-colors duration-150"
                  >
                    {line}
                  </p>
                );
              })}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-500 text-xs text-center space-y-2">
            <FileText className="w-10 h-10 text-zinc-600 mb-1" />
            <p className="font-semibold text-zinc-400">No lyrics available for this track.</p>
            <p className="text-[11px] text-zinc-500">Lyrics may be unavailable or the track may be an instrumental.</p>
          </div>
        )}
      </div>
    </main>
  );
}