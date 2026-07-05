"use client";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { SongCard } from "@/components/ui/SongCard";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import { Play, Shuffle, Heart, Clock, Music } from "lucide-react";
import Link from "next/link";

export default function LikedSongsPage() {
  const {
    likedSongs,
    setTrack,
    setQueue,
    toggleLike,
  } = usePlayerStore(useShallow((s) => ({
    likedSongs: s.likedSongs,
    setTrack: s.setTrack,
    setQueue: s.setQueue,
    toggleLike: s.toggleLike,
  })));

  const totalDuration = likedSongs.reduce((acc, song) => acc + (song.duration || 0), 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-black text-white pb-32">
        {/* Premium Hero */}
        <div className="relative overflow-hidden bg-gradient-to-b from-pink-900/40 to-black px-8 pt-24 pb-12 border-b border-white/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-600/20 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
          
          <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 0.5, type: "spring" }}
              className="w-48 h-48 md:w-60 md:h-60 shrink-0 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-pink-500/30 border border-white/20"
            >
              <Heart size={80} className="text-white drop-shadow-xl" fill="currentColor" />
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-center md:text-left">
              <span className="text-xs font-bold tracking-widest uppercase text-pink-400 mb-2 block">Playlist</span>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6">Liked Songs</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-zinc-300 font-medium">
                <span className="text-white font-bold">Your Library</span>
                <span>•</span>
                <span>{likedSongs.length} songs</span>
                {likedSongs.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {hours > 0 ? `${hours} hr ` : ''}{minutes} min</span>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          {likedSongs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex items-center gap-4 mb-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setQueue(likedSongs);
                  const firstSong = likedSongs[0];
                  setTrack(firstSong.videoId, firstSong.title, firstSong.artist, firstSong.thumbnail, 0);
                }}
                className="w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-black shadow-lg shadow-green-500/30 transition-colors"
                aria-label="Play All"
              >
                <Play size={24} className="ml-1" fill="currentColor" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
                  setQueue(shuffled);
                  setTrack(shuffled[0].videoId, shuffled[0].title, shuffled[0].artist, shuffled[0].thumbnail, 0);
                }}
                className="w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Shuffle"
              >
                <Shuffle size={20} />
              </motion.button>
            </motion.div>
          )}

          {likedSongs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/20 border border-white/5 rounded-3xl backdrop-blur-sm"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Music size={40} className="text-zinc-500" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-white">Songs you like will appear here</h2>
              <p className="text-zinc-400 max-w-md mb-8">Save songs by tapping the heart icon. We'll keep them all in this special playlist for you.</p>
              <Link href="/explore">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-3 bg-white text-black font-bold rounded-full shadow-lg hover:shadow-white/20 transition-shadow">
                  Find Songs
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {likedSongs.map((song: any, index: number) => (
                <motion.div key={`${song.videoId}-${index}`} variants={item} className="relative group">
                  <SongCard
                    song={{
                      id: song.videoId,
                      title: song.title,
                      artist: song.artist,
                      thumbnail: song.thumbnail,
                      duration: song.duration || 0,
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}