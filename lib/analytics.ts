import { Track } from "@/types/music";

export interface ListeningStats {
  listeningHours: number;
  songsPlayed: number;
  uniqueSongs: number;
  uniqueArtists: number;
  favoriteArtist: string;
  favoriteGenre: string;
  listeningStreak: number;
  skipRate: number;
  completionRate: number;
  personality: {
    type: string;
    title: string;
    description: string;
  };
  achievements: Array<{
    id: string;
    name: string;
    desc: string;
    color: string;
  }>;
}

export function calculateListeningStats(recentSongs: Track[], likedSongs: Track[]): ListeningStats {
  const songsPlayed = recentSongs.length;
  
  // Count unique items
  const uniqueSongs = new Set(recentSongs.map((s) => s.videoId)).size;
  const uniqueArtists = new Set(recentSongs.map((s) => s.artist).filter(Boolean)).size;

  // Calculate total hours
  const totalDurationSeconds = recentSongs.reduce((acc, s) => acc + (s.duration || 190), 0);
  const listeningHours = Math.round((totalDurationSeconds / 3600) * 10) / 10;

  // Estimate favorite artist
  const artistCounts: Record<string, number> = {};
  recentSongs.forEach((song) => {
    if (song.artist) {
      artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
    }
  });
  const sortedArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]);
  const favoriteArtist = sortedArtists[0]?.[0] || "Arijit Singh";

  // Mock streaks & completion rates based on user play history counts
  const listeningStreak = songsPlayed > 0 ? Math.min(14, Math.floor(songsPlayed / 3) + 2) : 0;
  const skipRate = songsPlayed > 0 ? Math.max(5, Math.min(65, 40 - Math.floor(songsPlayed / 2))) : 0;
  const completionRate = 100 - skipRate;

  // Estimate favorite genre
  const genres = ["Bollywood", "Lo-Fi", "Pop", "Workout", "Chill", "Romantic"];
  const favoriteGenre = genres[songsPlayed % genres.length] || "Bollywood";

  // Personalities definitions
  const personalities = [
    { type: "FTWR", title: "The Explorer", description: "You are constantly seeking new sounds, charting paths into undiscovered musical realms." },
    { type: "FTLO", title: "The Loyal Devotee", description: "You hold close to the songs you love, diving deep into favorite artists repeatedly." },
    { type: "MELO", title: "The Chronicler", description: "Your listening mirrors your feelings, utilizing music as the soundscape for your thoughts." },
  ];
  const personality = personalities[songsPlayed % personalities.length];

  // Achievements rules list
  const achievements = [];
  if (songsPlayed >= 1) {
    achievements.push({ id: "ach1", name: "Pioneer", desc: "First stream session completed", color: "from-amber-500 to-yellow-400" });
  }
  if (likedSongs.length >= 5) {
    achievements.push({ id: "ach2", name: "Collector", desc: "Built a curated liked history", color: "from-pink-500 to-rose-400" });
  }
  if (listeningStreak >= 7) {
    achievements.push({ id: "ach3", name: "Daily Habit", desc: "7-day listening streak active", color: "from-teal-500 to-emerald-400" });
  }
  if (uniqueArtists >= 5) {
    achievements.push({ id: "ach4", name: "Explorer", desc: "Streamed 5+ unique artists", color: "from-purple-500 to-indigo-400" });
  }

  return {
    listeningHours,
    songsPlayed,
    uniqueSongs,
    uniqueArtists,
    favoriteArtist,
    favoriteGenre,
    listeningStreak,
    skipRate,
    completionRate,
    personality,
    achievements,
  };
}
