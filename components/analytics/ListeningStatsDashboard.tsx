"use client";

import { useState, useMemo, memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useSessionStore } from "@/store/session-store";
import { useShallow } from "zustand/react/shallow";
import {
  calculateAdvancedListeningStats,
  StatsTimeRange,
} from "@/lib/analytics/listening-stats-service";
import {
  Clock,
  Music,
  CheckCircle2,
  SkipForward,
  Heart,
  Users,
  Calendar,
  Disc,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIME_RANGES: Array<{ id: StatsTimeRange; label: string }> = [
  { id: "today", label: "Today" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_3_months", label: "3 Months" },
  { id: "this_year", label: "This Year" },
  { id: "all_time", label: "All Time" },
];

export const ListeningStatsDashboard = memo(function ListeningStatsDashboard() {
  const [selectedRange, setSelectedRange] = useState<StatsTimeRange>("this_week");

  const { history, likedSongs, skips } = usePlayerStore(
    useShallow((s) => ({
      history: s.history,
      likedSongs: s.likedSongs,
      skips: s.skips,
    }))
  );

  const { completedSessions } = useSessionStore(
    useShallow((s) => ({
      completedSessions: s.completedSessions,
    }))
  );

  const stats = useMemo(() => {
    return calculateAdvancedListeningStats(
      history,
      likedSongs,
      completedSessions,
      selectedRange,
      skips
    );
  }, [history, likedSongs, completedSessions, selectedRange, skips]);

  return (
    <section className="w-full space-y-6">
      {/* Header and Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Listening Intelligence
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight leading-none mt-1">
            Advanced Statistics
          </h2>
        </div>

        {/* Time range pill buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-x-auto scrollbar-none">
          {TIME_RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRange(r.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer",
                selectedRange === r.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* If not enough data exists for this period, show honest state */}
      {!stats.hasEnoughData ? (
        <div className="p-10 rounded-2xl bg-[#121216] border border-white/[0.06] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] mx-auto flex items-center justify-center text-zinc-400">
            <Calendar size={20} />
          </div>
          <h3 className="text-sm font-bold text-white">Not enough data yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            No verified playback activity recorded for{" "}
            <span className="text-purple-300 font-semibold">
              {TIME_RANGES.find((r) => r.id === selectedRange)?.label}
            </span>
            . Play tracks to build your listening statistics for this timeframe.
          </p>
        </div>
      ) : (
        /* Real Metrics Dashboard */
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Listening Time */}
            <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock size={12} className="text-purple-400" /> Time
              </span>
              <p className="text-lg font-black text-white font-mono">
                {stats.totalListeningFormatted}
              </p>
              {stats.trends.timeChangePercentage !== null && (
                <span
                  className={cn(
                    "text-[10px] font-bold flex items-center gap-0.5",
                    stats.trends.timeChangePercentage >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {stats.trends.timeChangePercentage >= 0 ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {Math.abs(stats.trends.timeChangePercentage)}% vs prior
                </span>
              )}
            </div>

            {/* Tracks Played */}
            <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Music size={12} className="text-indigo-400" /> Played
              </span>
              <p className="text-lg font-black text-white font-mono">{stats.tracksPlayed}</p>
              <span className="text-[10px] text-zinc-400 block truncate">Total stream events</span>
            </div>

            {/* Completion Rate */}
            <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" /> Completed
              </span>
              <p className="text-lg font-black text-white font-mono">
                {stats.tracksPlayed > 0
                  ? `${Math.round((stats.tracksCompleted / stats.tracksPlayed) * 100)}%`
                  : "0%"}
              </p>
              <span className="text-[10px] text-zinc-400 block truncate">
                {stats.tracksCompleted} full listens
              </span>
            </div>

            {/* Skip Rate */}
            <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <SkipForward size={12} className="text-rose-400" /> Skip Rate
              </span>
              <p className="text-lg font-black text-white font-mono">{stats.skipRate}%</p>
              <span className="text-[10px] text-zinc-400 block truncate">
                {stats.tracksSkipped} premature skips
              </span>
            </div>

            {/* Unique Artists */}
            <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users size={12} className="text-teal-400" /> Artists
              </span>
              <p className="text-lg font-black text-white font-mono">{stats.uniqueArtistsCount}</p>
              <span className="text-[10px] text-zinc-400 block truncate">Distinct creators</span>
            </div>

            {/* Total Likes */}
            <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.06] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Heart size={12} className="text-pink-400" /> Liked
              </span>
              <p className="text-lg font-black text-white font-mono">{stats.likesCount}</p>
              <span className="text-[10px] text-zinc-400 block truncate">In your library</span>
            </div>
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily / Activity Chart */}
            <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Flame size={14} className="text-purple-400" /> Daily Listening Minutes
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Recent Days</span>
              </div>

              {stats.dailyActivity.length > 0 ? (
                <div className="pt-4 flex items-end justify-between gap-2 h-36 border-b border-white/[0.06] pb-2">
                  {stats.dailyActivity.map((day) => {
                    const maxMins = Math.max(...stats.dailyActivity.map((d) => d.minutes), 30);
                    const heightPercent = Math.max(8, Math.min(100, (day.minutes / maxMins) * 100));
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-8 px-2 py-1 rounded bg-zinc-900 border border-white/10 text-[10px] text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20">
                          {day.minutes}m ({day.trackCount} tracks)
                        </div>
                        <div
                          className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-purple-600/40 to-purple-500 group-hover:to-purple-400 transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[9px] font-mono text-zinc-400 block mt-1">
                          {day.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-zinc-400">
                  No daily stream data available in this timeframe.
                </div>
              )}
            </div>

            {/* 24-Hour Listening Distribution */}
            <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Clock size={14} className="text-indigo-400" /> 24-Hour Activity Distribution
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Peak: {stats.mostActiveListeningHour ? stats.mostActiveListeningHour.label : "None"}
                </span>
              </div>

              <div className="pt-4 flex items-end justify-between gap-1 h-36 border-b border-white/[0.06] pb-2">
                {stats.hourlyActivity.map((point) => {
                  const maxHour = Math.max(...stats.hourlyActivity.map((p) => p.count), 1);
                  const heightPercent =
                    point.count > 0 ? Math.max(10, (point.count / maxHour) * 100) : 4;
                  const isPeak =
                    stats.mostActiveListeningHour &&
                    stats.mostActiveListeningHour.hour === point.hour;
                  return (
                    <div
                      key={point.hour}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-8 px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-[9px] text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20">
                        {point.label}: {point.count} plays
                      </div>
                      <div
                        className={cn(
                          "w-full rounded-t-sm transition-all",
                          isPeak
                            ? "bg-purple-400 shadow-sm shadow-purple-500/50"
                            : point.count > 0
                            ? "bg-indigo-500/60 hover:bg-indigo-400"
                            : "bg-white/[0.04]"
                        )}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Time of Day Labels */}
              <div className="grid grid-cols-4 text-center text-[10px] text-zinc-400 font-mono">
                <span>Night (12-6a)</span>
                <span>Morning (6-12p)</span>
                <span>Afternoon (12-6p)</span>
                <span>Evening (6-12a)</span>
              </div>
            </div>
          </div>

          {/* Top Genres and Most Played Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Genres Ranked */}
            <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.06] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Disc size={14} className="text-teal-400" /> Genre Breakdown
              </span>
              <div className="space-y-2.5 pt-1">
                {stats.topGenres.map((g) => (
                  <div key={g.genre} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-200">{g.genre}</span>
                      <span className="font-mono text-zinc-400 font-bold">
                        {g.percentage}% ({g.count} plays)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full"
                        style={{ width: `${Math.max(5, g.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discovery vs Replay & Most Played */}
            <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.06] space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" /> Highlights & Discovery
              </span>

              {/* Discovery Split Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-purple-300">Replays ({stats.replayPercentage}%)</span>
                  <span className="text-teal-300">Discovery ({stats.discoveryPercentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-white/[0.06]">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${stats.replayPercentage}%` }}
                  />
                  <div
                    className="h-full bg-teal-400"
                    style={{ width: `${stats.discoveryPercentage}%` }}
                  />
                </div>
              </div>

              {/* Highlights cards */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                    Top Artist
                  </span>
                  <span className="font-semibold text-white truncate block mt-0.5">
                    {stats.mostPlayedArtist ? stats.mostPlayedArtist.name : "None yet"}
                  </span>
                  {stats.mostPlayedArtist && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {stats.mostPlayedArtist.count} plays
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                    Top Song
                  </span>
                  <span className="font-semibold text-white truncate block mt-0.5">
                    {stats.mostPlayedTrack ? stats.mostPlayedTrack.track.title : "None yet"}
                  </span>
                  {stats.mostPlayedTrack && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {stats.mostPlayedTrack.count} plays
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});
