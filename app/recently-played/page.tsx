"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { History, Play, Trash2, CheckCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { Track, ListeningHistoryEntry } from "@/types/music";
import { useState, useMemo } from "react";
import { TrackRow } from "@/components/ui/TrackRow";

function computeHistoryBuckets(
  history: ListeningHistoryEntry[],
  recentSongs: Track[],
  baseNow: number
) {
  const oneDay = 24 * 60 * 60 * 1000;
  const twoDays = 48 * 60 * 60 * 1000;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const list: ListeningHistoryEntry[] =
    history.length > 0
      ? history
      : recentSongs.map((song, i) => ({
          id: `${song.videoId}-${i}`,
          track: song,
          timestamp: baseNow - i * 3600000 * 4,
          playbackDuration: (song.duration || 210) * 0.85,
          completionPercentage: 85,
        }));

  const today = list.filter((e) => baseNow - e.timestamp <= oneDay);
  const yesterday = list.filter(
    (e) => baseNow - e.timestamp > oneDay && baseNow - e.timestamp <= twoDays
  );
  const thisWeek = list.filter(
    (e) => baseNow - e.timestamp > twoDays && baseNow - e.timestamp <= sevenDays
  );
  const earlier = list.filter((e) => baseNow - e.timestamp > sevenDays);

  return {
    displayHistory: list,
    todayEntries: today,
    yesterdayEntries: yesterday,
    thisWeekEntries: thisWeek,
    earlierEntries: earlier,
  };
}

export default function RecentlyPlayedPage() {
  const [notif, setNotif] = useState("");
  const [now] = useState(() => Date.now());

  const {
    history,
    recentSongs,
    setTrack,
    setQueue,
    clearHistory,
  } = usePlayerStore(
    useShallow((s) => ({
      history: s.history,
      recentSongs: s.recentSongs,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
      clearHistory: s.clearHistory,
    }))
  );

  const showToast = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 2000);
  };

  const {
    displayHistory,
    todayEntries,
    yesterdayEntries,
    thisWeekEntries,
    earlierEntries,
  } = useMemo(
    () => computeHistoryBuckets(history, recentSongs, now),
    [history, recentSongs, now]
  );

  const allTracks = displayHistory.map((h) => h.track);

  const playSong = (song: Track, index: number) => {
    setQueue(allTracks);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const playAll = () => {
    if (allTracks.length === 0) return;
    setQueue(allTracks);
    const s = allTracks[0];
    setTrack(s.videoId, s.title, s.artist, s.thumbnail, 0);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear your entire listening history?")) {
      clearHistory();
      showToast("Listening history cleared");
    }
  };

  if (displayHistory.length === 0) {
    return (
      <ProtectedRoute>
        <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/5 flex items-center justify-center text-zinc-500 mb-4">
            <History size={26} />
          </div>
          <h2 className="text-xl font-bold text-white mb-1.5">
            No listening history yet
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mb-6">
            Tracks you play will be saved here so you can easily jump back in.
          </p>
          <Link
            href="/explore"
            className="px-6 py-2.5 rounded-full font-bold text-xs bg-white text-black hover:bg-zinc-200 transition active:scale-95 shadow-md"
          >
            Explore Music
          </Link>
        </main>
      </ProtectedRoute>
    );
  }

  const renderSection = (title: string, entries: ListeningHistoryEntry[], startIndex: number) => {
    if (entries.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 px-3">
          <Calendar size={12} className="text-purple-400" />
          {title}
        </h3>
        <div className="space-y-0.5">
          {entries.map((entry, idx) => (
            <TrackRow
              key={entry.id}
              song={entry.track}
              index={startIndex + idx}
              onPlay={playSong}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <main className="text-white text-left px-4 md:px-8 pt-4 pb-16 space-y-6">
        {/* Toast */}
        {notif && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-2xl bg-purple-600">
            <CheckCircle size={14} /> {notif}
          </div>
        )}

        {/* Clean Music Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Recently Played
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {displayHistory.length} songs streamed
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={playAll}
              className="px-5 py-2 rounded-full text-white font-bold text-xs flex items-center gap-2 shadow-md transition bg-purple-600 hover:bg-purple-500 active:scale-95 cursor-pointer"
            >
              <Play size={13} fill="currentColor" /> Play All
            </button>
            <button
              onClick={handleClear}
              className="px-3.5 py-2 rounded-full text-zinc-400 hover:text-rose-400 text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>

        {/* Chronological History Groups */}
        <div className="space-y-6">
          {renderSection("Today", todayEntries, 0)}
          {renderSection("Yesterday", yesterdayEntries, todayEntries.length)}
          {renderSection("This Week", thisWeekEntries, todayEntries.length + yesterdayEntries.length)}
          {renderSection(
            "Earlier",
            earlierEntries,
            todayEntries.length + yesterdayEntries.length + thisWeekEntries.length
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}