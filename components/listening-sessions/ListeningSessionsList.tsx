"use client";

import { useState, memo } from "react";
import { useSessionStore, ListeningSession } from "@/store/session-store";
import { usePlayerStore } from "@/store/player-store";
import { useRadioStore } from "@/store/radio-store";
import { useShallow } from "zustand/react/shallow";
import { SessionDetailModal } from "./SessionDetailModal";
import { SafeImage } from "@/components/ui/SafeImage";
import { useRouter } from "next/navigation";
import {
  Clock,
  Music,
  Play,
  Compass,
  Headphones,
  Radio,
} from "lucide-react";

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

export const ListeningSessionsList = memo(function ListeningSessionsList() {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<ListeningSession | null>(null);

  const { activeSession, completedSessions } = useSessionStore(
    useShallow((s) => ({
      activeSession: s.activeSession,
      completedSessions: s.completedSessions,
    }))
  );

  const { setTrack, setQueue } = usePlayerStore();
  const { startRadio } = useRadioStore();

  const handleQuickPlay = (e: React.MouseEvent, session: ListeningSession) => {
    e.stopPropagation();
    if (session.tracks.length === 0) return;
    setQueue(session.tracks);
    const first = session.tracks[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  const handleQuickRadio = (e: React.MouseEvent, session: ListeningSession) => {
    e.stopPropagation();
    if (session.tracks.length === 0) return;
    startRadio(session.tracks[0]);
  };

  return (
    <div className="w-full space-y-6">
      {/* Active Live Session Banner if currently streaming */}
      {activeSession && activeSession.tracks.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#121218] border border-purple-500/30 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <Headphones size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Live Session
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">{activeSession.topVibe}</h3>
                <p className="text-[11px] text-zinc-400">
                  {activeSession.tracksCount} tracks • {formatDuration(activeSession.duration)} streamed
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedSession(activeSession)}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-white transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              View Live Session
            </button>
          </div>
        </div>
      )}

      {/* Completed Sessions List */}
      {completedSessions.length === 0 && !activeSession ? (
        <div className="p-12 rounded-2xl bg-[#121216] border border-white/[0.06] text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.06] mx-auto flex items-center justify-center text-zinc-400">
            <Clock size={24} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">No listening sessions yet</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Start playing music and your listening sessions will automatically appear here with full session summaries and insights.
            </p>
          </div>
          <button
            onClick={() => router.push("/explore")}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 mx-auto transition active:scale-95 shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Compass size={14} /> Start Listening
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Recorded Sessions ({completedSessions.length})
            </span>
            <span className="text-[10px] text-zinc-500">Sorted by most recent</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedSessions.map((session) => {
              const dateLabel = new Date(session.startTime).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] hover:border-white/[0.12] hover:bg-[#15151c] transition group cursor-pointer flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[10px] font-mono text-zinc-300">
                          {formatDuration(session.duration)}
                        </span>
                        <span className="text-[10px] text-zinc-400">{dateLabel}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition truncate">
                        {session.topVibe}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate">
                        {session.topArtist} • {session.topGenre}
                      </p>
                    </div>

                    {/* Small preview artworks */}
                    <div className="flex -space-x-2 shrink-0">
                      {session.tracks.slice(0, 3).map((t, idx) => (
                        <div
                          key={`${t.videoId}-${idx}`}
                          className="w-8 h-8 rounded-lg overflow-hidden border border-[#121216] bg-zinc-900 shrink-0"
                        >
                          <SafeImage
                            src={t.thumbnail}
                            videoId={t.videoId}
                            alt=""
                            className="w-full h-full object-cover"
                            fallbackType="song"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Music size={11} /> {session.tracksCount} tracks
                      </span>
                      <span className="flex items-center gap-1 text-teal-300">
                        <Compass size={11} /> {Math.round(session.discoveryRatio * 100)}% discovery
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => handleQuickPlay(e, session)}
                        title="Replay Session"
                        className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white text-zinc-300 hover:text-black transition"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button
                        onClick={(e) => handleQuickRadio(e, session)}
                        title="Start Radio"
                        className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-purple-600 text-zinc-300 hover:text-white transition"
                      >
                        <Radio size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
});
