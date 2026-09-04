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
  Users,
  Bookmark,
  Check,
} from "lucide-react";
import type { Track } from "@/types/music";
import { useHasMounted } from "@/hooks/useHasMounted";
import { SafeImage } from "@/components/ui/SafeImage";
import { TrackRow } from "@/components/ui/TrackRow";

type LibrarySegment = "all" | "playlists" | "liked" | "artists" | "albums" | "history";

export default function LibraryPage() {
  const mounted = useHasMounted();
  const [activeSegment, setActiveSegment] = useState<LibrarySegment>("all");
  const [filterQuery, setFilterQuery] = useState("");

  const {
    likedSongs,
    playlists,
    recentSongs,
    history,
    followedArtists,
    toggleFollowArtist,
    savedAlbums,
    toggleSaveAlbum,
    setTrack,
    setQueue,
  } = usePlayerStore(
    useShallow((s) => ({
      likedSongs: s.likedSongs,
      playlists: s.playlists,
      recentSongs: s.recentSongs,
      history: s.history,
      followedArtists: s.followedArtists,
      toggleFollowArtist: s.toggleFollowArtist,
      savedAlbums: s.savedAlbums,
      toggleSaveAlbum: s.toggleSaveAlbum,
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

  const query = filterQuery.toLowerCase().trim();

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(query)
  );
  const filteredLiked = likedSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(query) ||
      s.artist.toLowerCase().includes(query)
  );
  const filteredArtists = followedArtists.filter(
    (a) =>
      a.name.toLowerCase().includes(query) ||
      (a.genre && a.genre.toLowerCase().includes(query))
  );
  const filteredAlbums = savedAlbums.filter(
    (a) =>
      a.name.toLowerCase().includes(query) ||
      a.artist.toLowerCase().includes(query)
  );
  const filteredHistory = uniqueRecentSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(query) ||
      s.artist.toLowerCase().includes(query)
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
                {playlists.length} playlists · {likedSongs.length} liked · {followedArtists.length} artists · {savedAlbums.length} albums
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
                { id: "playlists", label: `Playlists (${playlists.length})`, icon: ListMusic },
                { id: "liked", label: `Liked (${likedSongs.length})`, icon: Heart },
                { id: "artists", label: `Artists (${followedArtists.length})`, icon: Users },
                { id: "albums", label: `Albums (${savedAlbums.length})`, icon: Bookmark },
                { id: "history", label: "History", icon: History },
              ].map((seg) => {
                const Icon = seg.icon;
                const active = activeSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => setActiveSegment(seg.id as LibrarySegment)}
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

          {/* 3. Overview Segment */}
          {activeSegment === "all" && (
            <div className="space-y-10">
              {/* Quick Jump Hub Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setActiveSegment("liked")}
                  className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] hover:bg-white/[0.04] transition flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">Liked Songs</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{likedSongs.length} tracks</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-pink-500/15 flex items-center justify-center text-pink-400 shrink-0 ml-2">
                    <Heart size={16} fill="currentColor" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveSegment("playlists")}
                  className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] hover:bg-white/[0.04] transition flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">Playlists</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{playlists.length} created</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0 ml-2">
                    <ListMusic size={16} />
                  </div>
                </div>

                <div
                  onClick={() => setActiveSegment("artists")}
                  className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] hover:bg-white/[0.04] transition flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">Followed Artists</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{followedArtists.length} artists</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 ml-2">
                    <Users size={16} />
                  </div>
                </div>

                <div
                  onClick={() => setActiveSegment("albums")}
                  className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] hover:bg-white/[0.04] transition flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">Saved Albums</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{savedAlbums.length} albums</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0 ml-2">
                    <Bookmark size={16} />
                  </div>
                </div>
              </div>

              {/* Playlists Preview Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-black text-white">Your Playlists</h3>
                  <button
                    onClick={() => setActiveSegment("playlists")}
                    className="text-xs font-bold text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    View all ({playlists.length}) →
                  </button>
                </div>
                {playlists.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {playlists.slice(0, 6).map((pl) => (
                      <Link key={pl.id} href={`/playlists/${pl.id}`}>
                        <motion.div
                          whileHover={{ y: -4 }}
                          className="p-3.5 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-purple-500/20 transition space-y-2.5"
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
                ) : (
                  <div className="text-center py-8 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                    <p className="text-xs text-zinc-500">No playlists yet. Create one to organize your music.</p>
                  </div>
                )}
              </div>

              {/* Followed Artists Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-black text-white">Followed Artists</h3>
                  <button
                    onClick={() => setActiveSegment("artists")}
                    className="text-xs font-bold text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    View all ({followedArtists.length}) →
                  </button>
                </div>
                {followedArtists.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {followedArtists.slice(0, 6).map((artist, idx) => (
                      <Link key={artist.artistId || artist.browseId || `artist-${artist.name.toLowerCase().trim()}-${idx}`} href={artist.artistId ? `/artist/${encodeURIComponent(artist.name)}?id=${encodeURIComponent(artist.artistId)}` : `/artist/${encodeURIComponent(artist.name)}`}>
                        <motion.div
                          whileHover={{ y: -4 }}
                          className="p-3.5 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-purple-500/20 transition text-center space-y-2.5"
                        >
                          <div className="aspect-square rounded-full bg-zinc-900 overflow-hidden border border-white/5 mx-auto max-w-[120px]">
                            <SafeImage
                              src={artist.image || undefined}
                              artist={artist.name}
                              alt={artist.name}
                              fallbackType="artist"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white truncate">{artist.name}</p>
                            <p className="text-[10px] text-purple-400 font-medium mt-0.5">Artist</p>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                    <p className="text-xs text-zinc-500">No followed artists yet. Follow artists you love to see them here.</p>
                  </div>
                )}
              </div>

              {/* Saved Albums Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-black text-white">Saved Albums</h3>
                  <button
                    onClick={() => setActiveSegment("albums")}
                    className="text-xs font-bold text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    View all ({savedAlbums.length}) →
                  </button>
                </div>
                {savedAlbums.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {savedAlbums.slice(0, 6).map((album, idx) => (
                      <Link key={album.albumId || album.browseId || `album-${album.name.toLowerCase().trim()}-${idx}`} href={`/album/${album.albumId}`}>
                        <motion.div
                          whileHover={{ y: -4 }}
                          className="p-3.5 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-purple-500/20 transition space-y-2.5"
                        >
                          <div className="aspect-square rounded-xl bg-zinc-900 overflow-hidden border border-white/5">
                            <SafeImage
                              src={album.thumbnail || undefined}
                              title={album.name}
                              artist={album.artist}
                              alt={album.name}
                              fallbackType="album"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white truncate">{album.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{album.artist}</p>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                    <p className="text-xs text-zinc-500">No saved albums yet. Save albums while browsing to view them here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Playlists Segment */}
          {activeSegment === "playlists" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-white uppercase tracking-wider">
                  Playlists ({filteredPlaylists.length})
                </h3>
              </div>
              {filteredPlaylists.length > 0 ? (
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
              ) : (
                <div className="text-center py-16 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
                  <ListMusic className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white mb-1">No playlists found</p>
                  <p className="text-xs text-zinc-500">Create a new playlist to organize your tracks.</p>
                </div>
              )}
            </div>
          )}

          {/* 5. Liked Songs Segment */}
          {activeSegment === "liked" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Liked Songs ({filteredLiked.length})
                </h3>
              </div>
              {filteredLiked.length > 0 ? (
                <div className="space-y-1">
                  {filteredLiked.map((song, idx) => (
                    <TrackRow
                      key={song.videoId || `liked-${song.title.toLowerCase().trim()}-${idx}`}
                      song={song}
                      index={idx}
                      onPlay={(s, i) => playSong(s, i, filteredLiked)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
                  <Heart className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white mb-1">No liked songs</p>
                  <p className="text-xs text-zinc-500">Heart songs to save them to your favorites.</p>
                </div>
              )}
            </div>
          )}

          {/* 6. Followed Artists Segment */}
          {activeSegment === "artists" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-white uppercase tracking-wider">
                  Followed Artists ({filteredArtists.length})
                </h3>
              </div>
              {filteredArtists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {filteredArtists.map((artist, idx) => (
                    <div
                      key={artist.artistId || artist.browseId || `artist-${artist.name.toLowerCase().trim()}-${idx}`}
                      className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] transition text-center space-y-3 relative group"
                    >
                      <Link href={artist.artistId ? `/artist/${encodeURIComponent(artist.name)}?id=${encodeURIComponent(artist.artistId)}` : `/artist/${encodeURIComponent(artist.name)}`} className="block space-y-2.5">
                        <div className="aspect-square rounded-full bg-zinc-900 overflow-hidden border border-white/5 mx-auto max-w-[130px]">
                          <SafeImage
                            src={artist.image || undefined}
                            artist={artist.name}
                            alt={artist.name}
                            fallbackType="artist"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate hover:text-purple-400 transition-colors">
                            {artist.name}
                          </p>
                          {artist.genre ? (
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{artist.genre}</p>
                          ) : (
                            <p className="text-[10px] text-purple-400 mt-0.5 font-medium">Artist</p>
                          )}
                        </div>
                      </Link>

                      <button
                        onClick={() => toggleFollowArtist(artist)}
                        className="w-full py-1.5 rounded-full text-[11px] font-bold bg-white/5 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check size={12} className="text-purple-400" />
                        Following
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
                  <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white mb-1">No followed artists</p>
                  <p className="text-xs text-zinc-500">Tap Follow on any artist page to add them to your collection.</p>
                </div>
              )}
            </div>
          )}

          {/* 7. Saved Albums Segment */}
          {activeSegment === "albums" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-white uppercase tracking-wider">
                  Saved Albums ({filteredAlbums.length})
                </h3>
              </div>
              {filteredAlbums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {filteredAlbums.map((album, idx) => (
                    <div
                      key={album.albumId || album.browseId || `album-${album.name.toLowerCase().trim()}-${idx}`}
                      className="p-3.5 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] transition space-y-2.5 group"
                    >
                      <Link href={`/album/${album.albumId}`}>
                        <div className="aspect-square rounded-xl bg-zinc-900 overflow-hidden border border-white/5 relative">
                          <SafeImage
                            src={album.thumbnail || undefined}
                            title={album.name}
                            artist={album.artist}
                            alt={album.name}
                            fallbackType="album"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </Link>

                      <div className="space-y-1">
                        <Link href={`/album/${album.albumId}`}>
                          <p className="text-xs font-bold text-white truncate hover:text-purple-400 transition-colors">
                            {album.name}
                          </p>
                        </Link>
                        <Link
                          href={`/artist/${encodeURIComponent(album.artist)}`}
                          className="block text-[10px] text-zinc-400 hover:text-purple-400 truncate transition-colors"
                        >
                          {album.artist}
                        </Link>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {album.songCount ? `${album.songCount} songs` : album.year ? `${album.year}` : "Album"}
                          </span>
                          <button
                            onClick={() => toggleSaveAlbum(album)}
                            title="Remove from Library"
                            className="text-purple-400 hover:text-red-400 transition-colors p-1"
                          >
                            <Bookmark size={13} fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
                  <Bookmark className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white mb-1">No saved albums</p>
                  <p className="text-xs text-zinc-500">Save albums from search or artist pages to collect them here.</p>
                </div>
              )}
            </div>
          )}

          {/* 8. History Segment */}
          {activeSegment === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Listening History ({filteredHistory.length})
                </h3>
              </div>
              {filteredHistory.length > 0 ? (
                <div className="space-y-1">
                  {filteredHistory.map((song, idx) => (
                    <TrackRow
                      key={song.videoId || `history-${song.title.toLowerCase().trim()}-${idx}`}
                      song={song}
                      index={idx}
                      onPlay={(s, i) => playSong(s, i, filteredHistory)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
                  <History className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white mb-1">No listening history</p>
                  <p className="text-xs text-zinc-500">Tracks you play will be recorded here.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}