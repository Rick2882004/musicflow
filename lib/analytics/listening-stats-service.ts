import { Track, ListeningHistoryEntry } from "@/types/music";
import { ListeningSession } from "@/store/session-store";
import { inferTrackGenre } from "@/lib/listening-sessions/session-tracker";

export type StatsTimeRange =
  | "today"
  | "this_week"
  | "this_month"
  | "last_3_months"
  | "this_year"
  | "all_time";

export interface HourlyActivityPoint {
  hour: number;
  label: string; // e.g. "11 PM"
  count: number;
}

export interface DailyActivityPoint {
  date: string; // "YYYY-MM-DD"
  dayName: string; // "Mon", "Tue", etc.
  minutes: number;
  trackCount: number;
}

export interface PeriodComparison {
  timeChangePercentage: number | null;
  playsChangePercentage: number | null;
  skipRateChangePercentage: number | null;
}

export interface ListeningStatsResult {
  hasEnoughData: boolean;
  timeRange: StatsTimeRange;
  totalListeningSeconds: number;
  totalListeningFormatted: string;
  tracksPlayed: number;
  tracksCompleted: number;
  tracksSkipped: number;
  likesCount: number;
  uniqueArtistsCount: number;
  uniqueAlbumsCount: number;
  uniqueGenresCount: number;
  averageSessionLengthMinutes: number;
  mostPlayedTrack: { track: Track; count: number } | null;
  mostPlayedArtist: { name: string; count: number } | null;
  mostPlayedAlbum: { name: string; count: number } | null;
  mostActiveListeningHour: { hour: number; label: string; count: number } | null;
  mostActiveDay: { day: string; count: number } | null;
  discoveryPercentage: number;
  replayPercentage: number;
  skipRate: number;
  hourlyActivity: HourlyActivityPoint[];
  dailyActivity: DailyActivityPoint[];
  topGenres: Array<{ genre: string; count: number; percentage: number }>;
  topArtists: Array<{ name: string; count: number; percentage: number }>;
  trends: PeriodComparison;
}

export function getTimeRangeBounds(range: StatsTimeRange): { start: number; end: number; prevStart: number; prevEnd: number } {
  const now = Date.now();
  let durationMs = 0;

  switch (range) {
    case "today":
      durationMs = 24 * 60 * 60 * 1000;
      break;
    case "this_week":
      durationMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case "this_month":
      durationMs = 30 * 24 * 60 * 60 * 1000;
      break;
    case "last_3_months":
      durationMs = 90 * 24 * 60 * 60 * 1000;
      break;
    case "this_year":
      durationMs = 365 * 24 * 60 * 60 * 1000;
      break;
    case "all_time":
    default:
      return { start: 0, end: now, prevStart: 0, prevEnd: 0 };
  }

  const start = now - durationMs;
  const end = now;
  const prevEnd = start;
  const prevStart = start - durationMs;

  return { start, end, prevStart, prevEnd };
}

