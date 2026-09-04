"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import {
  ListMusic,
  Heart,
  History,
  Disc,
  Search,
} from "lucide-react";
import { Track } from "@/types/music";
import { useHasMounted } from "@/hooks/useHasMounted";
import { SafeImage } from "@/components/ui/SafeImage";
import { TrackRow } from "@/components/ui/TrackRow";

export default function LibraryPage() {
  const mounted = useHasMounted();
  const [activeSegment, setActiveSegment] = useState<"all" | "playlists" | "liked" | "history">("all");
  const [filterQuery, setFilterQuery] = useState("");

  const { likedSongs, playlists, recentSongs, history, setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      likedSongs: s.likedSongs,
      playlists: s.playlists,
      recentSongs: s.recentSongs,
      history: s.history,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  const uniqueRecentSongs = Array.from(
    new Map((history.length > 0 ? history.map((h) => h.track) : recentSongs).map((song) => [song.videoId, song])).values()
  );

  const playSong = (song: Track, index: number, list: Track[]) => {
    setQueue(list);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  if (!mounted) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center">
          <div className="text-zinc-500 text-sm font-bold animate-pulse">Loading Your Library...</div>
        </div>
      </ProtectedRoute>
    );
  }

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(filterQuery.toLowerCase())
  );
  const filteredLiked = likedSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(filterQuery.toLowerCase())
  );
  const filteredHistory = uniqueRecentSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-8 select-none">
        {/* 1. Clean Music Header */}
        <section className="px-4 md:px-8 pt-4 pb-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Your Library
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {playlists.length} playlists · {likedSongs.length} liked tracks
              </p>
            </div>
            <Link
              href="/playlists"
              className="px-4 py-2 rounded-full text-white font-bold text-xs flex items-center gap-1.5 shadow-sm bg-purple-600 hover:bg-purple-500 transition active:scale-95 w-fit"
            >
              <ListMusic size={13} /> Manage Playlists
            </Link>
          </div>
        </section>

        {/* 2. Segmented Tabs & Search Filter */}
        <section className="px-4 md:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
            {/* Segment Pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { id: "all", label: "Overview", icon: Disc },
                { id: "playlists", label: "Playlists", icon: ListMusic },
                { id: "liked", label: "Liked Songs", icon: Heart },
                { id: "history", label: "History", icon: History },
              ].map((seg) => {
                const Icon = seg.icon;
                const active = activeSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => setActiveSegment(seg.id as "all" | "playlists" | "liked" | "history")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                      active
                        ? "bg-white text-black shadow-sm font-black"
                        : "bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{seg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* In-Library Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter library..."
                className="w-full h-8 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-semibold text-white placeholder:text-zinc-600 outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* 3. Render Views Based on Segment */}
          {activeSegment === "all" && (
            <div className="space-y-10">
              {/* Quick Jump Hub Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link href="/liked">
                  <div
                    className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] hover:bg-white/[0.04] transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-white">Liked Songs</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{likedSongs.length} favorites</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-pink-500/15 flex items-center justify-center text-pink-400">
                      <Heart size={16} fill="currentColor" />
                    </div>
                  </div>
                </Link>

                <Link href="/playlists">
                  <div
                    className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] hover:bg-white/[0.04] transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-white">Your Playlists</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{playlists.length} collections</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
                      <ListMusic size={16} />
                    </div>
                  </div>
                </Link>

                <Link href="/recently-played">
                  <div
                    className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] hover:bg-white/[0.04] transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-white">Listening History</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{uniqueRecentSongs.length} tracks logged</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                      <History size={16} />
                    </div>
                  </div>
                </Link>
              </div>

              {/* Playlists Preview Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-black text-white">Custom Playlists</h3>
                  <Link href="/playlists" className="text-xs font-bold text-zinc-500 hover:text-white">
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {playlists.slice(0, 4).map((pl) => (
                    <Link key={pl.id} href={`/playlists/${pl.id}`}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-purple-500/20 transition space-y-3"
                      >
                        <div className="aspect-square rounded-xl bg-zinc-900 overflow-hidden border border-white/5 flex items-center justify-center text-zinc-700">
                          {pl.coverImage ? (
                            <SafeImage src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover" />
                          ) : (
                            <ListMusic size={28} className="text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                          <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{pl.songs?.length || 0} songs</p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSegment === "playlists" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-white uppercase tracking-wider">
                  All Playlists ({filteredPlaylists.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {filteredPlaylists.map((pl) => (
                  <Link key={pl.id} href={`/playlists/${pl.id}`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.035] hover:border-purple-500/20 transition space-y-3"
                    >
                      <div className="aspect-square rounded-xl bg-zinc-900 overflow-hidden border border-white/5 flex items-center justify-center">
                        {pl.coverImage ? (
                          <SafeImage src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover" />
                        ) : (
                          <ListMusic size={28} className="text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{pl.songs.length} songs</p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeSegment === "liked" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Liked Songs ({filteredLiked.length})
                </h3>
              </div>
              <div className="space-y-1">
                {filteredLiked.map((song, idx) => (
                  <TrackRow
                    key={`${song.videoId}-${idx}`}
                    song={song}
                    index={idx}
                    onPlay={(s, i) => playSong(s, i, filteredLiked)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeSegment === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  History Log ({filteredHistory.length})
                </h3>
              </div>
              <div className="space-y-1">
                {filteredHistory.map((song, idx) => (
                  <TrackRow
                    key={`${song.videoId}-${idx}`}
                    song={song}
                    index={idx}
                    onPlay={(s, i) => playSong(s, i, filteredHistory)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}