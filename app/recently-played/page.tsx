"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { SongCard } from "@/components/ui/SongCard";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { motion, Variants } from "framer-motion";
import { History, Play, Shuffle, Clock, Music, Disc, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Track } from "@/types/music";

const FAVORITE_ARTISTS = [
  { name: "Arijit Singh", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80" },
  { name: "Atif Aslam", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80" },
  { name: "KK", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80" },
];

const RECOMMENDED_ALBUMS = [
  { id: "MPREb_HtIOxExZ0cj", title: "Arijit Singh Hits", artist: "Arijit Singh", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80" },
  { id: "MPREb_FCKWeH9GnWF", title: "Jigra Collection", artist: "Achint", image: "https://yt3.googleusercontent.com/F8s9lSInfQQu6PvEl23by6_KPoazHLcjk4226uEZqcabT7w_QQP4IX8nxutH5pLJOtwAi32VfMhRJPo=w226-h226-l90-rj" },
  { id: "MPREb_aak6B9FGA6U", title: "Bollywood Essentials", artist: "Various Artists", image: "https://yt3.googleusercontent.com/FPXzFBDqz2viDjL-yyPFSVLyzc8dv9uLHBVyJIfSc1hTQiGe6Lie2fbVRhMjpYtMD1NLcNo_l3T9Mg=w226-h226-l90-rj" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function RecentlyPlayedPage() {
  const router = useRouter();
  const { recentSongs, setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      recentSongs: s.recentSongs,
      setTrack:    s.setTrack,
      setQueue:    s.setQueue,
    }))
  );

  const uniqueRecentSongs = Array.from(
    new Map(recentSongs.map((song) => [song.videoId, song])).values()
  );

  const totalTracksCount = uniqueRecentSongs.length;
  const listeningHours = Math.round(totalTracksCount * 3.5 / 60 * 10) / 10;

  const playSong = (song: Track, index: number) => {
    setQueue(uniqueRecentSongs);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const playAll = () => {
    if (uniqueRecentSongs.length === 0) return;
    setQueue(uniqueRecentSongs);
    const s = uniqueRecentSongs[0];
    setTrack(s.videoId, s.title, s.artist, s.thumbnail, 0);
  };

  // Group songs into simulated timeline
  const todaySongs = uniqueRecentSongs.slice(0, 2);
  const yesterdaySongs = uniqueRecentSongs.slice(2, 4);
  const thisWeekSongs = uniqueRecentSongs.slice(4, 6);
  const earlierSongs = uniqueRecentSongs.slice(6);

  // Derive favorite artist / genre
  const favoriteArtist = uniqueRecentSongs[0]?.artist || "Arijit Singh";
  const favoriteGenre = "Bollywood Hits";

  if (uniqueRecentSongs.length === 0) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen pb-36 text-white" style={{ background: "#07070A" }}>
          {/* Ambient blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-violet-800/[0.05] blur-[150px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-[32px] bg-white/[0.015] border border-white/[0.04] flex flex-col items-center max-w-sm"
              style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 mb-6">
                <History size={26} />
              </div>
              <h2 className="font-display text-[22px] font-black text-white mb-2">
                Listening history is empty
              </h2>
              <p className="text-[12px] text-zinc-500 leading-relaxed mb-6">
                Songs you play will appear here so you can easily resume listening later.
              </p>
              <Link href="/explore">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-6 py-2.5 rounded-full font-bold text-xs bg-white text-black hover:bg-zinc-150 transition active:scale-95 cursor-pointer shadow-md"
                >
                  Find Songs
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-16" style={{ background: "#07070A" }}>

        {/* 1. Hero & Stats */}
        <section className="relative px-6 md:px-10 pt-10 pb-6 overflow-hidden">
          {/* Ambient Background Glow */}
          <div className="absolute top-0 left-[-10%] w-[600px] h-[400px] rounded-full bg-violet-950/[0.08] blur-[140px] pointer-events-none" />
          <div className="absolute top-20 right-0 w-[450px] h-[320px] rounded-full bg-indigo-950/[0.06] blur-[120px] pointer-events-none" />

          {/* Glass Hero Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 p-6 md:p-10 rounded-[32px] bg-white/[0.015] border border-white/[0.04] backdrop-blur-2xl"
            style={{ boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)" }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              
              <div className="space-y-4 max-w-xl">
                {/* Small Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
                  <History size={11} className="text-purple-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">
                    LISTEN TIMELINE
                  </span>
                </div>

                {/* Title */}
                <h1 className="font-display text-[44px] sm:text-[68px] font-black leading-[0.92] tracking-tighter text-white select-none">
                  Recently Played.
                </h1>

                {/* Subtitle */}
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                  Continue where you left off. Review your listening habits and resume previous tracks.
                </p>

                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={playAll}
                    className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-150 text-black font-black text-xs flex items-center gap-2 shadow-md"
                  >
                    <Play size={12} fill="black" className="text-black ml-0.5" /> Play All
                  </motion.button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-3 shrink-0 lg:w-[380px]">
                {/* Tracks played */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Music size={11} className="text-purple-400" /> Tracks Played
                  </span>
                  <span className="text-2xl font-black text-white">{totalTracksCount}</span>
                </div>

                {/* Listening Hours */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={11} className="text-indigo-400" /> Listening Hours
                  </span>
                  <span className="text-2xl font-black text-white">{listeningHours}h</span>
                </div>

                {/* Favorite Artist */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Disc size={11} className="text-teal-400" /> Top Artist
                  </span>
                  <span className="text-sm font-black text-zinc-200 truncate">{favoriteArtist}</span>
                </div>

                {/* Favorite Genre */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={11} className="text-pink-400" /> Top Genre
                  </span>
                  <span className="text-sm font-black text-zinc-200 truncate">{favoriteGenre}</span>
                </div>
              </div>

            </div>
          </motion.div>
        </section>

        {/* 2. Continue Listening (Resume widgets with progress indicators) */}
        <section className="px-6 md:px-10 space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              Resume
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Continue Listening
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {uniqueRecentSongs.slice(0, 3).map((song, i) => (
              <motion.div
                key={`resume-${song.videoId}-${i}`}
                whileHover={{ y: -6 }}
                onClick={() => playSong(song, i)}
                className="group relative p-4 rounded-3xl bg-white/[0.015] border border-white/[0.04] hover:border-purple-500/20 hover:bg-white/[0.035] transition-all duration-300 flex gap-4 cursor-pointer overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/5 shadow-sm bg-zinc-950">
                  <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0 flex flex-col justify-center text-left">
                  <h3 className="font-display text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                    {song.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                  
                  {/* Progress bar simulation */}
                  <div className="w-full bg-white/[0.04] h-1 rounded-full mt-3 overflow-hidden">
                    <div className="bg-purple-550 h-full w-[45%] rounded-full group-hover:bg-purple-400 transition-colors" />
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.03] group-hover:bg-white text-zinc-500 group-hover:text-black transition">
                  <Play size={10} fill="currentColor" className="ml-0.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3. Listening Timeline */}
        <section className="px-6 md:px-10 space-y-8">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              Chronology
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Listening Timeline
            </h2>
          </div>

          <div className="relative border-l border-white/[0.04] ml-3 pl-8 space-y-12">
            
            {/* Today */}
            {todaySongs.length > 0 && (
              <div className="relative">
                <div className="absolute left-[-41px] top-1.5 w-6 h-6 rounded-full bg-purple-900 border border-purple-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div className="space-y-4">
                  <h4 className="font-display text-xs font-black text-zinc-400 uppercase tracking-widest">Today</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
                    {todaySongs.map((song, index) => (
                      <SongCard key={`today-${song.videoId}-${index}`} song={{ id: song.videoId, title: song.title, artist: song.artist, thumbnail: song.thumbnail, duration: song.duration || 0 }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Yesterday */}
            {yesterdaySongs.length > 0 && (
              <div className="relative">
                <div className="absolute left-[-41px] top-1.5 w-6 h-6 rounded-full bg-zinc-900 border border-white/[0.1] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                </div>
                <div className="space-y-4">
                  <h4 className="font-display text-xs font-black text-zinc-400 uppercase tracking-widest">Yesterday</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
                    {yesterdaySongs.map((song, index) => (
                      <SongCard key={`yesterday-${song.videoId}-${index}`} song={{ id: song.videoId, title: song.title, artist: song.artist, thumbnail: song.thumbnail, duration: song.duration || 0 }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* This Week */}
            {thisWeekSongs.length > 0 && (
              <div className="relative">
                <div className="absolute left-[-41px] top-1.5 w-6 h-6 rounded-full bg-zinc-900 border border-white/[0.1] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                </div>
                <div className="space-y-4">
                  <h4 className="font-display text-xs font-black text-zinc-400 uppercase tracking-widest">This Week</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
                    {thisWeekSongs.map((song, index) => (
                      <SongCard key={`week-${song.videoId}-${index}`} song={{ id: song.videoId, title: song.title, artist: song.artist, thumbnail: song.thumbnail, duration: song.duration || 0 }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Earlier */}
            {earlierSongs.length > 0 && (
              <div className="relative">
                <div className="absolute left-[-41px] top-1.5 w-6 h-6 rounded-full bg-zinc-900 border border-white/[0.1] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                </div>
                <div className="space-y-4">
                  <h4 className="font-display text-xs font-black text-zinc-400 uppercase tracking-widest">Earlier</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
                    {earlierSongs.map((song, index) => (
                      <SongCard key={`earlier-${song.videoId}-${index}`} song={{ id: song.videoId, title: song.title, artist: song.artist, thumbnail: song.thumbnail, duration: song.duration || 0 }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* 4. Favorite Artists */}
        <section className="px-6 md:px-10 space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              Top Picks
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Favorite Artists
            </h2>
          </div>
          <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
            {FAVORITE_ARTISTS.map((artist) => (
              <motion.div
                key={artist.name}
                whileHover={{ y: -6 }}
                onClick={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
                className="group flex flex-col items-center gap-3 cursor-pointer shrink-0 w-24"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-950 border border-white/[0.05] group-hover:border-purple-500/30 transition-all duration-300 shadow-md">
                  <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate w-full">{artist.name}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. Recommended Again */}
        <section className="px-6 md:px-10 space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              Re-discover
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Recommended Again
            </h2>
          </div>
          <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
            {RECOMMENDED_ALBUMS.map((album) => (
              <motion.div
                key={`rec-album-${album.id}`}
                whileHover={{ y: -6 }}
                onClick={() => router.push(`/album/${album.id}`)}
                className="group shrink-0 w-[140px] md:w-[160px] flex flex-col gap-3 cursor-pointer text-left"
              >
                <div className="relative rounded-[20px] overflow-hidden bg-zinc-900 aspect-square border border-white/[0.05] group-hover:border-purple-500/35 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                  <img src={album.image} alt={album.title} className="w-full h-full object-cover" />
                </div>
                <div className="px-0.5">
                  <p className="font-display text-[12px] font-bold text-zinc-300 group-hover:text-white truncate leading-tight tracking-tight">{album.title}</p>
                  <p className="text-[10px] text-zinc-555 truncate mt-0.5">{album.artist}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </main>
    </ProtectedRoute>
  );
}