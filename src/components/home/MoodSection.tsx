"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function MoodSection() {
  const router = useRouter();

  const moods = [
    { name: "Romance", color: "from-pink-500/20 to-rose-500/20 border-pink-500/30" },
    { name: "Workout", color: "from-orange-500/20 to-red-500/20 border-orange-500/30" },
    { name: "Chill", color: "from-teal-500/20 to-emerald-500/20 border-teal-500/30" },
    { name: "Focus", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30" },
    { name: "Party", color: "from-purple-500/20 to-fuchsia-500/20 border-purple-500/30" },
    { name: "Sleep", color: "from-cyan-500/20 to-sky-500/20 border-cyan-500/30" },
    { name: "Bollywood", color: "from-red-500/20 to-pink-500/20 border-red-500/30" },
    { name: "Punjabi", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30" },
    { name: "LoFi", color: "from-violet-500/20 to-purple-500/20 border-violet-500/30" },
    { name: "Happy", color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30" },
    { name: "Sad", color: "from-slate-500/20 to-zinc-500/20 border-slate-500/30" },
  ];

  return (
    <section className="pb-16 mt-8">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white select-none">
          Moods & Genres
        </h2>
        <p className="text-xs text-zinc-500">Pick a playlist based on your mood</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {moods.map((mood, idx) => (
          <motion.button
            key={mood.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.03 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/search?q=${encodeURIComponent(mood.name)}`)}
            className={`px-6 py-3.5 rounded-2xl bg-gradient-to-br ${mood.color} border hover:shadow-lg hover:shadow-purple-500/5 text-zinc-200 hover:text-white text-xs font-bold transition-all duration-300 cursor-pointer`}
          >
            {mood.name}
          </motion.button>
        ))}
      </div>
    </section>
  );
}