"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const moods = [
  { name: "Romance", emoji: "💕", color: "hover:border-pink-500/30 hover:bg-pink-500/5 hover:text-pink-300" },
  { name: "Workout", emoji: "⚡", color: "hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-300" },
  { name: "Chill", emoji: "🌊", color: "hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-teal-300" },
  { name: "Focus", emoji: "🎯", color: "hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-300" },
  { name: "Party", emoji: "🎉", color: "hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-300" },
  { name: "Sleep", emoji: "🌙", color: "hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300" },
  { name: "Bollywood", emoji: "🎬", color: "hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300" },
  { name: "Punjabi", emoji: "🥁", color: "hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-300" },
  { name: "Lo-Fi", emoji: "☁️", color: "hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-indigo-300" },
];

export default function MoodSection() {
  const router = useRouter();

  return (
    <section className="px-6 md:px-10 pb-14 text-left">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
          Vibe
        </p>
        <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
          Moods &amp; Genres
        </h2>
      </div>

      {/* Pill cloud */}
      <div className="flex flex-wrap gap-2.5">
        {moods.map((mood, idx) => (
          <motion.button
            key={mood.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: idx * 0.02 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/search?q=${encodeURIComponent(mood.name)}`)}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-white/[0.015] border border-white/[0.05] text-[12px] font-bold text-zinc-400 transition-all duration-200 cursor-pointer select-none focus:outline-none ${mood.color}`}
          >
            <span>{mood.emoji}</span>
            <span>{mood.name}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}