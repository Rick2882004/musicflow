"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Send, Play } from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import { SafeImage } from "./SafeImage";

interface AIDJModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteArtist?: string;
}

export function AIDJModal({ isOpen, onClose, favoriteArtist = "Arijit Singh" }: AIDJModalProps) {
  const { setTrack, setQueue } = usePlayerStore();
  const [prompt, setPrompt] = useState("");
  const [djMessage, setDjMessage] = useState("🎙️ 'Hey! I am your AI DJ assistant. What kind of sound or vibe are we exploring today?'");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendPrompt = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setDjMessage("🎙️ 'Analyzing your musical affinity and looking up the matches...'");
    try {
      // 1. Get DJ Response commentary
      const res = await fetch("/api/ai-dj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, favoriteArtist }),
      });
      const data = await res.json();
      const message = data.results?.text || "Let's stream some songs.";
      const query = data.results?.query || text;

      setDjMessage(message);

      // 2. Fetch tracks based on query
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const searchData = await searchRes.json();
      const songs = searchData.results || [];

      if (songs.length > 0) {
        setQueue(songs);
        setTrack(songs[0].videoId, songs[0].title, songs[0].artist, songs[0].thumbnail, 0);
      } else {
        setDjMessage("🎙️ 'I couldn't find matches on YouTube. Try another genre prompt!'");
      }
    } catch (err) {
      console.error(err);
      setDjMessage("🎙️ 'Oops, something glitched in my matrix. Let's try another query!'");
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  const suggestions = [
    { label: "☕ Relaxing Lo-Fi", prompt: "Play some relax ambient lofi focus beats" },
    { label: "⚡ High Energy Gym", prompt: "Play energetic gym workout EDM tracks" },
    { label: "💖 Romantic Hits", prompt: "Play romantic love songs hits" },
    { label: "📻 Surprise Me!", prompt: "Surprise me with personal hits radio" },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-zinc-950/95 border border-white/[0.06] rounded-[32px] overflow-hidden relative shadow-[0_24px_80px_rgba(0,0,0,0.85)] p-6 sm:p-8 flex flex-col justify-between min-h-[460px] text-left"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Title */}
        <div className="mb-4 pr-10">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400 flex items-center gap-1.5">
            <Sparkles size={11} className="animate-pulse" /> Personal AI Assistant
          </span>
          <h1 className="font-display text-xl font-black text-zinc-200 mt-1">AI DJ Commentary</h1>
        </div>

        {/* Live Audio DJ Visualizer Animation */}
        <div className="flex-1 flex flex-col justify-center items-center py-6 space-y-6">
          <div className="flex items-end justify-center gap-1 h-12 w-48">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <motion.div
                key={i}
                animate={loading ? { height: [8, 36, 8] } : { height: [8, 18, 8] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8 + i * 0.05,
                  ease: "easeInOut",
                }}
                className="w-1.5 bg-gradient-to-t from-purple-650 to-pink-500 rounded-full"
              />
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.015] border border-white/[0.04] max-w-sm text-center relative overflow-hidden">
            <p className="text-sm font-medium text-zinc-350 leading-relaxed italic">
              {djMessage}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 pt-4 border-t border-white/[0.04] shrink-0">
          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((sig) => (
              <button
                key={sig.label}
                onClick={() => handleSendPrompt(sig.prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.05] text-[10px] text-zinc-400 hover:text-white font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {sig.label}
              </button>
            ))}
          </div>

          {/* Prompt search bar input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(prompt);
            }}
            className="relative flex items-center bg-[#07070a] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-purple-550/40 focus-within:bg-[#0c0c10] transition-all"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              placeholder="Ask the AI DJ to play a custom mood vibe..."
              className="w-full h-12 pl-4 pr-16 bg-transparent text-xs text-white placeholder:text-zinc-650 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-2 h-8 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 hover:scale-95 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={10} /> Send
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
