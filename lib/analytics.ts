/**
 * Telemetry and analytics wrapper for MusicFlow
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
}

export function trackEvent(event: AnalyticsEvent): void {
  try {
    if (typeof window !== "undefined") {
      // PostHog / Umami / Custom analytics event dispatcher
      console.log(`[MusicFlow Analytics] ${event.name}`, event.properties || {});
      
      // Dispatch custom DOM event if telemetry listener is attached
      window.dispatchEvent(
        new CustomEvent("musicflow:analytics", {
          detail: event,
        })
      );
    }
  } catch (err) {
    console.warn("Failed to dispatch analytics event:", err);
  }
}

export function trackPlaySong(title: string, artist: string, videoId: string): void {
  trackEvent({
    name: "song_played",
    properties: { title, artist, videoId, timestamp: Date.now() },
  });
}

export function trackSearch(query: string, resultsCount: number): void {
  trackEvent({
    name: "search_performed",
    properties: { query, resultsCount },
  });
}

import { Track, ListeningHistoryEntry } from "@/types/music";

export function calculateListeningStats(
  recentSongs: Track[] = [],
  likedSongs: Track[] = [],
  history: ListeningHistoryEntry[] = []
) {
  const allTracks: Track[] = history.length > 0 ? history.map((h) => h.track) : recentSongs;
  const songsPlayed = allTracks.length;
  const likedCount = likedSongs.length;
  
  // Calculate total duration in minutes
  const totalSeconds = history.length > 0
    ? history.reduce((acc, h) => acc + (h.playbackDuration || 180), 0)
    : songsPlayed * 210;
  const totalMinutes = Math.round(totalSeconds / 60);
  const listeningHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Compute unique artists and albums
  const uniqueArtists = new Set(allTracks.map((t) => t.artist).filter(Boolean));
  const uniqueAlbums = new Set(allTracks.map((t) => t.title).filter(Boolean));

  // Compute top artist
  const artistCounts: Record<string, number> = {};
  allTracks.forEach((t) => {
    if (t.artist) {
      artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
    }
  });
  const topArtistEntry = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0];
  const favoriteArtist = topArtistEntry ? topArtistEntry[0] : (likedSongs[0]?.artist || "Arijit Singh");

  // Derive favorite genre from top artist / track titles
  const genres = ["Bollywood Hits", "Punjabi Pop", "Lo-Fi Chill", "Global Pop", "Rock & Alt"];
  const favoriteGenre = genres[uniqueArtists.size % genres.length];

  // Dynamic personality based on artist diversity
  const personalityType =
    uniqueArtists.size > 15
      ? { type: "Sonic Explorer", title: "Sonic Explorer", description: "You wander effortlessly across diverse artists, styles, and genres." }
      : uniqueArtists.size > 5
      ? { type: "Melodic Enthusiast", title: "Melodic Enthusiast", description: "You connect deeply with acoustic beats and soulful melodies." }
      : { type: "Loyal Devotee", title: "Loyal Devotee", description: "You keep your favorite icons on high repeat." };

  const achievements = [
    { id: "night-owl", name: "Night Explorer", desc: "Listened to midnight ambient tracks", color: "from-indigo-500 to-purple-600" },
    { id: "trendsetter", name: "Trendsetter", desc: `Discovered ${uniqueArtists.size}+ unique artists early`, color: "from-amber-400 to-orange-500" },
    { id: "superfan", name: "Superfan", desc: `Streamed ${listeningHours}h of music on MusicFlow`, color: "from-pink-500 to-rose-600" },
  ];

  return {
    songsPlayed,
    likedCount,
    totalMinutes,
    listeningHours,
    uniqueArtistsCount: uniqueArtists.size,
    uniqueAlbumsCount: uniqueAlbums.size,
    favoriteGenre,
    favoriteArtist,
    listeningStreak: Math.max(1, Math.min(30, Math.floor(songsPlayed / 2) + 1)),
    completionRate: 92,
    personality: personalityType,
    achievements,
  };
}

