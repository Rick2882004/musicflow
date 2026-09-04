"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Play, Shuffle, Trash, Check, Edit2, ShieldAlert, Users, Clock, Share2, Heart } from "lucide-react";
import { Playlist, Track } from "@/types/music";
import ProtectedRoute from "../../../src/components/auth/ProtectedRoute";
import { useHasMounted } from "@/hooks/useHasMounted";
import { SafeImage } from "@/components/ui/SafeImage";
import { ShareModal } from "@/components/social/ShareModal";

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();

  const {
    playlists,
    likedSongs,
    recentSongs,
    setTrack,
    setQueue,
    removeSongFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    videoId,
  } = usePlayerStore(useShallow((s) => ({
    playlists: s.playlists,
    likedSongs: s.likedSongs,
    recentSongs: s.recentSongs,
    setTrack: s.setTrack,
    setQueue: s.setQueue,
    removeSongFromPlaylist: s.removeSongFromPlaylist,
    deletePlaylist: s.deletePlaylist,
    updatePlaylist: s.updatePlaylist,
    videoId: s.videoId,
  })));


  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const playlist = playlists.find(
    (p: Playlist) => p && p.id != null && p.id.toString() === rawId
  );

  const mounted = useHasMounted();
  const [editMode, setEditMode] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDesc, setPlaylistDesc] = useState("");
  const [isCollab, setIsCollab] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (playlist) {
      setTimeout(() => {
        setPlaylistName(playlist.name);
        setPlaylistDesc(playlist.description || "");
        setIsCollab(playlist.isCollaborative || false);
      }, 0);
    }
  }, [playlist]);

  if (!mounted) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen text-zinc-400 select-none text-left flex flex-col items-center justify-center p-8">
          <div className="text-zinc-450 text-xl font-bold animate-pulse">Loading Playlist...</div>
        </main>
      </ProtectedRoute>
    );
  }

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

  const songs = playlist.songs || [];
  const totalDuration = songs.reduce(
    (total: number, song: Track) => total + (song?.duration || 210),
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
    setQueue(songs);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const playAll = () => {
    if (songs.length === 0) return;
    setQueue(songs);
    const firstSong = songs[0];
    setTrack(firstSong.videoId, firstSong.title, firstSong.artist, firstSong.thumbnail, 0);
  };

  const shufflePlay = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
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
    if (songs.length >= 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 w-36 h-36 md:w-44 md:h-44 rounded-xl overflow-hidden shadow-lg shrink-0 border border-white/5 bg-zinc-950">
          {songs.slice(0, 4).map((song, i) => (
            <SafeImage
              key={i}
              src={song.thumbnail}
              videoId={song.videoId}
              alt=""
              className="w-full h-full object-cover"
            />
          ))}
        </div>
      );
    }
    if (songs.length > 0) {
      return (
        <SafeImage
          src={songs[0].thumbnail}
          videoId={songs[0].videoId}
          alt=""
          className="w-36 h-36 md:w-44 md:h-44 rounded-xl object-cover shadow-lg shrink-0 border border-white/5 bg-zinc-950"
        />
      );
    }
    return (
      <div className="w-36 h-36 md:w-44 md:h-44 bg-white/[0.02] rounded-xl flex items-center justify-center text-4xl shrink-0 border border-white/[0.05] text-zinc-650">
        🎵
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-6 px-4 md:px-8 pt-4">

        {/* 1. Clean Music Header */}
        <section className="relative pb-2">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 pt-2">
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

                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white select-none truncate">
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
                      <span>{songs.length} songs</span>
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
                {songs.length > 0 && (
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
                <button
                  onClick={() => setShareOpen(true)}
                  aria-label="Share playlist"
                  className="p-2.5 rounded-full bg-white/[0.02] border border-white/[0.04] text-zinc-450 hover:text-white transition cursor-pointer"
                >
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
        </section>


        {/* 2. Grid Layout: Main Columns (Col 1: Track list, Col 2: Sidebar) */}
        <section className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            
            {/* Col 1: Track List Table */}
            <div className="space-y-6">
              {songs.length > 0 ? (
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
                      {songs.map((song, index) => {
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
                                  <SafeImage 
                                    src={song.thumbnail} 
                                    videoId={song.videoId}
                                    alt={song.title} 
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
              
              {/* Playlist Info */}
              <div className="p-5 rounded-2xl bg-white/[0.015] border border-white/[0.04] space-y-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-600 mb-0.5">Playlist</p>
                  <h4 className="font-display text-xs font-black text-white uppercase tracking-wider">Access & Permissions</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-[10px]">
                    {playlist.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-semibold">
                    {playlist.isCollaborative ? "Collaborative Playlist" : "Personal Collection"}
                  </span>
                </div>
              </div>

              {/* Suggested Tracks */}
              {(likedSongs.length > 0 || recentSongs.length > 0) && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-600 mb-0.5">Recommended</p>
                    <h4 className="font-display text-xs font-black text-white uppercase tracking-wider">Suggested Songs</h4>
                  </div>
                  <div className="space-y-2.5">
                    {(likedSongs.length > 0 ? likedSongs : recentSongs).slice(0, 3).map((song) => (
                      <div
                        key={`suggest-${song.videoId}`}
                        onClick={() => setTrack(song.videoId, song.title, song.artist, song.thumbnail, 0)}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.025] hover:border-purple-500/20 transition duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/5">
                            <SafeImage
                              src={song.thumbnail}
                              videoId={song.videoId}
                              alt={song.title}
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
              )}

            </div>

          </div>
        </section>

        {playlist && (
          <ShareModal
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            title={playlist.name}
            subtitle={`${playlist.songs.length} tracks · MusicFlow Playlist`}
            thumbnail={playlist.coverImage || playlist.songs[0]?.thumbnail}
            type="playlist"
          />
        )}
      </main>
    </ProtectedRoute>
  );
}