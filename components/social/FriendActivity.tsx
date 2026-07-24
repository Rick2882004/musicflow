"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Users, Music, Play, Radio } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Track } from "@/types/music";

export function FriendActivity() {
  const { setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  // Dynamic friend activities state (defaults to empty when no active social session)
  const activeFriends: Array<{
    id: string;
    name: string;
    status: string;
    track: Track | null;
    active: string;
    avatar: string;
    online: boolean;
  }> = [];

  const tuneIn = (track: Track) => {
    if (!track) return;
    setQueue([track]);
    setTrack(track.videoId, track.title, track.artist, track.thumbnail, 0);
  };

  return (
    <div className="w-72 hidden xl:flex flex-col h-full rounded-[24px] bg-[#07070a] md:bg-zinc-950/20 border border-white/[0.05] p-5 overflow-hidden text-left relative z-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] select-none">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-purple-950/[0.08] blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.04] mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-purple-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 select-none">
            Friend Activity
          </span>
        </div>
      </div>

      {/* Content Body */}
      {activeFriends.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-4.5 scrollbar-none pr-1">
          {activeFriends.map((friend, idx) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="flex gap-3 group relative cursor-pointer"
            >
              <div className="relative shrink-0 w-10 h-10">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/[0.08]">
                  <SafeImage src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" fallbackType="artist" />
                </div>
                {friend.online ? (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#07070a] shadow-[0_0_8px_#10b981]" />
                ) : (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-zinc-600 border-2 border-[#07070a]" />
                )}
              </div>

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

                {friend.track && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => tuneIn(friend.track!)}
                    className="mt-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-purple-500/20 flex items-center justify-between gap-2.5 group/track"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-white/5 relative">
                        <SafeImage src={friend.track.thumbnail} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/track:opacity-100 transition-opacity">
                          <Play size={8} fill="white" className="text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[9px] font-bold text-zinc-300 truncate leading-tight group-hover/track:text-white transition-colors">
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
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-zinc-600">
            <Radio size={20} className="text-zinc-500" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-300">Quiet for Now</h3>
            <p className="text-[10px] text-zinc-550 mt-1 leading-relaxed">
              Connect with friends on MusicFlow to see their live listening activity and tune in together.
            </p>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="pt-3.5 border-t border-white/[0.04] mt-auto flex items-center gap-1.5 justify-center text-zinc-500 shrink-0">
        <Users size={11} className="text-purple-400" />
        <span className="text-[8px] font-mono tracking-wider uppercase font-bold select-none">
          Social Session Active
        </span>
      </div>
    </div>
  );
}
