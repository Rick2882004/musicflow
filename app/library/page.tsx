"use client";

import Link from "next/link";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { SongCard } from "@/components/ui/SongCard";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import { Play, ListMusic, Heart, History, Compass, Plus, User } from "lucide-react";

export default function LibraryPage() {
  const {
    likedSongs,
    playlists,
    recentSongs,
  } = usePlayerStore(useShallow((s) => ({
    likedSongs: s.likedSongs,
    playlists: s.playlists,
    recentSongs: s.recentSongs,
  })));

  const uniqueRecentSongs = Array.from(
    new Map(
      recentSongs.map((song) => [
        song.videoId,
        song,
      ])
    ).values()
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-black text-white pb-32">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black px-8 pt-16 pb-12 border-b border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen" />
          
          <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">Your Library</h1>
              <div className="flex items-center gap-3 text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5"><Heart size={16} className="text-pink-500" /> {likedSongs.length} Likes</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><ListMusic size={16} className="text-blue-500" /> {playlists.length} Playlists</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><History size={16} className="text-purple-500" /> {recentSongs.length} Recent</span>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex gap-3">
              <Link href="/playlists">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-white text-black font-bold rounded-full flex items-center gap-2 shadow-lg shadow-white/10 hover:shadow-white/20 transition-shadow">
                  <Plus size={20} /> Create Playlist
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Collections Grid */}
          <motion.section variants={container} initial="hidden" animate="show" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-2">
              Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Liked Songs", icon: Heart, count: likedSongs.length, href: "/liked", color: "from-pink-500 to-purple-600", bgGlow: "bg-pink-500/20" },
                { title: "Recently Played", icon: History, count: recentSongs.length, href: "/recently-played", color: "from-blue-500 to-cyan-500", bgGlow: "bg-blue-500/20" },
                { title: "Your Playlists", icon: ListMusic, count: playlists.length, href: "/playlists", color: "from-fuchsia-500 to-indigo-600", bgGlow: "bg-fuchsia-500/20" },
                { title: "Explore Music", icon: Compass, count: "Discover", href: "/explore", color: "from-emerald-400 to-teal-600", bgGlow: "bg-emerald-500/20" }
              ].map((card, idx) => (
                <motion.div
    key={card.title}
    variants={container}
>
                  <Link href={card.href}>
                    <div className="group relative overflow-hidden rounded-3xl p-6 h-48 flex flex-col justify-end shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
                      <div className={`absolute inset-0 opacity-40 group-hover:opacity-100 bg-gradient-to-br ${card.color} transition-opacity duration-500 mix-blend-overlay`} />
                      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-2xl rounded-full ${card.bgGlow} group-hover:scale-150 transition-transform duration-700`} />
                      
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center mb-4 text-white shadow-inner">
                          <card.icon size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">{card.title}</h3>
                        <p className="text-sm font-medium text-white/70 mt-1">{card.count} {typeof card.count === 'number' && 'items'}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Recent Activity */}
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
              <Link href="/recently-played" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">See all</Link>
            </div>
            
            {uniqueRecentSongs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {uniqueRecentSongs.slice(0, 6).map((song, index) => (
                  <SongCard
                    key={`${song.videoId}-${index}`}
                    song={{
                      id: song.videoId,
                      title: song.title,
                      artist: song.artist,
                      thumbnail: song.thumbnail,
                      duration: song.duration || 0,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
                <History size={48} className="text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">No recent activity</h3>
                <p className="text-zinc-500 mb-6 max-w-sm">Start listening to music to see your recent activity here.</p>
                <Link href="/">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors">
                    Browse Music
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.section>

          {/* Playlists Preview */}
          {playlists.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Your Playlists</h2>
                <Link href="/playlists" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">See all</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {playlists.slice(0, 6).map((playlist) => (
                  <Link href={`/playlists/${playlist.id}`} key={playlist.id}>
                    <motion.div whileHover={{ y: -6 }} className="group p-4 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 mb-4 shadow-lg flex items-center justify-center">
                        {playlist.songs[0] ? (
                          <img src={playlist.songs[0].thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={playlist.name} />
                        ) : (
                          <ListMusic size={40} className="text-zinc-700" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <Play size={20} className="ml-1" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-white truncate">{playlist.name}</h3>
                      <p className="text-sm text-zinc-500 mt-1">{playlist.songs.length} songs</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* Favorite Artists */}
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Favorite Artists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[
  {
    name: "Arijit Singh",
    image:
      "https://yt3.googleusercontent.com/ytc/AIdro_n5OQ=s176-c-k-c0x00ffffff-no-rj",
  },
  {
    name: "Atif Aslam",
    image:
      "https://yt3.googleusercontent.com/ytc/AIdro_k8kA=s176-c-k-c0x00ffffff-no-rj",
  },
  {
    name: "Shreya Ghoshal",
    image:
      "https://yt3.googleusercontent.com/ytc/AIdro_m9P=s176-c-k-c0x00ffffff-no-rj",
  },
  {
    name: "Sonu Nigam",
    image:
      "https://yt3.googleusercontent.com/ytc/AIdro_l7D=s176-c-k-c0x00ffffff-no-rj",
  },
  {
    name: "Armaan Malik",
    image:
      "https://yt3.googleusercontent.com/ytc/AIdro_q2R=s176-c-k-c0x00ffffff-no-rj",
  },
].map((artist, idx) => (
                <Link key={artist.name} href={`/artist/${encodeURIComponent(artist.name)}`}>
                  <motion.div whileHover={{ y: -6 }} className="group bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col items-center transition-all cursor-pointer">
                    <div className="relative w-28 h-28 mb-4">
                      <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl group-hover:scale-110 transition-transform" />
                      <img
  src={artist.image}
  alt={artist.name}
  className="w-full h-full object-cover rounded-full shadow-lg border-2 border-transparent group-hover:border-purple-500 transition-colors relative z-10"
  loading="lazy"
  onError={(e) => {
    (e.currentTarget as HTMLImageElement).src =
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        artist.name
      )}&background=7c3aed&color=fff&size=256`;
  }}
/>
                    </div>
                    <h3 className="font-bold text-center text-white truncate w-full">{artist.name}</h3>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 mt-2">Artist</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>

        </div>
      </main>
    </ProtectedRoute>
  );
}