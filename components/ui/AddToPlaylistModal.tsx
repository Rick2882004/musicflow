"use client";

import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, ListMusic, Music } from "lucide-react";
import { Track } from "@/types/music";
import { SafeImage } from "./SafeImage";

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Track | null;
}

export function AddToPlaylistModal({ isOpen, onClose, song }: AddToPlaylistModalProps) {
  const { playlists, addPlaylist, addSongToPlaylist, removeSongFromPlaylist } = usePlayerStore(
    useShallow((s) => ({
      playlists: s.playlists,
      addPlaylist: s.addPlaylist,
      addSongToPlaylist: s.addSongToPlaylist,
      removeSongFromPlaylist: s.removeSongFromPlaylist,
    }))
  );

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !song) return null;

  const handleToggle = async (playlistId: number, isInPlaylist: boolean) => {
    if (isInPlaylist) {
      await removeSongFromPlaylist(playlistId, song.videoId);
      setSuccessMsg("Removed from playlist");
    } else {
      await addSongToPlaylist(playlistId, song);
      setSuccessMsg("Added to playlist");
    }
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const handleCreateAndAdd = async () => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    await addPlaylist(trimmed);
    const updatedPlaylists = usePlayerStore.getState().playlists;
    const created = updatedPlaylists[updatedPlaylists.length - 1];
    if (created) {
      await addSongToPlaylist(created.id, song);
      setSuccessMsg(`Added to "${trimmed}"`);
      setTimeout(() => setSuccessMsg(""), 2000);
    }
    setNewPlaylistName("");
    setIsCreating(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-2xl bg-[#0f0f14] border border-white/[0.08] shadow-2xl p-5 overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ListMusic size={16} />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">Add to Playlist</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Song Info preview */}
          <div className="flex items-center gap-3 py-3 px-3 my-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/5">
              <SafeImage
                src={song.thumbnail}
                videoId={song.videoId}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-white truncate">{song.title}</p>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">{song.artist}</p>
            </div>
          </div>

          {/* Feedback Toast */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-2 py-1 px-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold text-center"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Playlists List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 my-1 pr-1 scrollbar-none max-h-[300px]">
            {playlists.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                <Music size={24} className="mx-auto mb-2 opacity-40" />
                No playlists yet. Create your first playlist below!
              </div>
            ) : (
              playlists.map((playlist) => {
                const isInPlaylist = (playlist.songs || []).some((s) => s.videoId === song.videoId);
                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleToggle(playlist.id, isInPlaylist)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.04] hover:border-purple-500/25 transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 overflow-hidden border border-white/5 shrink-0 flex items-center justify-center text-zinc-600">
                        {playlist.coverImage ? (
                          <SafeImage src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" />
                        ) : playlist.songs?.[0]?.thumbnail ? (
                          <SafeImage src={playlist.songs[0].thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ListMusic size={14} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                          {playlist.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {playlist.songs?.length || 0} songs
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                        isInPlaylist
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "border-white/10 group-hover:border-white/20 text-transparent"
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Create New Playlist Section */}
          <div className="pt-3 border-t border-white/[0.06] mt-2">
            {isCreating ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                  placeholder="Playlist name..."
                  autoFocus
                  className="flex-1 h-9 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-zinc-600 outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleCreateAndAdd}
                  disabled={!newPlaylistName.trim()}
                  className="px-3 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 h-9 rounded-xl bg-white/[0.03] text-zinc-400 hover:text-white text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={13} /> New Playlist
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
