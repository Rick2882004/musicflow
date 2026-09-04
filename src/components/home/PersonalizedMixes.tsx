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
    <section className="px-4 md:px-8 select-none text-left">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
            Crafted for you
          </p>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Personalized Mixes
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mixes.map((mix) => (
          <motion.div
            key={mix.id}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={() => handlePlayMix(mix.tracks)}
            className="group relative p-4 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden border border-white/[0.06] bg-[#121216] hover:bg-white/[0.04] hover:border-white/10"
          >

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${mix.iconColor}`}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--mf-border)" }}
              >
                <mix.icon size={18} />
              </div>

              <div
                className="w-9 h-9 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-md"
                style={{ background: "var(--mf-accent)", color: "#fff" }}
              >
                <Play size={14} fill="currentColor" className="ml-0.5" />
              </div>
            </div>

            <div className="relative z-10 text-left">
              <h3 className="text-[14px] font-bold text-white tracking-tight leading-snug group-hover:text-purple-300 transition-colors">
                {mix.title}
              </h3>
              <p
                className="text-[11px] truncate mt-1 font-medium"
                style={{ color: "var(--mf-text-muted)" }}
              >
                {mix.subtitle}
              </p>
            </div>

            {/* Subtle multi-art preview thumbnails */}
            {mix.tracks.length > 0 && (
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.04] relative z-10">
                <div className="flex -space-x-2 overflow-hidden">
                  {mix.tracks.slice(0, 3).map((track, i) => (
                    <div
                      key={i}
                      className="inline-block w-6 h-6 rounded-full ring-1 ring-zinc-950 overflow-hidden bg-zinc-900"
                    >
                      <SafeImage
                        src={track.thumbnail}
                        videoId={track.videoId}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <span
                  className="text-[9px] font-mono tracking-wider ml-1"
                  style={{ color: "var(--mf-text-dim)" }}
                >
                  {mix.tracks.length} tracks
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