export function formatListeningDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0 min";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hrs`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function calculateAdvancedListeningStats(
  history: ListeningHistoryEntry[] = [],
  likedSongs: Track[] = [],
  sessions: ListeningSession[] = [],
  range: StatsTimeRange = "all_time",
  skips: string[] = []
): ListeningStatsResult {
  const { start, end, prevStart, prevEnd } = getTimeRangeBounds(range);

  // Filter history entries by selected time range
  const currentEntries = history.filter((h) => (range === "all_time" ? true : h.timestamp >= start && h.timestamp <= end));
  const prevEntries =
    range === "all_time" || prevStart === 0
      ? []
      : history.filter((h) => h.timestamp >= prevStart && h.timestamp <= prevEnd);

  // Filter sessions by selected time range
  const currentSessions = sessions.filter((s) => (range === "all_time" ? true : s.startTime >= start && s.startTime <= end));

  // If zero history in this range, return honest cold start
  if (currentEntries.length === 0) {
    return {
      hasEnoughData: false,
      timeRange: range,
      totalListeningSeconds: 0,
      totalListeningFormatted: "0 min",
      tracksPlayed: 0,
      tracksCompleted: 0,
      tracksSkipped: 0,
      likesCount: likedSongs.length,
      uniqueArtistsCount: 0,
      uniqueAlbumsCount: 0,
      uniqueGenresCount: 0,
      averageSessionLengthMinutes: 0,
      mostPlayedTrack: null,
      mostPlayedArtist: null,
      mostPlayedAlbum: null,
      mostActiveListeningHour: null,
      mostActiveDay: null,
      discoveryPercentage: 0,
      replayPercentage: 0,
      skipRate: 0,
      hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        label: i === 0 ? "12 AM" : i === 12 ? "12 PM" : i > 12 ? `${i - 12} PM` : `${i} AM`,
        count: 0,
      })),
      dailyActivity: [],
      topGenres: [],
      topArtists: [],
      trends: {
        timeChangePercentage: null,
        playsChangePercentage: null,
        skipRateChangePercentage: null,
      },
    };
  }

  // 1. Total listening time (seconds)
  const totalListeningSeconds = currentEntries.reduce((sum, h) => sum + (h.playbackDuration || 180), 0);

  // 2. Plays, completions, skips
  const tracksPlayed = currentEntries.length;
  const tracksCompleted = currentEntries.filter(
    (h) => h.completionPercentage >= 75 || h.playbackDuration >= 120
  ).length;

  const skipSet = new Set(skips);
  const tracksSkipped = currentEntries.filter(
    (h) => (h.playbackDuration < 30 && h.completionPercentage < 20 && h.playbackDuration > 0) || skipSet.has(h.track.videoId)
  ).length;

  const skipRate = tracksPlayed > 0 ? Math.round((tracksSkipped / tracksPlayed) * 100) : 0;

  // 3. Unique entities
  const uniqueArtists = new Set<string>();
  const uniqueAlbums = new Set<string>();
  const uniqueGenres = new Set<string>();
  const artistCounts: Record<string, number> = {};
  const albumCounts: Record<string, number> = {};
  const trackCounts: Record<string, { track: Track; count: number }> = {};
  const genreCounts: Record<string, number> = {};

  for (const h of currentEntries) {
    const t = h.track;
    if (t.artist) {
      uniqueArtists.add(t.artist);
      artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
    }
    if (t.album) {
      uniqueAlbums.add(t.album);
      albumCounts[t.album] = (albumCounts[t.album] || 0) + 1;
    }
    const g = inferTrackGenre(t);
    uniqueGenres.add(g);
    genreCounts[g] = (genreCounts[g] || 0) + 1;

    const vid = t.videoId;
    if (!trackCounts[vid]) {
      trackCounts[vid] = { track: t, count: 0 };
    }
    trackCounts[vid].count += 1;
  }

  // 4. Most played entities
  const topTrackEntry = Object.values(trackCounts).sort((a, b) => b.count - a.count)[0] || null;
  const topArtistEntry = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const topAlbumEntry = Object.entries(albumCounts).sort((a, b) => b[1] - a[1])[0] || null;

  // 5. Hourly Activity (24-hour distribution)
  const hourCounts: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hourCounts[i] = 0;

  for (const h of currentEntries) {
    const hr = new Date(h.timestamp).getHours();
    hourCounts[hr] = (hourCounts[hr] || 0) + 1;
  }

  const hourlyActivity: HourlyActivityPoint[] = Array.from({ length: 24 }, (_, hr) => ({
    hour: hr,
    label: hr === 0 ? "12 AM" : hr === 12 ? "12 PM" : hr > 12 ? `${hr - 12} PM` : `${hr} AM`,
    count: hourCounts[hr] || 0,
  }));

  const mostActiveHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const mostActiveListeningHour =
    mostActiveHourEntry && mostActiveHourEntry[1] > 0
      ? {
          hour: Number(mostActiveHourEntry[0]),
          label: hourlyActivity[Number(mostActiveHourEntry[0])]?.label || "",
          count: mostActiveHourEntry[1],
        }
      : null;

  // 6. Most active day
  const dayCounts: Record<string, number> = {};
  for (const h of currentEntries) {
    const d = new Date(h.timestamp);
    const dayName = DAY_NAMES[d.getDay()];
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
  }
  const topDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0] || null;

  // 7. Daily Activity Points (for activity chart)
  const dailyMap: Record<string, { date: string; dayName: string; seconds: number; count: number }> = {};
  for (const h of currentEntries) {
    const d = new Date(h.timestamp);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        date: dateKey,
        dayName: DAY_NAMES[d.getDay()],
        seconds: 0,
        count: 0,
      };
    }
    dailyMap[dateKey].seconds += h.playbackDuration || 180;
    dailyMap[dateKey].count += 1;
  }

  const dailyActivity: DailyActivityPoint[] = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((d) => ({
      date: d.date,
      dayName: d.dayName,
      minutes: Math.round(d.seconds / 60),
      trackCount: d.count,
    }));

  // 8. Discovery vs Replay percentage
  let replayedPlays = 0;
  for (const item of Object.values(trackCounts)) {
    if (item.count >= 2) replayedPlays += item.count;
  }
  const replayPercentage = tracksPlayed > 0 ? Math.round((replayedPlays / tracksPlayed) * 100) : 0;
  const discoveryPercentage = 100 - replayPercentage;

  // 9. Top Genres and Artists ranking
  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round((count / tracksPlayed) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topArtists = Object.entries(artistCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / tracksPlayed) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 10. Average session length
  let averageSessionLengthMinutes = 0;
  if (currentSessions.length > 0) {
    const totalSessionSeconds = currentSessions.reduce((sum, s) => sum + s.duration, 0);
    averageSessionLengthMinutes = Math.round(totalSessionSeconds / currentSessions.length / 60);
  } else {
    // Inferred from history duration
    averageSessionLengthMinutes = Math.min(60, Math.round(totalListeningSeconds / Math.max(1, uniqueArtists.size) / 60));
  }

  // 11. Trend comparison against preceding period
  let timeChangePercentage: number | null = null;
  let playsChangePercentage: number | null = null;
  let skipRateChangePercentage: number | null = null;

  if (prevEntries.length > 0) {
    const prevSeconds = prevEntries.reduce((sum, h) => sum + (h.playbackDuration || 180), 0);
    if (prevSeconds > 0) {
      timeChangePercentage = Math.round(((totalListeningSeconds - prevSeconds) / prevSeconds) * 100);
    }
    playsChangePercentage = Math.round(((tracksPlayed - prevEntries.length) / prevEntries.length) * 100);

    const prevSkipped = prevEntries.filter(
      (h) => (h.playbackDuration < 30 && h.completionPercentage < 20 && h.playbackDuration > 0) || skipSet.has(h.track.videoId)
    ).length;
    const prevSkipRate = Math.round((prevSkipped / prevEntries.length) * 100);
    skipRateChangePercentage = skipRate - prevSkipRate;
  }

  return {
    hasEnoughData: true,
    timeRange: range,
    totalListeningSeconds,
    totalListeningFormatted: formatListeningDuration(totalListeningSeconds),
    tracksPlayed,
    tracksCompleted,
    tracksSkipped,
    likesCount: likedSongs.length,
    uniqueArtistsCount: uniqueArtists.size,
    uniqueAlbumsCount: uniqueAlbums.size,
    uniqueGenresCount: uniqueGenres.size,
    averageSessionLengthMinutes,
    mostPlayedTrack: topTrackEntry,
    mostPlayedArtist: topArtistEntry ? { name: topArtistEntry[0], count: topArtistEntry[1] } : null,
    mostPlayedAlbum: topAlbumEntry ? { name: topAlbumEntry[0], count: topAlbumEntry[1] } : null,
    mostActiveListeningHour,
    mostActiveDay: topDayEntry ? { day: topDayEntry[0], count: topDayEntry[1] } : null,
    discoveryPercentage,
    replayPercentage,
    skipRate,
    hourlyActivity,
    dailyActivity,
    topGenres,
    topArtists,
    trends: {
      timeChangePercentage,
      playsChangePercentage,
      skipRateChangePercentage,
    },
  };
}
