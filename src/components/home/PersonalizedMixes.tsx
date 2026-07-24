"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Play, Sparkles, Heart, Flame, Radio } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Track } from "@/types/music";

export default function PersonalizedMixes() {
  const { recentSongs, likedSongs, setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      recentSongs: s.recentSongs,
      likedSongs: s.likedSongs,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  const mixes = [
    {
      id: "daily-mix-1",
      title: "Daily Mix 1",
      subtitle: "Arijit Singh, Sachet Tandon & More",
      gradient: "from-purple-600/30 to-indigo-900/40",
      border: "hover:border-purple-500/40",
      icon: Sparkles,
      iconColor: "text-purple-400",
      tracks: recentSongs.slice(0, 6),
    },
    {
      id: "recently-loved",
      title: "Recently Loved",
      subtitle: `${likedSongs.length} Liked Tracks`,
      gradient: "from-pink-600/30 to-rose-900/40",
      border: "hover:border-pink-500/40",
      icon: Heart,
      iconColor: "text-pink-400",
      tracks: likedSongs.slice(0, 6),
    },
    {
      id: "most-played",
      title: "Most Played Hits",
      subtitle: "Your Heavy Rotation",
      gradient: "from-amber-600/30 to-orange-900/40",
      border: "hover:border-amber-500/40",
      icon: Flame,
      iconColor: "text-amber-400",
      tracks: recentSongs.slice(0, 6),
    },
    {
      id: "hidden-gems",
      title: "Discover Weekly",
      subtitle: "Fresh tracks picked for you",
      gradient: "from-cyan-600/30 to-blue-900/40",
      border: "hover:border-cyan-500/40",
      icon: Radio,
      iconColor: "text-cyan-400",
      tracks: recentSongs.slice(0, 6),
    },
  ];

  const handlePlayMix = (tracks: Track[]) => {
    if (!tracks || tracks.length === 0) return;
    setQueue(tracks);
    const first = tracks[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  return (
    <section className="px-4 md:px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400 mb-1 flex items-center gap-1.5">
            <Sparkles size={11} /> Crafted For You
          </p>
          <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
            Personalized Mixes
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {mixes.map((mix) => (
          <motion.div
            key={mix.id}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={() => handlePlayMix(mix.tracks)}
            className={`group relative p-5 rounded-3xl bg-gradient-to-br ${mix.gradient} border border-white/[0.06] ${mix.border} transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl shadow-xl`}
          >
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.03] blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center ${mix.iconColor}`}>
                <mix.icon size={20} />
              </div>

              <div className="w-10 h-10 rounded-full bg-purple-550 text-black flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                <Play size={18} fill="black" className="ml-0.5" />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <h3 className="font-display text-base font-black text-white tracking-tight leading-snug group-hover:text-purple-200 transition-colors">
                {mix.title}
              </h3>
              <p className="text-xs text-zinc-400 font-medium line-clamp-1">
                {mix.subtitle}
              </p>
            </div>

            {/* Thumbnail Preview Stack */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.05]">
              {mix.tracks.slice(0, 3).map((song, i) => (
                <div key={`${mix.id}-thumb-${i}`} className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                  <SafeImage src={song.thumbnail} videoId={song.videoId} alt={song.title} className="w-full h-full object-cover" />
                </div>
              ))}
              {mix.tracks.length === 0 && (
                <span className="text-[10px] text-zinc-500 font-semibold italic">Play songs to personalize</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
