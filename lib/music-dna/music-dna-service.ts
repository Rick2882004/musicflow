import { Track, ListeningHistoryEntry, FollowedArtist } from "@/types/music";
import { inferTrackGenre } from "@/lib/listening-sessions/session-tracker";

export interface GenreShare {
  genre: string;
  percentage: number;
  count: number;
}

export interface ArtistShare {
  name: string;
  percentage: number;
  count: number;
}

export interface LanguageShare {
  language: string;
  percentage: number;
  count: number;
}

export interface MusicDNASignals {
  likedSongs?: Track[];
  history?: ListeningHistoryEntry[];
  recentSongs?: Track[];
  skips?: string[];
  followedArtists?: FollowedArtist[];
}

export interface MusicDNAProfile {
  isForming: boolean;
  totalInteractions: number;
  soundProfile: string;
  archetype: {
    title: string;
    description: string;
  };
  topGenres: GenreShare[];
  topArtists: ArtistShare[];
  topLanguages: LanguageShare[];
  favoriteMoods: string[];
  listeningStyle: {
    familiarPercentage: number;
    discoveryPercentage: number;
    description: string;
  };
  replayTendency: {
    percentage: number;
    description: string;
  };
  artistDiversity: {
    score: number; // 0 - 100
    uniqueArtists: number;
    totalTracks: number;
    description: string;
  };
  listeningConsistency: {
    activeDaysWeekly: number;
    primaryTimeOfDay: string;
  };
  explainers: {
    genresBasis: string;
    artistsBasis: string;
    styleBasis: string;
    diversityBasis: string;
    moodsBasis: string;
  };
}

function inferTrackLanguage(track: Track): string {
  const text = `${track.title || ""} ${track.artist || ""}`.toLowerCase();
  if (
    text.includes("arijit") ||
    text.includes("atif") ||
    text.includes("shreya") ||
    text.includes("kk") ||
    text.includes("kumar sanu") ||
    text.includes("sonu") ||
    text.includes("bollywood") ||
    text.includes("pritam") ||
    text.includes("mika") ||
    text.includes("jubin")
  ) {
    return "Hindi";
  }
  if (
    text.includes("dhillon") ||
    text.includes("diljit") ||
    text.includes("aujla") ||
    text.includes("punjabi") ||
    text.includes("sidhu") ||
    text.includes("shubh") ||
    text.includes("karan")
  ) {
    return "Punjabi";
  }
  if (text.includes("bengali") || text.includes("bangla") || text.includes("anupam") || text.includes("rabindra")) {
    return "Bengali";
  }
  if (
    text.includes("taylor") ||
    text.includes("sheeran") ||
    text.includes("weeknd") ||
    text.includes("drake") ||
    text.includes("billie") ||
    text.includes("coldplay") ||
    text.includes("queen")
  ) {
    return "English";
  }
  if (text.includes("latin") || text.includes("reggaeton") || text.includes("fonsi") || text.includes("spanish")) {
    return "Spanish";
  }
  return "English";
}

function inferTrackMood(track: Track): string {
  const text = `${track.title || ""} ${track.artist || ""}`.toLowerCase();
  if (text.includes("love") || text.includes("tum") || text.includes("dil") || text.includes("romantic") || text.includes("saath")) {
    return "Romantic";
  }
  if (text.includes("lofi") || text.includes("chill") || text.includes("relax") || text.includes("sleep") || text.includes("peace")) {
    return "Chill";
  }
  if (text.includes("workout") || text.includes("energy") || text.includes("pump") || text.includes("dance") || text.includes("party")) {
    return "High Energy";
  }
  if (text.includes("sad") || text.includes("dard") || text.includes("tears") || text.includes("lonely") || text.includes("adhuri")) {
    return "Melancholy";
  }
  if (text.includes("focus") || text.includes("study") || text.includes("piano") || text.includes("instrumental")) {
    return "Deep Focus";
  }
  return "Soulful";
}

