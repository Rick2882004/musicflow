"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { SongCard } from "@/components/ui/SongCard";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import { Play, ListMusic, Heart, History, Compass, Plus, Disc, Music } from "lucide-react";
import { Track } from "@/types/music";
import { useHasMounted } from "@/hooks/useHasMounted";
import { SafeImage } from "@/components/ui/SafeImage";

const ALBUM_CARDS = [
  { id: "MPREb_HtIOxExZ0cj", title: "Arijit Singh Hits", artist: "Arijit Singh", image: "https://img.youtube.com/vi/T94PHkuyd8c/hqdefault.jpg" },
  { id: "MPREb_FCKWeH9GnWF", title: "Jigra Collection", artist: "Achint", image: "https://yt3.googleusercontent.com/F8s9lSInfQQu6PvEl23by6_KPoazHLcjk4226uEZqcabT7w_QQP4IX8nxutH5pLJOtwAi32VfMhRJPo=w226-h226-l90-rj" },
  { id: "MPREb_aak6B9FGA6U", title: "Bollywood Essentials", artist: "Various Artists", image: "https://yt3.googleusercontent.com/FPXzFBDqz2viDjL-yyPFSVLyzc8dv9uLHBVyJIfSc1hTQiGe6Lie2fbVRhMjpYtMD1NLcNo_l3T9Mg=w226-h226-l90-rj" },
  { id: "MPREb_HtIOxExZ0ck", title: "Lofi Bollywood", artist: "Lofi Fruit", image: "https://img.youtube.com/vi/JgP0vE3D-g8/hqdefault.jpg" },
];

