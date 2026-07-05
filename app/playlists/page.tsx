"use client";
import Link from "next/link";
import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import {
  motion,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import { ListMusic, Plus, Search, Play, Music } from "lucide-react";

export default function PlaylistsPage() {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const {
    playlists,
    addPlaylist,
  } = usePlayerStore(useShallow((s) => ({
    playlists: s.playlists,
    addPlaylist: s.addPlaylist,
  })));

  const totalSongs = playlists.reduce((total, playlist) => total + playlist.songs.length, 0);

  const filteredPlaylists = playlists.filter((playlist: any) =>
    playlist.name.toLowerCase().includes(search.toLowerCase())
  );

  const container: Variants = {
    hidden: {
      opacity: 0,
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-black text-white pb-32">
        {/* Premium Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-900/40 via-purple-900/30 to-black px-8 pt-24 pb-12 border-b border-white/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/20 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />

          <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="w-48 h-48 md:w-60 md:h-60 shrink-0 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-fuchsia-500/30 border border-white/20"
            >
              <ListMusic size={80} className="text-white drop-shadow-xl" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-center md:text-left">
              <span className="text-xs font-bold tracking-widest uppercase text-fuchsia-400 mb-2 block">Collection</span>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6">Your Playlists</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-zinc-300 font-medium">
                <span className="text-white font-bold">Library</span>
                <span>•</span>
                <span>{playlists.length} playlists</span>
                <span>•</span>
                <span>{totalSongs} songs</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-8">

          {/* Controls Bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex flex-col md:flex-row gap-4 mb-10">
            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-500 transition-colors" size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search playlists..."
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.08] border border-white/10 focus:border-purple-500/50 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-zinc-500 text-white backdrop-blur-xl shadow-inner"
              />
            </div>

            {/* Create Toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreating(!isCreating)}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-colors backdrop-blur-xl"
            >
              <Plus size={20} /> Create
            </motion.button>
          </motion.div>

          {/* Create Form Dropdown */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 block">Playlist Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && name.trim()) {
                          addPlaylist(name);
                          setName("");
                          setIsCreating(false);
                        }
                      }}
                      placeholder="My Awesome Mix..."
                      className="w-full bg-black/40 border border-white/10 focus:border-fuchsia-500/50 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-zinc-600 shadow-inner"
                      autoFocus
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!name.trim()) return;
                      addPlaylist(name);
                      setName("");
                      setIsCreating(false);
                    }}
                    className={`px-8 py-3 rounded-xl font-bold transition-all ${name.trim()
                      ? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white shadow-lg shadow-fuchsia-500/30'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                  >
                    Save
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid */}
          {playlists.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/20 border border-white/5 rounded-3xl backdrop-blur-sm"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <ListMusic size={40} className="text-zinc-500" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-white">Create your first playlist</h2>
              <p className="text-zinc-400 max-w-md mb-8">Group your favorite songs by mood, genre, or activity.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreating(true)}
                className="px-8 py-3 bg-white text-black font-bold rounded-full shadow-lg hover:shadow-white/20 transition-shadow flex items-center gap-2"
              >
                <Plus size={20} /> Create Playlist
              </motion.button>
            </motion.div>
          ) : filteredPlaylists.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <p className="text-xl">No playlists found for "{search}"</p>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredPlaylists.map((playlist: any) => (
                <motion.div key={playlist.id} variants={item}>
                  <Link href={`/playlists/${playlist.id}`}>
                    <div className="group bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/5 hover:border-white/20 rounded-2xl p-4 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-fuchsia-500/20 hover:-translate-y-2">
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-fuchsia-900/50 to-indigo-900/50 mb-4 shadow-inner flex items-center justify-center border border-white/5">
                        {playlist.songs[0] ? (
                          <img
                            src={playlist.songs[0].thumbnail}
                            alt={playlist.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <Music size={48} className="text-zinc-700/50" />
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-3">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-green-500/50 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out"
                          >
                            <Play size={20} className="ml-1" fill="currentColor" />
                          </motion.div>
                        </div>
                      </div>

                      <div className="px-1">
                        <h2 className="font-bold text-white text-base truncate mb-1">
                          {playlist.name}
                        </h2>
                        <p className="text-zinc-400 text-xs font-medium">
                          {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}