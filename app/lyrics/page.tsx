"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, AlertCircle } from "lucide-react";

export default function LyricsPage() {
  const { videoId, title, artist, thumbnail } = usePlayerStore(useShallow((s) => ({
    videoId: s.videoId,
    title: s.title,
    artist: s.artist,
    thumbnail: s.thumbnail,
  })));
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
        <Music className="w-12 h-12 text-zinc-600 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-zinc-300">No Song Playing</h2>
        <p className="text-zinc-500 text-xs mt-1">Play a track to see lyrics here</p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto space-y-8 select-none">
      {/* Dynamic Header */}
      <div className="flex items-center gap-6 p-4 rounded-3xl bg-white/[0.01] border border-white/5 shadow-2xl">
        <img
          src={thumbnail || "/logo.png"}
          alt={title}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-2xl border border-white/5 shrink-0"
        />
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
            Playing Lyrics
          </span>
          <h1 className="text-xl sm:text-3xl font-black text-white truncate mt-1">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 truncate mt-0.5">{artist}</p>
        </div>
      </div>

      {/* Lyrics Box */}
      <div className="glass p-6 sm:p-10 rounded-3xl border border-white/5 relative bg-zinc-950/40 min-h-[400px] overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] rounded-full bg-purple-500/5 blur-[80px] pointer-events-none" />

        {loading ? (
          <div className="space-y-4 animate-pulse pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 bg-white/5 rounded-md w-3/4 mx-auto" />
            ))}
          </div>
        ) : lyrics ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5 text-center text-zinc-300 font-medium text-sm sm:text-lg tracking-wide leading-relaxed py-4 max-h-[60vh] overflow-y-auto pr-2"
          >
            {lyrics.map((line, idx) => (
              <p
                key={idx}
                className="hover:text-white hover:scale-[1.01] hover:text-glow transition-all duration-200 cursor-default"
              >
                {line}
              </p>
            ))}
          </motion.div>
        ) : (
          <div className="min-h-[250px] flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="w-8 h-8 text-zinc-500 mb-2" />
            <p className="text-zinc-400 text-sm font-semibold">Lyrics not available</p>
            <p className="text-zinc-600 text-xs mt-1">We couldn&apos;t retrieve the lyrics lines for this song.</p>
          </div>
        )}
      </div>
    </main>
  );
}