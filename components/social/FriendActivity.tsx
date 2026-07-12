"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Users, Music, Play, Flame } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Track } from "@/types/music";

const MOCK_FRIENDS = [
  {
    name: "Sarah Jenkins",
    status: "Listening to Kabir Singh",
    track: {
      videoId: "T94PHkuyd8c",
      title: "Tujhe Kitna Chahne Lage",
      artist: "Arijit Singh",
      thumbnail: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80",
    },
    active: "2m ago",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    online: true,
  },
  {
    name: "Alex Rivera",
    status: "Listening to Lofi Bollywood",
    track: {
      videoId: "JgP0vE3D-g8",
      title: "Channa Mereya (Lofi)",
      artist: "Lofi Fruit",
      thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    },
    active: "5m ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    online: true,
  },
  {
    name: "Rohan Sharma",
    status: "Offline",
    track: null,
    active: "3h ago",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
    online: false,
  },
];

export function FriendActivity() {
  const { setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  const tuneIn = (track: Track) => {
    if (!track) return;
    setQueue([track]);
    setTrack(track.videoId, track.title, track.artist, track.thumbnail, 0);
  };

  return (
    <div className="w-72 hidden xl:flex flex-col h-full rounded-[24px] bg-[#07070a] md:bg-zinc-950/20 border border-white/[0.05] p-5 overflow-hidden text-left relative z-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-purple-950/[0.08] blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.04] mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-purple-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-350 select-none">
            Friend Activity
          </span>
        </div>
      </div>

      {/* Friends list */}
      <div className="flex-1 overflow-y-auto space-y-4.5 scrollbar-none pr-1">
        {MOCK_FRIENDS.map((friend, idx) => (
          <motion.div
            key={friend.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="flex gap-3 group relative cursor-pointer"
          >
            {/* Avatar block with status dot */}
            <div className="relative shrink-0 w-10 h-10">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/[0.08]">
                <SafeImage src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" fallbackType="artist" />
              </div>
              {friend.online ? (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-550 border-2 border-[#07070a] shadow-[0_0_8px_#10b981]" />
              ) : (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-zinc-650 border-2 border-[#07070a]" />
              )}
            </div>

            {/* Friend details */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-200 truncate group-hover:text-purple-300 transition-colors leading-tight">
                  {friend.name}
                </span>
                <span className="text-[8px] font-mono text-zinc-600 font-medium shrink-0 ml-1">
                  {friend.active}
                </span>
              </div>

              <p className="text-[9px] text-zinc-500 font-semibold truncate leading-none">
                {friend.status}
              </p>

              {/* Listening track block */}
              {friend.track && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => tuneIn(friend.track)}
                  className="mt-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-purple-550/20 flex items-center justify-between gap-2.5 group/track"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-white/5 relative">
                      <SafeImage src={friend.track.thumbnail} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/track:opacity-100 transition-opacity">
                        <Play size={8} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[9px] font-bold text-zinc-350 truncate leading-tight group-hover/track:text-white transition-colors">
                        {friend.track.title}
                      </p>
                      <p className="text-[8px] text-zinc-600 truncate mt-0.5">
                        {friend.track.artist}
                      </p>
                    </div>
                  </div>
                  <Music size={9} className="text-purple-400 group-hover/track:animate-bounce shrink-0" />
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="pt-3.5 border-t border-white/[0.04] mt-4 flex items-center gap-1.5 justify-center text-zinc-650 shrink-0">
        <Flame size={11} className="text-purple-500/60" />
        <span className="text-[8px] font-mono tracking-wider uppercase font-bold select-none">
          Listening together is active
        </span>
      </div>
    </div>
  );
}
