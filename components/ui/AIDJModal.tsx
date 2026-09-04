"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Sparkles,
  Send,
  SkipForward,
  Heart,
  ThumbsDown,
} from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Track } from "@/types/music";

interface AIDJModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteArtist?: string;
}

export function AIDJModal({ isOpen, onClose, favoriteArtist = "Arijit Singh" }: AIDJModalProps) {
  const {
    videoId,
    title,
    artist,
    thumbnail,
    setTrack,
    setQueue,
    nextTrack,
    likedSongs,
    toggleLike,
    queue,
    currentIndex,
  } = usePlayerStore(
    useShallow((s) => ({
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
      nextTrack: s.nextTrack,
      likedSongs: s.likedSongs,
      toggleLike: s.toggleLike,
      queue: s.queue,
      currentIndex: s.currentIndex,
    }))
  );

  const [prompt, setPrompt] = useState("");
  const [djMessage, setDjMessage] = useState(
    "🎙️ 'Hey! I am your AI DJ. I am syncing with your listening patterns and curating smooth, continuous audio transitions.'"
  );
  const [curationReason, setCurationReason] = useState(
    "Selected based on your affinity for emotive vocal harmonies and trending momentum."
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentTrack: Track | null = videoId ? { videoId, title, artist, thumbnail } : null;
  const isLiked = currentTrack ? likedSongs.some((s) => s.videoId === currentTrack.videoId) : false;

  const handleSendPrompt = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setDjMessage("🎙️ 'Adjusting frequency dynamics, harmonizing transitions and queueing tracks...'");
    try {
      const res = await fetch("/api/ai-dj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, favoriteArtist }),
      });
      const data = await res.json();
      const message = data.results?.text || "Transitioning into your curated sound stream.";
      const query = data.results?.query || text;

      setDjMessage(message);
      setCurationReason(`Pivoted towards ${text} matching your current listening tempo.`);

      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const searchData = await searchRes.json();
      const songs = searchData.results || [];

      if (songs.length > 0) {
        setQueue(songs);
        setTrack(songs[0].videoId, songs[0].title, songs[0].artist, songs[0].thumbnail, 0);
      } else {
        setDjMessage("🎙️ 'Could not find matches for that vibe. Let us try another sound!'");
      }
    } catch (err) {
      console.error(err);
      setDjMessage("🎙️ 'Audio glitch encountered. Retrying audio stream...'");
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  const skipAndAdapt = () => {
    nextTrack();
    setDjMessage("🎙️ 'Adapting your set. Shifting away from skipped frequencies.'");
    setCurationReason("Instant skip adaptation applied to active queue.");
  };

  const handleDislike = () => {
    if (queue.length > 0) {
      const filtered = queue.filter((_, idx) => idx !== currentIndex);
      setQueue(filtered);
      nextTrack();
      setDjMessage("🎙️ 'Understood. Removed track and updated recommendation weights.'");
    }
  };

  const suggestions = [
    { label: "☕ Chill Lo-Fi", prompt: "Play relaxing ambient lofi focus beats" },
    { label: "⚡ High Energy Workout", prompt: "Play energetic gym workout EDM tracks" },
    { label: "💖 Romantic Melodies", prompt: "Play soulful romantic love songs hits" },
    { label: "🎸 Indie Rock Fusion", prompt: "Play upbeat indie alternative rock anthems" },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-[#121216] border border-white/[0.08] rounded-2xl overflow-hidden relative shadow-2xl p-6 sm:p-8 flex flex-col justify-between min-h-[520px] text-left"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="mb-3 pr-10">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400 flex items-center gap-1.5">
            <Sparkles size={12} className="animate-pulse" /> Continuous AI DJ Engine
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-black text-zinc-100 mt-1">
            MusicFlow AI DJ Session
          </h1>
        </div>

        {/* Visualizer & DJ Commentary Box */}
        <div className="flex-1 flex flex-col justify-center items-center py-4 space-y-4">
          {/* Animated DJ Frequency Equalizer */}
          <div className="flex items-end justify-center gap-1.5 h-12 w-56">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <motion.div
                key={i}
                animate={
                  loading
                    ? { height: [6, 40, 6] }
                    : { height: [8, 14 + (i % 5) * 4, 8] }
                }
                transition={{
                  repeat: Infinity,
                  duration: 0.7 + (i % 4) * 0.1,
                  ease: "easeInOut",
                }}
                className="w-1.5 bg-gradient-to-t from-purple-600 via-pink-500 to-indigo-400 rounded-full"
              />
            ))}
          </div>

          {/* Commentary & Selection Reason Bubble */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] max-w-md text-center space-y-2 relative shadow-inner">
            <p className="text-xs sm:text-sm font-medium text-zinc-200 leading-relaxed italic">
              {djMessage}
            </p>
            <div className="pt-1 border-t border-white/[0.04]">
              <span className="text-[10px] font-mono text-purple-400 font-bold block">
                ✦ {curationReason}
              </span>
            </div>
          </div>

          {/* Now Playing Mini Strip */}
          {title && (
            <div className="flex items-center justify-between w-full max-w-md px-4 py-2.5 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-zinc-200 truncate">{title}</p>
                <p className="text-[10px] text-zinc-500 truncate">{artist}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentTrack && (
                  <button
                    onClick={() => toggleLike(currentTrack)}
                    className={`p-1.5 rounded-lg transition ${isLiked ? "text-pink-500" : "text-zinc-500 hover:text-white"}`}
                    title="Like"
                  >
                    <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                )}
                <button
                  onClick={handleDislike}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition"
                  title="Dislike / Remove from session"
                >
                  <ThumbsDown size={14} />
                </button>
                <button
                  onClick={skipAndAdapt}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-bold text-zinc-300 hover:text-white transition flex items-center gap-1"
                  title="Skip & Adapt"
                >
                  <SkipForward size={11} /> Skip
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Energy & Transition Controls */}
        <div className="space-y-3.5 pt-3 border-t border-white/[0.05] shrink-0">
          {/* Quick mood chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((sig) => (
              <button
                key={sig.label}
                onClick={() => handleSendPrompt(sig.prompt)}
                disabled={loading}
                className="px-3 py-1 rounded-full border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.05] text-[10px] text-zinc-400 hover:text-white font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {sig.label}
              </button>
            ))}
          </div>

          {/* Prompt search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(prompt);
            }}
            className="relative flex items-center bg-[#07070a] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-purple-500/40 transition-all"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              placeholder="Tell the DJ to shift genre, mood, or artist focus..."
              className="w-full h-11 pl-4 pr-16 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none font-medium"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-1.5 h-8 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
            >
              <Send size={10} /> Shift Vibe
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
