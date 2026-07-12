import { Track } from "@/types/music";

export interface MixDefinition {
  id: string;
  name: string;
  subtitle: string;
  query: string;
  emoji: string;
  color: string;
}

export function getPersonalizedMixes(likedSongs: Track[], recentSongs: Track[]): MixDefinition[] {
  const artistCounts: { [key: string]: number } = {};
  
  // Count artists from both liked and recently played songs to estimate user's taste profile
  [...likedSongs, ...recentSongs].forEach((s) => {
    if (s.artist) {
      artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1;
    }
  });

  const sortedArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const favoriteArtist = sortedArtists[0] || "Arijit Singh";
  const secondArtist = sortedArtists[1] || "KK";

  return [
    {
      id: "daily-mix",
      name: "Daily Mix",
      subtitle: "Made For You",
      query: `${favoriteArtist} radio mix`,
      emoji: "🎵",
      color: "from-purple-500/25 to-purple-950/5",
    },
    {
      id: "chill-mix",
      name: "Chill Mix",
      subtitle: "Chill Vibes",
      query: "Lofi chill study instrumental piano ambient",
      emoji: "☕",
      color: "from-blue-500/25 to-blue-950/5",
    },
    {
      id: "workout-mix",
      name: "Workout Mix",
      subtitle: "High Energy",
      query: "Gym workout phonk high energy gaming EDM",
      emoji: "⚡",
      color: "from-orange-500/25 to-orange-950/5",
    },
    {
      id: "focus-mix",
      name: "Focus Mix",
      subtitle: "Concentrate",
      query: "Ambient coding space synthwave focus beats",
      emoji: "💻",
      color: "from-teal-500/25 to-teal-950/5",
    },
    {
      id: "discover-weekly",
      name: "Discover Weekly",
      subtitle: "New Discoveries",
      query: `${secondArtist} latest music pop hits`,
      emoji: "✨",
      color: "from-pink-500/25 to-pink-950/5",
    },
    {
      id: "hidden-gems",
      name: "Hidden Gems",
      subtitle: "Deep Cuts",
      query: `${favoriteArtist} underrated songs live acoustic`,
      emoji: "💎",
      color: "from-amber-500/25 to-amber-950/5",
    },
  ];
}
