"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Share2, Sparkles, Heart, Award } from "lucide-react";
import { Track } from "@/types/music";

interface WrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  likedSongs: Track[];
  recentSongs: Track[];
}

export function WrappedModal({ isOpen, onClose, likedSongs, recentSongs }: WrappedModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Calculate metrics
  const totalLikedCount = likedSongs.length;
  const totalPlayed = recentSongs.length;
  const totalHours = Math.round(totalPlayed * 3.5 / 60 * 10) / 10;
  
  const artistCounts: { [key: string]: number } = {};
  recentSongs.forEach((song) => {
    artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
  });

  const sortedArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  const topArtistName = sortedArtists[0]?.[0] || "Arijit Singh";

  const handleShare = () => {
    const shareText = `🎵 My MusicFlow Wrapped: Listen Time: ${totalHours}h | Top Artist: ${topArtistName}! Check out my profile: http://musicflow.io/user/wrapped`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const slides = [
    // Slide 1: Welcome & Overview
    {
      title: "Your Year in Sound",
      content: (
        <div className="space-y-6 text-center select-none">
          <div className="w-16 h-16 rounded-full bg-purple-550/15 flex items-center justify-center text-purple-400 mx-auto animate-bounce">
            <Sparkles size={28} />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mt-4">
            You spent a lot of time with music.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            This year, you streamed <span className="text-white font-bold">{totalPlayed} tracks</span> and saved <span className="text-white font-bold">{totalLikedCount} favorites</span>, building up a total listening record of:
          </p>
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] inline-block">
            <p className="text-[10px] text-zinc-550 uppercase tracking-widest font-black">TOTAL TIME</p>
            <p className="text-4xl font-mono font-black text-purple-300 mt-1">{totalHours} Hours</p>
          </div>
        </div>
      ),
    },
    // Slide 2: Top Artist & Music
    {
      title: "Your Absolute Favorites",
      content: (
        <div className="space-y-6 text-center select-none">
          <div className="w-16 h-16 rounded-full bg-pink-550/15 flex items-center justify-center text-pink-400 mx-auto">
            <Heart size={28} />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mt-4">
            One artist stood out.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            You couldn&apos;t get enough of:
          </p>
          <div className="p-4.5 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-white/[0.04] inline-block max-w-xs">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">TOP ARTIST</span>
            <span className="text-2xl font-black text-white block mt-1">{topArtistName}</span>
          </div>
          <div className="space-y-2 mt-4 text-left max-w-xs mx-auto">
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block">RUNNERS UP</span>
            {sortedArtists.slice(1, 3).map(([artist, count], i) => (
              <div key={artist} className="flex justify-between items-center text-xs text-zinc-400">
                <span>{i + 2}. {artist}</span>
                <span className="font-mono text-[10px] text-zinc-650">{count} plays</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Slide 3: Badges & Streaks
    {
      title: "Achievements Unlocked",
      content: (
        <div className="space-y-6 text-center select-none">
          <div className="w-16 h-16 rounded-full bg-teal-550/15 flex items-center justify-center text-teal-400 mx-auto">
            <Award size={28} />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mt-4">
            You&apos;re a Connoisseur.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Based on your stream consistency and 14-day listening streak:
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-left">
              <span className="text-[8px] text-teal-400 font-bold uppercase tracking-wider">Listening level</span>
              <span className="text-lg font-black text-white block mt-0.5">Level {Math.floor(totalPlayed / 10) + 1}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-left">
              <span className="text-[8px] text-amber-400 font-bold uppercase tracking-wider">Top badge</span>
              <span className="text-lg font-black text-white block mt-0.5">Pioneer</span>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 4: Summary Story Card
    {
      title: "Share Your Sound",
      content: (
        <div className="space-y-6 text-center select-none">
          {/* Card mock template */}
          <div
            className="w-64 p-6 rounded-[28px] bg-gradient-to-br from-purple-900/40 via-[#07070a] to-pink-900/30 border border-white/[0.08] mx-auto text-left relative overflow-hidden shadow-2xl"
            id="wrapped-card"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
            <span className="text-[8px] text-purple-400 font-black uppercase tracking-[0.2em]">MusicFlow Wrapped</span>
            <h3 className="font-display text-2xl font-black text-white mt-1 select-none">My Year.</h3>
            
            <div className="space-y-4 mt-6">
              <div>
                <span className="text-[8px] text-zinc-555 font-bold uppercase tracking-wider">Listen time</span>
                <p className="text-lg font-mono font-black text-purple-300">{totalHours} Hours</p>
              </div>
              <div>
                <span className="text-[8px] text-zinc-555 font-bold uppercase tracking-wider">Top artist</span>
                <p className="text-base font-black text-white truncate">{topArtistName}</p>
              </div>
              <div>
                <span className="text-[8px] text-zinc-555 font-bold uppercase tracking-wider">Profile badge</span>
                <p className="text-sm font-black text-pink-300 flex items-center gap-1">
                  ⭐ Pioneer Member
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-2 mx-auto active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <Share2 size={13} /> {copied ? "Copied Link!" : "Share Wrapped"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
      {/* Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-zinc-950/95 border border-white/[0.06] rounded-[32px] overflow-hidden relative shadow-[0_24px_80px_rgba(0,0,0,0.85)] p-6 sm:p-8 flex flex-col justify-between min-h-[460px]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Title */}
        <div className="text-left mb-6 select-none shrink-0 pr-10">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400">Personal Insights</span>
          <h1 className="font-display text-xl font-black text-zinc-200 mt-1">{slides[currentSlide].title}</h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {slides[currentSlide].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Progress / Controls */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-5 mt-6 shrink-0">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide ? "bg-purple-550 w-5" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentSlide((c) => Math.max(0, c - 1))}
              disabled={currentSlide === 0}
              className={`w-9 h-9 rounded-full border border-white/[0.05] flex items-center justify-center transition cursor-pointer ${
                currentSlide === 0 ? "text-zinc-700 bg-transparent opacity-40 cursor-not-allowed" : "text-white bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentSlide((c) => Math.min(slides.length - 1, c + 1))}
              disabled={currentSlide === slides.length - 1}
              className={`w-9 h-9 rounded-full border border-white/[0.05] flex items-center justify-center transition cursor-pointer ${
                currentSlide === slides.length - 1 ? "text-zinc-700 bg-transparent opacity-40 cursor-not-allowed" : "text-white bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
