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

export function calculateListeningStats(recentSongs: any[] = [], likedSongs: any[] = []) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const songsPlayed = recentSongs.length;
  const likedCount = likedSongs.length;
  const totalMinutes = Math.round(songsPlayed * 3.5);
  const listeningHours = Math.round((totalMinutes / 60) * 10) / 10;

  const achievements = [
    { id: "night-owl", name: "Night Explorer", desc: "Listened to midnight ambient tracks", color: "from-indigo-500 to-purple-600" },
    { id: "trendsetter", name: "Trendsetter", desc: "Discovered top trending artists early", color: "from-amber-400 to-orange-500" },
    { id: "superfan", name: "Superfan", desc: "Streamed 50+ hours of music this month", color: "from-pink-500 to-rose-600" },
  ];

  return {
    songsPlayed,
    likedCount,
    totalMinutes,
    listeningHours,
    favoriteGenre: "Bollywood Pop",
    favoriteArtist: "Arijit Singh",
    listeningStreak: 14,
    completionRate: "94%",
    personality: {
      type: "Melodic Enthusiast",
      title: "Melodic Enthusiast",
      desc: "You connect deeply with acoustic beats & soulful Bollywood melodies.",
      description: "You connect deeply with acoustic beats & soulful Bollywood melodies.",
    },
    achievements,
  };
}
