import { UserTasteProfile } from "../types";
import { Track, ListeningHistoryEntry, FollowedArtist, Playlist } from "@/types/music";

export interface UserSignals {
  likedSongs?: Track[];
  recentSongs?: Track[];
  history?: ListeningHistoryEntry[];
  skips?: string[];
  followedArtists?: FollowedArtist[];
  playlists?: Playlist[];
}

export function buildUserTasteProfile(signals: UserSignals): UserTasteProfile {
  const {
    likedSongs = [],
    recentSongs = [],
    history = [],
    skips = [],
    followedArtists = [],
    playlists = [],
  } = signals;

  // 1. Calculate artist affinity weights
  const artistScores = new Map<string, number>();

  // Followed artists have strong affinity (+3.5)
  for (const fa of followedArtists) {
    if (fa.name) {
      const name = fa.name.trim();
      artistScores.set(name, (artistScores.get(name) || 0) + 3.5);
    }
  }

  // Liked songs (+2.5)
  for (const s of likedSongs) {
    if (s.artist) {
      const artist = s.artist.trim();
      artistScores.set(artist, (artistScores.get(artist) || 0) + 2.5);
    }
  }

  // Playlist additions (+2.0)
  for (const p of playlists) {
    for (const s of p.songs || []) {
      if (s.artist) {
        const artist = s.artist.trim();
        artistScores.set(artist, (artistScores.get(artist) || 0) + 2.0);
      }
    }
  }

  // History completions (+1.5 for completed, -2.0 for quick skips)
  const completedIds = new Set<string>();
  const skippedIds = new Set<string>(skips);
  const trackPlayCounts = new Map<string, number>();

  for (const h of history) {
    const vid = h.track.videoId;
    trackPlayCounts.set(vid, (trackPlayCounts.get(vid) || 0) + 1);

    if (h.completionPercentage >= 75 || h.playbackDuration >= 120) {
      completedIds.add(vid);
      if (h.track.artist) {
        const artist = h.track.artist.trim();
        artistScores.set(artist, (artistScores.get(artist) || 0) + 1.5);
      }
    } else if (h.completionPercentage < 20 && h.playbackDuration < 30 && h.playbackDuration > 0) {
      skippedIds.add(vid);
      if (h.track.artist) {
        const artist = h.track.artist.trim();
        artistScores.set(artist, Math.max(0, (artistScores.get(artist) || 0) - 1.5));
      }
    }
  }

  // Recent songs (+1.0)
  for (const s of recentSongs.slice(0, 15)) {
    if (s.artist) {
      const artist = s.artist.trim();
      artistScores.set(artist, (artistScores.get(artist) || 0) + 1.0);
    }
  }

  // Sort top artists
  const topArtists = Array.from(artistScores.entries())
    .map(([name, weight]) => ({ name, weight: Math.round(weight * 10) / 10 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 15);

  // 2. Identify replay tracks (played >= 2 times)
  const replayTrackIds: string[] = [];
  for (const [vid, count] of trackPlayCounts.entries()) {
    if (count >= 2) replayTrackIds.push(vid);
  }

  // 3. Infer top genres and languages from artist signals
  const genreScores = new Map<string, number>();
  const languageScores = new Map<string, number>();

  for (const { name, weight } of topArtists) {
    const lower = name.toLowerCase();
    if (
      lower.includes("arijit") ||
      lower.includes("kk") ||
      lower.includes("atif") ||
      lower.includes("shreya") ||
      lower.includes("sonu") ||
      lower.includes("pritam")
    ) {
      genreScores.set("Bollywood Romantic", (genreScores.get("Bollywood Romantic") || 0) + weight);
      languageScores.set("Hindi", (languageScores.get("Hindi") || 0) + weight);
    } else if (lower.includes("dhillon") || lower.includes("diljit") || lower.includes("aujla") || lower.includes("shubh")) {
      genreScores.set("Punjabi Pop & Trap", (genreScores.get("Punjabi Pop & Trap") || 0) + weight);
      languageScores.set("Punjabi", (languageScores.get("Punjabi") || 0) + weight);
    } else if (lower.includes("taylor") || lower.includes("sheeran") || lower.includes("weeknd") || lower.includes("drake")) {
      genreScores.set("Global Pop & R&B", (genreScores.get("Global Pop & R&B") || 0) + weight);
      languageScores.set("English", (languageScores.get("English") || 0) + weight);
    } else if (lower.includes("lofi") || lower.includes("beats")) {
      genreScores.set("Lo-Fi & Chill", (genreScores.get("Lo-Fi & Chill") || 0) + weight);
    }
  }

  const topGenres = Array.from(genreScores.entries())
    .map(([genre, weight]) => ({ genre, weight: Math.round(weight * 10) / 10 }))
    .sort((a, b) => b.weight - a.weight);

  const topLanguages = Array.from(languageScores.entries())
    .map(([language, weight]) => ({ language, weight: Math.round(weight * 10) / 10 }))
    .sort((a, b) => b.weight - a.weight);

  return {
    topArtists,
    topGenres,
    topLanguages,
    preferredMoods: topGenres.some((g) => g.genre.includes("Romantic"))
      ? ["Romantic", "Melancholy", "Soulful"]
      : ["Chill", "Energetic"],
    preferredEras: ["Modern Hits", "2010s", "90s Classics"],
    skippedTrackIds: Array.from(skippedIds),
    completedTrackIds: Array.from(completedIds),
    replayTrackIds,
    totalInteractions: likedSongs.length + recentSongs.length + history.length,
  };
}
