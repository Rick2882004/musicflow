"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Sparkles, Zap, Brain, Smile, Radio } from "lucide-react";
import { Track } from "@/types/music";

const SURPRISE_TERMS = [
  "Best Songs 2024",
  "Iconic Bollywood Hits",
  "Lo-Fi Chill",
  "Global Top 50",
];

function getDiscoveryQuery(mode: string): string {
  if (mode === "surprise") {
    return SURPRISE_TERMS[Math.floor(Math.random() * SURPRISE_TERMS.length)];
  }
  if (mode === "quick-mix") {
    return "Upbeat Pop and Dance Hits";
  }
  if (mode === "deep-focus") {
    return "Lo-Fi Beats for Study and Work";
  }
  if (mode === "mood") {
    return "Late Night Romantic Melodies";
  }
  return "Trending Music";
}

function shuffleTracks(tracks: Track[]): Track[] {
  return [...tracks].sort(() => Math.random() - 0.5);
}

export function DiscoveryModesBar() {
  const router = useRouter();
  const [loadingMode, setLoadingMode] = useState<string | null>(null);

  const { setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  const handleDiscoveryMode = async (mode: string) => {
    setLoadingMode(mode);
    try {
      const query = getDiscoveryQuery(mode);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const results: Track[] = data.results || [];
        if (results.length > 0) {
          const shuffled = shuffleTracks(results);
          setQueue(shuffled);
          const first = shuffled[0];
          setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
        }
      }
    } catch (err) {
      console.error("Discovery mode failed:", err);
    } finally {
      setLoadingMode(null);
    }
  };

  const MODES = [
    {
      id: "surprise",
      label: "Surprise Me",
      icon: Sparkles,
      color: "text-purple-300",
      bg: "hover:border-purple-500/30 hover:bg-purple-500/10",
    },
    {
      id: "quick-mix",
      label: "Quick Mix",
      icon: Zap,
      color: "text-amber-300",
      bg: "hover:border-amber-500/30 hover:bg-amber-500/10",
    },
    {
      id: "deep-focus",
      label: "Deep Focus",
      icon: Brain,
      color: "text-teal-300",
      bg: "hover:border-teal-500/30 hover:bg-teal-500/10",
    },
    {
      id: "mood",
      label: "Mood Mode",
      icon: Smile,
      color: "text-pink-300",
      bg: "hover:border-pink-500/30 hover:bg-pink-500/10",
    },
  ];

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
          DISCOVERY MODES
        </p>
      </div>

      <div className="flex gap-2.5 overflow-x-auto scrollbar-none py-1">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isLoading = loadingMode === m.id;

          return (
            <motion.button
              key={m.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              disabled={Boolean(loadingMode)}
              onClick={() => handleDiscoveryMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/[0.05] text-[11px] font-bold text-zinc-300 transition-all cursor-pointer shrink-0 select-none ${m.bg}`}
            >
              <Icon size={12} className={isLoading ? "animate-spin text-purple-400" : m.color} />
              <span>{isLoading ? "Curating..." : m.label}</span>
            </motion.button>
          );
        })}

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/genres")}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-bold text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer shrink-0 select-none"
        >
          <Radio size={12} className="text-purple-400" />
          <span>Genre Radios →</span>
        </motion.button>
      </div>
    </div>
  );
}
