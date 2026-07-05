"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Play, Shuffle, Trash, Check, Edit2, ShieldAlert, Sparkles, Users } from "lucide-react";
import { Track } from "@/types/music";

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
  } = usePlayerStore(useShallow((s) => ({
    playlists: s.playlists,
    setTrack: s.setTrack,
    setQueue: s.setQueue,
    removeSongFromPlaylist: s.removeSongFromPlaylist,
    deletePlaylist: s.deletePlaylist,
    updatePlaylist: s.updatePlaylist,
  })));

  const playlist = playlists.find(
    (p: any) => p.id.toString() === params.id
  );

  const [editMode, setEditMode] = useState(false);
  const [playlistName, setPlaylistName] = useState(playlist?.name || "");
  const [playlistDesc, setPlaylistDesc] = useState(playlist?.description || "");
  const [isCollab, setIsCollab] = useState(playlist?.isCollaborative || false);

  if (!playlist) {
    return (
      <main className="p-8 text-zinc-400 select-none">
        <p>Playlist not found.</p>
        <button onClick={() => router.push("/playlists")} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs">
          Back to Playlists
        </button>
      </main>
    );
  }

  const totalDuration = playlist.songs.reduce(
    (total: number, song: Track) => total + (song.duration || 210),
    0
  );

  const totalMinutes = Math.floor(totalDuration / 60);

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
        <div className="grid grid-cols-2 grid-rows-2 w-40 h-40 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/5">
          {playlist.songs.slice(0, 4).map((song, i) => (
            <img key={i} src={song.thumbnail} alt="" className="w-full h-full object-cover" />
          ))}
        </div>
      );
    }

    if (playlist.songs.length > 0) {
      return (
        <img
          src={playlist.songs[0].thumbnail}
          alt=""
          className="w-40 h-40 rounded-2xl object-cover shadow-2xl shrink-0 border border-white/5"
        />
      );
    }

    return (
      <div className="w-40 h-40 bg-gradient-to-br from-purple-700/40 to-pink-700/40 rounded-2xl flex items-center justify-center text-6xl shrink-0 border border-white/5 shadow-inner">
        🎵
      </div>
    );
  };

  return (
    <main className="space-y-8 select-none">
      {/* 1. HERO Banner */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="relative bg-gradient-to-r from-purple-900/40 via-zinc-950/80 to-[#07070a] border border-white/5 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
          {renderCoverImage()}

          <div className="flex-grow space-y-4 text-center md:text-left min-w-0">
            {editMode ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full max-w-md bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xl text-white font-bold focus:outline-none focus:border-purple-500"
                  placeholder="Playlist name"
                />
                <textarea
                  value={playlistDesc}
                  onChange={(e) => setPlaylistDesc(e.target.value)}
                  className="w-full max-w-md bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-purple-500 min-h-[60px]"
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
                  <label htmlFor="collab" className="text-xs font-semibold text-zinc-300 cursor-pointer flex items-center gap-1">
                    <Users size={12} />
                    Collaborative Playlist
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  {playlist.isCollaborative ? "Collaborative Playlist" : "Public Playlist"}
                </span>

                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none truncate">
                  {playlist.name}
                </h1>

                {playlist.description && (
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-xl">
                    {playlist.description}
                  </p>
                )}

                <div className="text-xs text-zinc-500 font-semibold flex items-center justify-center md:justify-start gap-1.5 pt-1">
                  <span>{playlist.songs.length} songs</span>
                  <span>•</span>
                  <span>About {totalMinutes} min</span>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center justify-center">
            {editMode ? (
              <button
                onClick={saveDetails}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Check size={14} />
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Edit2 size={12} />
                Edit Playlist
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Actions Row */}
      <div className="flex items-center gap-4 select-none">
        {playlist.songs.length > 0 && (
          <>
            <button
              onClick={playAll}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-lg shadow-purple-600/25"
            >
              <Play size={16} fill="white" className="text-white" />
              Play
            </button>

            <button
              onClick={shufflePlay}
              className="px-6 py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-200 hover:text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <Shuffle size={14} />
              Shuffle
            </button>
          </>
        )}

        <button
          onClick={handleDelete}
          className="p-3.5 rounded-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 hover:text-red-300 transition"
          aria-label="Delete playlist"
        >
          <Trash size={14} />
        </button>
      </div>

      {/* 3. Tracks List */}
      {playlist.songs.length > 0 ? (
        <section className="space-y-2">
          {playlist.songs.map((song: Track, index: number) => (
            <div
              key={`${song.videoId}-${index}`}
              onClick={() => playSong(song, index)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-6 text-center text-xs font-bold text-zinc-600 group-hover:text-purple-400 transition-colors">
                  {index + 1}
                </span>
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                    {song.title}
                  </h3>
                  <Link
                    href={`/artist/${encodeURIComponent(song.artist)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    {song.artist}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-zinc-500 text-xs font-semibold hidden sm:inline">
                  {song.duration
                    ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
                    : "3:30"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSongFromPlaylist(playlist.id, song.videoId);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold hover:text-red-300 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl">
          <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">This playlist has no songs yet.</p>
          <p className="text-[10px] text-zinc-600 mt-1">Search for tracks and add them using song cards!</p>
        </div>
      )}
    </main>
  );
}