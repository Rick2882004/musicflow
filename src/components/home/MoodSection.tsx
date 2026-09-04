"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const moods = [
  { name: "Focus", emoji: "🎯", color: "hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-300" },
  { name: "Workout", emoji: "⚡", color: "hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-300" },
  { name: "Relax", emoji: "🌊", color: "hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-teal-300" },
  { name: "Sleep", emoji: "🌙", color: "hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300" },
  { name: "Coding", emoji: "💻", color: "hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-indigo-300" },
  { name: "Party", emoji: "🎉", color: "hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-300" },
  { name: "Travel", emoji: "✈️", color: "hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-300" },
  { name: "Rainy Day", emoji: "🌧️", color: "hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-300" },
  { name: "Happy", emoji: "😊", color: "hover:border-yellow-500/30 hover:bg-yellow-500/5 hover:text-yellow-300" },
  { name: "Sad", emoji: "💧", color: "hover:border-blue-400/30 hover:bg-blue-400/5 hover:text-blue-200" },
  { name: "Study", emoji: "📚", color: "hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-violet-300" },
  { name: "Romance", emoji: "💖", color: "hover:border-pink-500/30 hover:bg-pink-500/5 hover:text-pink-300" },
  { name: "Bollywood", emoji: "🎬", color: "hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300" },
  { name: "Punjabi", emoji: "🥁", color: "hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-300" },
  { name: "Lo-Fi", emoji: "☁️", color: "hover:border-slate-500/30 hover:bg-slate-500/5 hover:text-slate-300" },
];

export default function MoodSection() {
  const router = useRouter();

  return (
    <section className="mf-section px-4 md:px-8 pb-12 text-left select-none">
      {/* Header */}
      <div className="mf-section-header">
        <div>
          <p
            className="text-[9px] font-black uppercase mb-1"
            style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
          >
            Genres &amp; Moods
          </p>
          <h2 className="mf-section-title">Explore by Vibe</h2>
        </div>
      </div>


      {/* Pill cloud */}
      <div className="flex overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 md:flex-wrap md:mx-0 md:px-0 gap-2">
        {moods.map((mood, idx) => (
          <motion.button
            key={mood.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: idx * 0.015 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/search?q=${encodeURIComponent(mood.name)}`)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all duration-150 cursor-pointer select-none focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--mf-border)",
              color: "var(--mf-text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.12)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--mf-border-accent)";
              (e.currentTarget as HTMLElement).style.color = "var(--mf-text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--mf-border)";
              (e.currentTarget as HTMLElement).style.color = "var(--mf-text-secondary)";
            }}
          >
            <span className="text-sm">{mood.emoji}</span>
            <span>{mood.name}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}