export default function LibraryPage() {
  const router = useRouter();
  const mounted = useHasMounted();
  const { likedSongs, playlists, recentSongs, setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      likedSongs:  s.likedSongs,
      playlists:   s.playlists,
      recentSongs: s.recentSongs,
      setTrack:    s.setTrack,
      setQueue:    s.setQueue,
    }))
  );

  const uniqueRecentSongs = Array.from(
    new Map(recentSongs.map((song) => [song.videoId, song])).values()
  );

  const totalTracksCount = likedSongs.length + playlists.reduce((acc, p) => acc + p.songs.length, 0);

  const playSong = (song: Track, index: number) => {
    setQueue(uniqueRecentSongs);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  if (!mounted) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center">
          <div className="text-zinc-450 text-xl font-bold animate-pulse">Loading My Library...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-16" style={{ background: "#07070A" }}>

        {/* 1. Hero & Stats Container */}
        <section className="relative px-4 md:px-10 pt-6 md:pt-10 pb-6 overflow-hidden">
          {/* Ambient Background Glow */}
          <div className="absolute top-0 left-[-10%] w-[600px] h-[400px] rounded-full bg-purple-950/[0.08] blur-[140px] pointer-events-none" />
          <div className="absolute top-20 right-0 w-[450px] h-[320px] rounded-full bg-pink-950/[0.06] blur-[120px] pointer-events-none" />

          {/* Glass Hero Container */}
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
                  <Disc size={11} className="text-purple-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">
                    MY COLLECTION
                  </span>
                </div>

                {/* Title */}
                <h1 className="font-display text-[44px] sm:text-[68px] font-black leading-[0.92] tracking-tighter text-white select-none">
                  Your Library.
                </h1>

                {/* Subtitle */}
                <p className="text-sm md:text-base text-zinc-500 font-medium leading-relaxed">
                  Everything you love, in one place. Access your playlists, favorite songs, and recently listened tracks.
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3 shrink-0 lg:w-[380px]">
                {/* Stat: Liked */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Heart size={11} className="text-pink-500" /> Liked
                  </span>
                  <span className="text-2xl font-black text-white">{likedSongs.length}</span>
                </div>

                {/* Stat: Playlists */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ListMusic size={11} className="text-purple-400" /> Playlists
                  </span>
                  <span className="text-2xl font-black text-white">{playlists.length}</span>
                </div>

                {/* Stat: Recent */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <History size={11} className="text-indigo-400" /> Recent
                  </span>
                  <span className="text-2xl font-black text-white">{recentSongs.length}</span>
                </div>

                {/* Stat: Total */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Music size={11} className="text-teal-400" /> Total Tracks
                  </span>
                  <span className="text-2xl font-black text-white">{totalTracksCount}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 2. Quick Access Cards */}
        <section className="px-4 md:px-10 space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              Shortcuts
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Quick Access
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Card 1: Liked Songs */}
            <Link href="/liked">
              <motion.div
                whileHover={{ y: -6 }}
                className="group relative h-40 p-5 rounded-3xl cursor-pointer bg-gradient-to-br from-pink-500/10 to-transparent border border-white/[0.04] hover:border-pink-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform duration-300">
                  <Heart size={18} fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-display text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors">
                    Liked Songs
                  </h3>
                  <p className="text-[10px] text-pink-400/80 font-bold mt-1 uppercase tracking-wider">
                    {likedSongs.length} Tracks
                  </p>
                </div>
              </motion.div>
            </Link>

            {/* Card 2: Recently Played */}
            <Link href="/recently-played">
              <motion.div
                whileHover={{ y: -6 }}
                className="group relative h-40 p-5 rounded-3xl cursor-pointer bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/[0.04] hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="font-display text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors">
                    Recently Played
                  </h3>
                  <p className="text-[10px] text-indigo-400/80 font-bold mt-1 uppercase tracking-wider">
                    {recentSongs.length} Tracks
                  </p>
                </div>
              </motion.div>
            </Link>

            {/* Card 3: Your Playlists */}
            <Link href="/playlists">
              <motion.div
                whileHover={{ y: -6 }}
                className="group relative h-40 p-5 rounded-3xl cursor-pointer bg-gradient-to-br from-purple-500/10 to-transparent border border-white/[0.04] hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform duration-300">
                  <ListMusic size={18} />
                </div>
                <div>
                  <h3 className="font-display text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors">
                    Your Playlists
                  </h3>
                  <p className="text-[10px] text-purple-400/80 font-bold mt-1 uppercase tracking-wider">
                    {playlists.length} Playlists
                  </p>
                </div>
              </motion.div>
            </Link>

            {/* Card 4: Discover Music */}
            <Link href="/explore">
              <motion.div
                whileHover={{ y: -6 }}
                className="group relative h-40 p-5 rounded-3xl cursor-pointer bg-gradient-to-br from-teal-500/10 to-transparent border border-white/[0.04] hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform duration-300">
                  <Compass size={18} />
                </div>
                <div>
                  <h3 className="font-display text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors">
                    Discover Music
                  </h3>
                  <p className="text-[10px] text-teal-400/80 font-bold mt-1 uppercase tracking-wider">
                    Explore
                  </p>
                </div>
              </motion.div>
            </Link>

          </div>
        </section>

        {/* 3. Continue Listening (Uses Home song cards) */}
        {uniqueRecentSongs.length > 0 && (
          <section className="px-4 md:px-10 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
                  Resume
                </p>
                <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                  Continue Listening
                </h2>
              </div>
              <Link href="/recently-played" className="text-[11px] text-zinc-500 hover:text-zinc-350 transition-colors font-bold uppercase tracking-wider">
                See all
              </Link>
            </div>
            <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
              {uniqueRecentSongs.slice(0, 8).map((song, index) => (
                <div
                  key={`lib-recent-${song.videoId}-${index}`}
                  onClick={() => playSong(song, index)}
                  className="shrink-0 w-[160px] md:w-[180px] cursor-pointer"
                >
                  <SongCard
                    song={{
                      id:        song.videoId,
                      title:     song.title,
                      artist:    song.artist,
                      thumbnail: song.thumbnail,
                      duration:  song.duration || 0,
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Recently Added */}
        <section className="px-4 md:px-10 space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              History
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Recently Added
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {ALBUM_CARDS.map((album) => (
              <motion.div
                key={`added-${album.id}`}
                whileHover={{ y: -6 }}
                onClick={() => router.push(`/album/${album.id}`)}
                className="group flex flex-col gap-3 cursor-pointer text-left"
              >
                <div className="relative rounded-[22px] overflow-hidden bg-zinc-900 aspect-square border border-white/[0.05] group-hover:border-purple-500/35 transition-all duration-300 shadow-md">
                  <SafeImage
                    src={album.image}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackType="album"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={14} fill="white" className="text-white" />
                  </div>
                </div>
                <div className="px-0.5">
                  <p className="font-display text-[13px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate">
                    {album.title}
                  </p>
                  <p className="text-[11px] text-zinc-555 truncate mt-0.5">{album.artist}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. Your Playlists */}
        <section className="px-4 md:px-10 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
                Saved Collections
              </p>
              <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                Your Playlists
              </h2>
            </div>
            <Link href="/playlists">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-5 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all"
              >
                <Plus size={13} /> New Playlist
              </motion.button>
            </Link>
          </div>

          {playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {playlists.slice(0, 4).map((playlist) => (
                <Link href={`/playlists/${playlist.id}`} key={playlist.id}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="group flex flex-col gap-3 cursor-pointer focus:outline-none"
                  >
                    <div className="relative aspect-square rounded-[22px] overflow-hidden bg-zinc-900 border border-white/[0.05] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                      {playlist.songs[0] ? (
                        <SafeImage
                          src={playlist.songs[0].thumbnail}
                          videoId={playlist.songs[0].videoId}
                          alt={playlist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          fallbackType="song"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-950 border border-white/[0.02]">
                          <ListMusic size={36} className="text-zinc-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg">
                          <Play size={16} fill="black" className="text-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                        {playlist.name}
                      </h3>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-555">
                        <span>{playlist.songs.length} Songs</span>
                        <span className="text-[10px] text-zinc-650 font-medium">Updated recently</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="p-10 rounded-[24px] text-center flex flex-col items-center border border-white/[0.04]"
              style={{ background: "rgba(255,255,255,0.01)" }}
            >
              <ListMusic size={34} className="text-zinc-700 mb-3" />
              <p className="text-[13px] text-zinc-400 font-semibold">No playlists created yet</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Click the button above to build your first collection.</p>
            </div>
          )}
        </section>

        {/* 6. Recommended For You */}
        <section className="px-4 md:px-10 space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              Personalized
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Recommended For You
            </h2>
          </div>
          <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
            {ALBUM_CARDS.map((album) => (
              <motion.div
                key={`rec-${album.id}`}
                whileHover={{ y: -6 }}
                onClick={() => router.push(`/album/${album.id}`)}
                className="group shrink-0 w-[140px] md:w-[160px] flex flex-col gap-3 cursor-pointer text-left"
              >
                <div className="relative rounded-[20px] overflow-hidden bg-zinc-900 aspect-square border border-white/[0.05] group-hover:border-purple-500/35 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                  <SafeImage
                    src={album.image}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackType="album"
                  />
                </div>
                <div className="px-0.5">
                  <p className="font-display text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate">
                    {album.title}
                  </p>
                  <p className="text-[10px] text-zinc-555 font-medium truncate mt-0.5">{album.artist}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </main>
    </ProtectedRoute>
  );
}