export function computeMusicDNA(signals: MusicDNASignals): MusicDNAProfile {
  const {
    likedSongs = [],
    history = [],
    recentSongs = [],
    skips = [],
    followedArtists = [],
  } = signals;

  // Aggregate all played and saved tracks
  const historyTracks = history.map((h) => h.track);
  const allTracks = historyTracks.length > 0 ? historyTracks : recentSongs;
  const totalInteractions = allTracks.length + likedSongs.length + followedArtists.length;

  // Cold Start Detection: insufficient data (< 3 total interactions)
  if (totalInteractions < 3) {
    return {
      isForming: true,
      totalInteractions,
      soundProfile: "Forming...",
      archetype: {
        title: "Music Explorer",
        description: "Your taste profile is still taking shape. Listen to songs and like your favorites to unlock your DNA.",
      },
      topGenres: [],
      topArtists: [],
      topLanguages: [],
      favoriteMoods: [],
      listeningStyle: {
        familiarPercentage: 50,
        discoveryPercentage: 50,
        description: "Awaiting listening activity.",
      },
      replayTendency: {
        percentage: 0,
        description: "Awaiting listening activity.",
      },
      artistDiversity: {
        score: 50,
        uniqueArtists: 0,
        totalTracks: 0,
        description: "Awaiting listening activity.",
      },
      listeningConsistency: {
        activeDaysWeekly: 0,
        primaryTimeOfDay: "Flexible",
      },
      explainers: {
        genresBasis: "Requires at least 3 tracks to calculate.",
        artistsBasis: "Requires at least 3 tracks to calculate.",
        styleBasis: "Requires at least 3 tracks to calculate.",
        diversityBasis: "Requires at least 3 tracks to calculate.",
        moodsBasis: "Requires at least 3 tracks to calculate.",
      },
    };
  }

  // 1. Artist aggregation with weighted counts (history + liked + followed)
  const skipSet = new Set(skips);
  const artistCounts: Record<string, number> = {};
  for (const t of allTracks) {
    if (t.artist) {
      const penalty = skipSet.has(t.videoId) || skipSet.has(`artist:${t.artist.toLowerCase().trim()}`) ? 0.5 : 0;
      artistCounts[t.artist] = Math.max(0, (artistCounts[t.artist] || 0) + 1 - penalty);
    }
  }
  for (const t of likedSongs) {
    if (t.artist) artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1.5;
  }
  for (const fa of followedArtists) {
    if (fa.name) artistCounts[fa.name] = (artistCounts[fa.name] || 0) + 2.0;
  }

  const totalArtistWeight = Object.values(artistCounts).reduce((a, b) => a + b, 0) || 1;
  const topArtists: ArtistShare[] = Object.entries(artistCounts)
    .map(([name, count]) => ({
      name,
      count: Math.round(count),
      percentage: Math.round((count / totalArtistWeight) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 2. Genre aggregation
  const genreCounts: Record<string, number> = {};
  for (const t of allTracks) {
    const genre = inferTrackGenre(t);
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  }
  for (const t of likedSongs) {
    const genre = inferTrackGenre(t);
    genreCounts[genre] = (genreCounts[genre] || 0) + 1.5;
  }
  const totalGenreWeight = Object.values(genreCounts).reduce((a, b) => a + b, 0) || 1;
  const topGenres: GenreShare[] = Object.entries(genreCounts)
    .map(([genre, count]) => ({
      genre,
      count: Math.round(count),
      percentage: Math.round((count / totalGenreWeight) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // 3. Language aggregation
  const languageCounts: Record<string, number> = {};
  for (const t of allTracks) {
    const lang = inferTrackLanguage(t);
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  }
  for (const t of likedSongs) {
    const lang = inferTrackLanguage(t);
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  }
  const totalLangWeight = Object.values(languageCounts).reduce((a, b) => a + b, 0) || 1;
  const topLanguages: LanguageShare[] = Object.entries(languageCounts)
    .map(([language, count]) => ({
      language,
      count: Math.round(count),
      percentage: Math.round((count / totalLangWeight) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4);

  // 4. Moods aggregation
  const moodCounts: Record<string, number> = {};
  for (const t of allTracks) {
    const mood = inferTrackMood(t);
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  }
  const favoriteMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0])
    .slice(0, 4);

  // 5. Familiarity vs. Discovery Calculation
  // Replayed tracks (played >= 2 times or liked) vs. novel tracks
  const trackIdFrequency: Record<string, number> = {};
  for (const t of allTracks) {
    trackIdFrequency[t.videoId] = (trackIdFrequency[t.videoId] || 0) + 1;
  }
  let familiarPlays = 0;
  let discoveryPlays = 0;
  for (const [vid, freq] of Object.entries(trackIdFrequency)) {
    const isLiked = likedSongs.some((s) => s.videoId === vid);
    if (freq >= 2 || isLiked) {
      familiarPlays += freq;
    } else {
      discoveryPlays += freq;
    }
  }
  const totalPlays = Math.max(1, familiarPlays + discoveryPlays);
  const familiarPercentage = Math.round((familiarPlays / totalPlays) * 100);
  const discoveryPercentage = 100 - familiarPercentage;

  // 6. Replay Tendency
  const replayedTracksCount = Object.values(trackIdFrequency).filter((f) => f >= 2).length;
  const uniqueTracksCount = Object.keys(trackIdFrequency).length || 1;
  const replayPercentage = Math.round((replayedTracksCount / uniqueTracksCount) * 100);

  // 7. Artist Diversity
  const uniqueArtists = new Set(allTracks.map((t) => t.artist).filter(Boolean)).size;
  const diversityScore = Math.min(100, Math.round((uniqueArtists / Math.max(1, allTracks.length)) * 100));

  // Archetype determination
  let archetypeTitle = "Eclectic Connoisseur";
  let archetypeDesc = "You balance iconic favorites with a steady stream of fresh discoveries.";
  if (discoveryPercentage >= 65 || diversityScore >= 75) {
    archetypeTitle = "Sonic Explorer";
    archetypeDesc = "You wander effortlessly across genres and emerging artists, rarely repeating songs.";
  } else if (familiarPercentage >= 70 || replayPercentage >= 50) {
    archetypeTitle = "Loyal Devotee";
    archetypeDesc = "You keep your signature anthems on continuous repeat and stay loyal to your favorite artists.";
  } else if (topGenres[0]?.percentage >= 50) {
    archetypeTitle = "Genre Specialist";
    archetypeDesc = `You have a deep, focused appreciation for ${topGenres[0].genre}.`;
  }

  // Sound Profile: (e.g. "Melodic • Cinematic • Late Night")
  const primaryGenre = topGenres[0]?.genre || "Eclectic";
  const primaryMood = favoriteMoods[0] || "Soulful";
  const secondaryMood = favoriteMoods[1] || "Atmospheric";
  const soundProfile = `${primaryMood} • ${secondaryMood} • ${primaryGenre}`;

  // Time of day pattern
  let primaryTimeOfDay = "Evening";
  if (history.length > 0) {
    const hours = history.map((h) => new Date(h.timestamp).getHours());
    const nightCount = hours.filter((hr) => hr >= 22 || hr < 5).length;
    const morningCount = hours.filter((hr) => hr >= 5 && hr < 12).length;
    const afternoonCount = hours.filter((hr) => hr >= 12 && hr < 17).length;
    const eveningCount = hours.filter((hr) => hr >= 17 && hr < 22).length;
    const maxHourCount = Math.max(nightCount, morningCount, afternoonCount, eveningCount);
    if (maxHourCount === nightCount) primaryTimeOfDay = "Late Night";
    else if (maxHourCount === morningCount) primaryTimeOfDay = "Morning";
    else if (maxHourCount === afternoonCount) primaryTimeOfDay = "Afternoon";
    else primaryTimeOfDay = "Evening";
  }

  // Active days count
  const uniqueDayKeys = new Set(
    history.map((h) => {
      const d = new Date(h.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  const activeDaysWeekly = Math.min(7, Math.max(1, uniqueDayKeys.size));

  return {
    isForming: false,
    totalInteractions,
    soundProfile,
    archetype: {
      title: archetypeTitle,
      description: archetypeDesc,
    },
    topGenres,
    topArtists,
    topLanguages,
    favoriteMoods,
    listeningStyle: {
      familiarPercentage,
      discoveryPercentage,
      description:
        familiarPercentage > discoveryPercentage
          ? `${familiarPercentage}% Familiar vs ${discoveryPercentage}% Discovery: You tend to ground your sessions in proven favorites.`
          : `${discoveryPercentage}% Discovery vs ${familiarPercentage}% Familiar: You actively pursue unfamiliar artists and styles.`,
    },
    replayTendency: {
      percentage: replayPercentage,
      description: `You have replayed ${replayedTracksCount} of your ${uniqueTracksCount} listened songs multiple times.`,
    },
    artistDiversity: {
      score: diversityScore,
      uniqueArtists,
      totalTracks: allTracks.length,
      description: `Explored ${uniqueArtists} unique artists across ${allTracks.length} track plays.`,
    },
    listeningConsistency: {
      activeDaysWeekly,
      primaryTimeOfDay,
    },
    explainers: {
      genresBasis: `Calculated from ${allTracks.length} plays & ${likedSongs.length} likes, categorizing catalog artist & title signatures.`,
      artistsBasis: `Ranked by total frequency across listening history (+1.0), liked songs (+1.5), and followed artists (+2.0).`,
      styleBasis: `Derived by comparing repeated songs & liked songs (${familiarPlays} plays) against newly encountered tracks (${discoveryPlays} plays).`,
      diversityBasis: `Computed from the ratio of unique artists (${uniqueArtists}) to total stream volume (${allTracks.length}).`,
      moodsBasis: `Inferred from acoustic attributes and title semantics of your top listened songs.`,
    },
  };
}
