"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

export default function LyricsPage() {
  const { videoId, title, artist, thumbnail, currentTime, duration, player } = usePlayerStore(
    useShallow((s) => ({
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
      currentTime: s.currentTime,
      duration: s.duration,
      player: s.player,
    }))
  );

  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const lineRefs = useRef<Record<number, HTMLParagraphElement | null>>({});

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

  // Calculate active line index based on track duration
  const activeLineIndex =
    lyrics && duration > 0
      ? Math.min(lyrics.length - 1, Math.floor((currentTime / duration) * lyrics.length))
      : 0;

  // Auto scroll active line to center
  useEffect(() => {
    const activeEl = lineRefs.current[activeLineIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeLineIndex]);

  // Jump seek to clicked lyric timestamp
  const jumpToLine = (idx: number) => {
    if (!duration || !lyrics) return;
    const targetTime = (idx / lyrics.length) * duration;
    if (player && typeof player.seekTo === "function") {
      player.seekTo(targetTime, true);
    }
  };

  if (!title) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 select-none">
        <Music className="w-12 h-12 text-zinc-650 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-zinc-300">No Song Playing</h2>
        <p className="text-zinc-500 text-xs mt-1">Play a track to see lyrics here</p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto space-y-8 select-none relative min-h-[80vh] pb-32">
      {/* Cinematic Blurred Ambient Background */}
      {thumbnail && (
        <div
          className="absolute inset-0 -top-20 z-0 bg-cover bg-center filter blur-[100px] opacity-15 pointer-events-none transition-all duration-700 rounded-3xl"
          style={{ backgroundImage: `url(${thumbnail})` }}
        />
      )}

      {/* Dynamic Header */}
      <div className="relative z-10 flex items-center gap-6 p-4 rounded-3xl bg-white/[0.015] border border-white/[0.04] shadow-2xl backdrop-blur-md">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-white/5 bg-zinc-950 shadow-lg">
          <SafeImage
            src={thumbnail}
            videoId={videoId}
            alt={title}
            className="w-full h-full object-cover"
            fallbackType="song"
          />
        </div>
        <div className="min-w-0 text-left">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400">
            Real-Time Sync Lyrics
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white truncate mt-1">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 truncate mt-0.5">{artist}</p>
        </div>
      </div>

      {/* Synchronized Lyrics Container */}
      <div className="relative z-10 p-6 sm:p-10 rounded-3xl border border-white/[0.04] bg-zinc-950/20 backdrop-blur-xl min-h-[460px] overflow-hidden">
        {loading ? (
          <div className="space-y-4 animate-pulse pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 bg-white/5 rounded-md w-3/4 mx-auto" />
            ))}
          </div>
        ) : lyrics ? (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 text-center max-h-[50vh] overflow-y-auto pr-2 scrollbar-none py-20 relative"
            >
              {lyrics.map((line, idx) => {
                const isActive = idx === activeLineIndex;
                return (
                  <p
                    key={idx}
                    ref={(el) => {
                      lineRefs.current[idx] = el;
                    }}
                    onClick={() => jumpToLine(idx)}
                    className={`transition-all duration-300 transform origin-center cursor-pointer select-none leading-relaxed tracking-wide ${
                      isActive
                        ? "text-white text-xl sm:text-2xl font-black scale-[1.02] text-glow opacity-100 py-1"
                        : "text-zinc-550 text-sm sm:text-lg font-bold opacity-40 hover:opacity-85 hover:text-white"
                    }`}
                  >
                    {line}
                  </p>
                );
              })}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-500 text-xs">
            <p>Instrumental detection completed.</p>
            <p className="mt-1">No lyrics available for this track.</p>
          </div>
        )}
      </div>
    </main>
  );
}