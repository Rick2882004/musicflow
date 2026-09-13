"use client";

import { useState } from "react";
import { ListeningSession } from "@/store/session-store";
import { usePlayerStore } from "@/store/player-store";
import { useRadioStore } from "@/store/radio-store";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  X,
  Play,
  BookmarkPlus,
  Radio,
  Clock,
  Music,
  Check,
  Users,
  Compass,
} from "lucide-react";

interface SessionDetailModalProps {
  session: ListeningSession | null;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

export function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  const [savedPlaylist, setSavedPlaylist] = useState(false);
  const { setTrack, setQueue, addPlaylist, addSongToPlaylist } = usePlayerStore();
  const { startRadio } = useRadioStore();

  if (!session) return null;

  const dateLabel = new Date(session.startTime).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleReplaySession = () => {
    if (session.tracks.length === 0) return;
    setQueue(session.tracks);
    const first = session.tracks[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
    onClose();
  };

  const handleSaveAsPlaylist = async () => {
    if (session.tracks.length === 0 || savedPlaylist) return;
    const name = `Session: ${session.topVibe} (${new Date(session.startTime).toLocaleDateString()})`;
    await addPlaylist(name);

    // Grab newly created playlist from updated store
    const store = usePlayerStore.getState();
    const created = store.playlists.find((p) => p.name === name);
    if (created) {
      for (const track of session.tracks) {
        await addSongToPlaylist(created.id, track);
      }
    }
    setSavedPlaylist(true);
    setTimeout(() => setSavedPlaylist(false), 3000);
  };

  const handleStartRadio = () => {
    if (session.tracks.length === 0) return;
    const seed = session.tracks[0];
    startRadio(seed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#121218] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
              Listening Session
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              {session.topVibe}
            </h3>
            <p className="text-xs text-zinc-400">{dateLabel}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/[0.06] text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="p-4 grid grid-cols-4 gap-2 bg-white/[0.02] border-b border-white/[0.06] text-center">
          <div className="p-2 rounded-lg bg-[#0e0e14] border border-white/[0.04]">
            <span className="text-[9px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-1">
              <Clock size={10} /> Duration
            </span>
            <span className="text-xs font-bold text-white font-mono block mt-1">
              {formatDuration(session.duration)}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#0e0e14] border border-white/[0.04]">
            <span className="text-[9px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-1">
              <Music size={10} /> Tracks
            </span>
            <span className="text-xs font-bold text-white font-mono block mt-1">
              {session.tracksCount}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#0e0e14] border border-white/[0.04]">
            <span className="text-[9px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-1">
              <Users size={10} /> Artists
            </span>
            <span className="text-xs font-bold text-white font-mono block mt-1">
              {session.artists.length}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#0e0e14] border border-white/[0.04]">
            <span className="text-[9px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-1">
              <Compass size={10} /> Discovery
            </span>
            <span className="text-xs font-bold text-teal-300 font-mono block mt-1">
              {Math.round(session.discoveryRatio * 100)}%
            </span>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block pb-1">
            Tracks in Session ({session.tracks.length})
          </span>

          {session.tracks.map((track, idx) => (
            <div
              key={`${track.videoId}-${idx}`}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-zinc-400 w-4 text-center">{idx + 1}</span>
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/[0.08] bg-zinc-900">
                  <SafeImage
                    src={track.thumbnail}
                    videoId={track.videoId}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    fallbackType="song"
                  />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-zinc-200 truncate">{track.title}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{track.artist}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-white/[0.06] bg-[#0e0e14] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAsPlaylist}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              {savedPlaylist ? <Check size={13} className="text-emerald-400" /> : <BookmarkPlus size={13} />}
              {savedPlaylist ? "Saved!" : "Save Playlist"}
            </button>

            <button
              onClick={handleStartRadio}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-bold text-purple-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Radio size={13} />
              Radio
            </button>
          </div>

          <button
            onClick={handleReplaySession}
            className="px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer ml-auto"
          >
            <Play size={13} fill="currentColor" />
            Replay Session
          </button>
        </div>
      </div>
    </div>
  );
}
