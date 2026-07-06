"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Play, Shuffle, Trash, Check, Edit2, ShieldAlert, Users, Clock, Share2, Heart, MoreHorizontal, Sparkles, HelpCircle } from "lucide-react";
import { Track, Playlist } from "@/types/music";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "../../../src/components/auth/ProtectedRoute";

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const COLLABORATORS = [
  { name: "Abhishek", avatar: "https://ui-avatars.com/api/?name=Abhishek&background=7c3aed&color=fff" },
  { name: "John Doe", avatar: "https://ui-avatars.com/api/?name=John+Doe&background=059669&color=fff" },
  { name: "Sarah K.", avatar: "https://ui-avatars.com/api/?name=Sarah+K&background=db2777&color=fff" },
];

const SUGGESTED_SONGS = [
  { videoId: "V0KD0nDkbpM", title: "Arijit Singh Hits", artist: "Arijit Singh", thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80", duration: 180 },
  { videoId: "xRb8hxwN5zc", title: "Kabir Singh", artist: "Sachet Tandon", thumbnail: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80", duration: 240 },
  { videoId: "OkpIoEC44kk", title: "Lofi Bollywood", artist: "Lofi Fruit", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80", duration: 210 },
];

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();

  const {
    playlists,
    setTrack,
    setQueue,
    removeSongFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    videoId,
    isPlaying,
  } = usePlayerStore(useShallow((s) => ({
    playlists: s.playlists,
    setTrack: s.setTrack,
    setQueue: s.setQueue,
    removeSongFromPlaylist: s.removeSongFromPlaylist,
    deletePlaylist: s.deletePlaylist,
    updatePlaylist: s.updatePlaylist,
    videoId: s.videoId,
    isPlaying: s.isPlaying,
  })));

  const playlist = playlists.find(
    (p: Playlist) => p.id.toString() === params.id
  );

  const [editMode, setEditMode] = useState(false);
  const [playlistName, setPlaylistName] = useState(playlist?.name || "");
  const [playlistDesc, setPlaylistDesc] = useState(playlist?.description || "");
  const [isCollab, setIsCollab] = useState(playlist?.isCollaborative || false);

  if (!playlist) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen text-zinc-400 select-none text-left flex flex-col items-center justify-center p-8">
          <ShieldAlert className="w-12 h-12 text-zinc-650 mb-3 animate-pulse" />
          <p className="text-sm font-semibold">Playlist not found.</p>
          <button onClick={() => router.push("/playlists")} className="mt-4 px-6 py-2.5 bg-white text-black font-bold rounded-full text-xs transition hover:bg-zinc-150">
            Back to Playlists
          </button>
        </main>
      </ProtectedRoute>
    );
  }

  const totalDuration = playlist.songs.reduce(
    (total: number, song: Track) => total + (song.duration || 210),
    0
  );
  const totalMinutes = Math.round(totalDuration / 60);

  const saveDetails = async () => {
    await updatePlaylist(playlist.id, {
      name: playlistName,
      description: playlistDesc,
      isCollaborative: isCollab,
    });
    setEditMode(false);
  };

  const playSong = (song: Track, index: number) => {
    setQueue(playlist.songs);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const playAll = () => {
    if (playlist.songs.length === 0) return;
    setQueue(playlist.songs);
    const firstSong = playlist.songs[0];
    setTrack(firstSong.videoId, firstSong.title, firstSong.artist, firstSong.thumbnail, 0);
  };

  const shufflePlay = () => {
    if (playlist.songs.length === 0) return;
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    const first = shuffled[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      deletePlaylist(playlist.id);
      router.push("/playlists");
    }
  };

  // Dynamic Cover Image Grid
  const renderCoverImage = () => {
    if (playlist.songs.length >= 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 w-40 h-40 md:w-48 md:h-48 rounded-[24px] overflow-hidden shadow-2xl shrink-0 border border-white/5 bg-zinc-950">
          {playlist.songs.slice(0, 4).map((song, i) => (
            <img
              key={i}
              src={song.thumbnail || "https://placehold.co/100x100/111/fff?text=♪"}
              alt=""
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://placehold.co/100x100/111/fff?text=♪";
              }}
              className="w-full h-full object-cover"
            />
          ))}
        </div>
      );
    }
    if (playlist.songs.length > 0) {
      return (
        <img
          src={playlist.songs[0].thumbnail || "https://placehold.co/500x500/111/fff?text=♪"}
          alt=""
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://placehold.co/500x500/111/fff?text=♪";
          }}
          className="w-40 h-40 md:w-48 md:h-48 rounded-[24px] object-cover shadow-2xl shrink-0 border border-white/5 bg-zinc-950"
        />
      );
    }
    return (
      <div className="w-40 h-40 md:w-48 md:h-48 bg-white/[0.02] rounded-[24px] flex items-center justify-center text-4xl shrink-0 border border-white/[0.05] shadow-inner text-zinc-650">
        🎵
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-8" style={{ background: "#07070A" }}>

        {/* 1. Glass Hero Header */}
        <section className="relative px-6 md:px-10 pt-10 pb-6 overflow-hidden">
          {/* Ambient glow blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-purple-900/[0.07] blur-[150px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-pink-950/[0.05] blur-[135px] pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 p-6 md:p-10 rounded-[32px] bg-white/[0.015] border border-white/[0.04] backdrop-blur-2xl"
            style={{ boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)" }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-end gap-8">
              {renderCoverImage()}

              <div className="flex-grow space-y-4 text-center md:text-left min-w-0">
                {editMode ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      className="w-full max-w-md bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[15px] text-white font-bold focus:outline-none focus:border-purple-500"
                      placeholder="Playlist name"
                    />
                    <textarea
                      value={playlistDesc}
                      onChange={(e) => setPlaylistDesc(e.target.value)}
                      className="w-full max-w-md bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500 min-h-[60px]"
                      placeholder="Add a description"
                    />
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <input
                        type="checkbox"
                        id="collab"
                        checked={isCollab}
                        onChange={(e) => setIsCollab(e.target.checked)}
                        className="accent-purple-600 rounded"
                      />
                      <label htmlFor="collab" className="text-[11px] font-bold text-zinc-400 cursor-pointer flex items-center gap-1">
                        <Users size={12} /> Collaborative Playlist
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.05]">
                      <Users size={10} className="text-purple-400" />
                      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">
                        {playlist.isCollaborative ? "Collaborative Playlist" : "Public Playlist"}
                      </span>
                    </div>

                    <h1 className="font-display text-[36px] sm:text-[54px] font-black leading-[0.92] tracking-tighter text-white select-none truncate">
                      {playlist.name}
                    </h1>

                    {playlist.description && (
                      <p className="text-xs text-zinc-500 font-semibold leading-relaxed max-w-xl">
                        {playlist.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-zinc-500 font-semibold justify-center md:justify-start">
                      <span className="text-zinc-200">Created by Me</span>
                      <span className="text-zinc-700">·</span>
                      <span>{playlist.songs.length} songs</span>
                      <span className="text-zinc-700">·</span>
                      <span>About {totalMinutes} min</span>
                      <span className="text-zinc-700">·</span>
                      <span>1.2K followers</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Mode Button */}
              <div className="shrink-0 flex items-center justify-center">
                {editMode ? (
                  <button
                    onClick={saveDetails}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-150 text-black font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Check size={13} /> Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-5 py-2.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Edit2 size={11} /> Edit Playlist
                  </button>
                )}
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-6">
              <div className="flex items-center gap-3">
                {playlist.songs.length > 0 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={playAll}
                      className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-150 text-black font-black text-xs flex items-center gap-2 shadow-md"
                    >
                      <Play size={13} fill="black" className="text-black ml-0.5" /> Play
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={shufflePlay}
                      className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Shuffle size={12} /> Shuffle
                    </motion.button>
                  </>
                )}
                <button className="p-2.5 rounded-full bg-white/[0.02] border border-white/[0.04] text-zinc-450 hover:text-white transition cursor-pointer">
                  <Share2 size={13} />
                </button>
              </div>

              <button
                onClick={handleDelete}
                className="p-2.5 rounded-full bg-red-650/15 hover:bg-red-650/25 border border-red-500/10 text-red-400 hover:text-red-300 transition active:scale-95"
                aria-label="Delete playlist"
              >
                <Trash size={13} />
              </button>
            </div>

          </motion.div>
        </section>

        {/* 2. Grid Layout: Main Columns (Col 1: Track list, Col 2: Sidebar) */}
        <section className="px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            
            {/* Col 1: Track List Table */}
            <div className="space-y-6">
              {playlist.songs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-zinc-300">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-[10px] uppercase font-black tracking-wider text-zinc-600">
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        <th className="py-3.5 px-4">Title</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">Artist</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">Album</th>
                        <th className="py-3.5 px-4 text-right w-20"><Clock size={11} className="ml-auto" /></th>
                        <th className="py-3.5 px-4 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {playlist.songs.map((song, index) => {
                        const isCurrent = song.videoId === videoId;
                        return (
                          <tr
                            key={`${song.videoId}-${index}`}
                            onClick={() => playSong(song, index)}
                            className="group border-b border-white/[0.02] hover:bg-white/[0.015] transition duration-200 cursor-pointer"
                          >
                            {/* Rank */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`text-[12px] font-mono text-zinc-650 group-hover:hidden ${isCurrent ? "text-purple-400 font-bold" : ""}`}>
                                {index + 1}
                              </span>
                              <Play size={11} fill="white" className="text-white mx-auto hidden group-hover:block" />
                            </td>

                            {/* Title (Thumbnail, Name, Artist) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-zinc-950 animate-fade-in">
                                  <img 
                                    src={song.thumbnail || "https://placehold.co/100x100/111/fff?text=♪"} 
                                    alt={song.title} 
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = "https://placehold.co/100x100/111/fff?text=♪";
                                    }}
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-xs font-bold truncate ${isCurrent ? "text-purple-400 font-black" : "text-zinc-200"}`}>
                                    {song.title}
                                  </p>
                                  <p className="text-[10px] text-zinc-555 truncate mt-0.5 md:hidden">{song.artist}</p>
                                </div>
                              </div>
                            </td>

                            {/* Artist */}
                            <td className="py-3.5 px-4 text-xs font-semibold text-zinc-350 hidden md:table-cell">
                              {song.artist}
                            </td>

                            {/* Album */}
                            <td className="py-3.5 px-4 text-xs text-zinc-500 hidden sm:table-cell">
                              {playlist.name} Custom Vol
                            </td>

                            {/* Duration */}
                            <td className="py-3.5 px-4 text-right text-zinc-500 font-mono text-[11px] tabular-nums">
                              {song.duration ? formatDur(song.duration) : "3:30"}
                            </td>

                            {/* Remove button */}
                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2.5">
                                <button className="text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition p-0.5">
                                  <Heart size={13} />
                                </button>
                                <button
                                  onClick={() => removeSongFromPlaylist(playlist.id, song.videoId)}
                                  className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-0.5"
                                  aria-label="Remove from playlist"
                                >
                                  <Trash size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 bg-white/[0.01] border border-white/[0.04] rounded-3xl">
                  <ShieldAlert className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <h3 className="font-display text-[15px] font-bold text-white mb-1">Playlist is empty</h3>
                  <p className="text-[12px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Search for tracks and add them to your playlists using the song card heart options.
                  </p>
                </div>
              )}
            </div>

            {/* Col 2: Sidebar (Suggested, Collaborators) */}
            <div className="space-y-8">
              
              {/* Playlist Collaborators */}
              <div className="p-5 rounded-2xl bg-white/[0.015] border border-white/[0.04] space-y-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-600 mb-0.5">Members</p>
                  <h4 className="font-display text-xs font-black text-white uppercase tracking-wider">Collaborators</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {COLLABORATORS.map((userObj) => (
                      <img
                        key={userObj.name}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-zinc-950 object-cover"
                        src={userObj.avatar}
                        alt={userObj.name}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-zinc-500 font-semibold">Active online</span>
                </div>
              </div>

              {/* Suggested Tracks */}
              <div className="space-y-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-600 mb-0.5">Recommended</p>
                  <h4 className="font-display text-xs font-black text-white uppercase tracking-wider">Suggested Songs</h4>
                </div>
                <div className="space-y-2.5">
                  {SUGGESTED_SONGS.map((song) => (
                    <div
                      key={`suggest-${song.videoId}`}
                      onClick={() => setTrack(song.videoId, song.title, song.artist, song.thumbnail, 0)}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.025] hover:border-purple-500/20 transition duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/5">
                          <img
                            src={song.thumbnail || "https://placehold.co/100x100/111/fff?text=♪"}
                            alt={song.title}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://placehold.co/100x100/111/fff?text=♪";
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-zinc-300 truncate leading-snug group-hover:text-purple-300 transition-colors">{song.title}</p>
                          <p className="text-[9px] text-zinc-555 truncate">{song.artist}</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-black shadow transition-opacity shrink-0">
                        <Play size={8} fill="black" className="text-black ml-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </section>

      </main>
    </ProtectedRoute>
  );
}