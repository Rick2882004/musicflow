import { Track, ListeningHistoryEntry } from "@/types/music";
import { UserTasteProfile } from "../types";
import { searchSongs } from "@/lib/ytmusic";
import { verifyPlayableTrack, normalizeTrackTitle } from "../queue/track-verifier";

export type SmartMixId =
  | "for-you"
  | "chill"
  | "focus"
  | "workout"
  | "late-night"
  | "discovery"
  | "favorites";

export interface SmartMix {
  id: SmartMixId;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  accent: string;
  tracks: Track[];
  coverArtwork: string;
  totalDuration: number;
}

export interface MixConfig {
  id: SmartMixId;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  accent: string;
  fallbackQueries: string[];
}

const MIX_DEFINITIONS: Record<SmartMixId, MixConfig> = {
  "for-you": {
    id: "for-you",
    title: "For You Mix",
    subtitle: "Made For You",
    description: "Your personalized acoustic blend matching your current music obsessions.",
    gradient: "from-purple-600 via-indigo-700 to-zinc-950",
    accent: "#a855f7",
    fallbackQueries: ["Trending Top Hits 2026", "Global Viral Hits", "Popular Music"],
  },
  chill: {
    id: "chill",
    title: "Chill Mix",
    subtitle: "Relax & Unwind",
    description: "Laid-back rhythms, warm acoustic melodies, and soothing low-tempo textures.",
    gradient: "from-teal-600 via-emerald-800 to-zinc-950",
    accent: "#14b8a6",
    fallbackQueries: ["Lo-Fi Chill Beats", "Acoustic Chill Hits", "Relaxing Sunset Melodies"],
  },
  focus: {
    id: "focus",
    title: "Focus Mix",
    subtitle: "Deep Concentration",
    description: "Ambient soundscapes, clean instrumental music, and non-distracting flows.",
    gradient: "from-blue-600 via-cyan-800 to-zinc-950",
    accent: "#3b82f6",
    fallbackQueries: ["Deep Focus Ambient", "Instrumental Study Beats", "Brain Flow Piano"],
  },
  workout: {
    id: "workout",
    title: "Workout Mix",
    subtitle: "Energy & Power",
    description: "High-voltage basslines, fast BPM anthems, and gym-ready adrenaline.",
    gradient: "from-orange-600 via-red-700 to-zinc-950",
    accent: "#f97316",
    fallbackQueries: ["Workout Motivation Hits", "High Energy Gym EDM", "Fast BPM Cardio"],
  },
  "late-night": {
    id: "late-night",
    title: "Late Night Mix",
    subtitle: "Midnight Vibes",
    description: "Nocturnal R&B, atmospheric synths, and moody night drive tracks.",
    gradient: "from-violet-600 via-fuchsia-800 to-zinc-950",
    accent: "#8b5cf6",
    fallbackQueries: ["Late Night Drive Songs", "Nocturnal R&B", "Midnight Synthwave Chill"],
  },
  discovery: {
    id: "discovery",
    title: "Discovery Mix",
    subtitle: "Fresh Horizons",
    description: "Rising artists and unexpected hidden gems tuned to expand your sonic palate.",
    gradient: "from-pink-600 via-rose-800 to-zinc-950",
    accent: "#ec4899",
    fallbackQueries: ["Emerging Artists Hits 2026", "Indie Discoveries", "Fresh Underground"],
  },
  favorites: {
    id: "favorites",
    title: "Favorites Mix",
    subtitle: "Heavy Rotation",
    description: "Your most-loved songs and top replayed tracks gathered together.",
    gradient: "from-amber-600 via-orange-800 to-zinc-950",
    accent: "#f59e0b",
    fallbackQueries: ["All Time Greatest Hits", "Timeless Favorites", "Classic Anthems"],
  },
};

// In-memory cache for mixes (TTL 10 mins)
const mixCache = new Map<string, { mix: SmartMix; expiresAt: number }>();

export async function generateSmartMix(
  mixId: SmartMixId,
  profile: UserTasteProfile,
  likedSongs: Track[] = [],
  history: ListeningHistoryEntry[] = [],
  skips: string[] = [],
  forceRefresh = false
): Promise<SmartMix> {
  const cacheKey = `${mixId}_${profile.topArtists.map((a) => a.name).slice(0, 3).join("|")}`;
  const cached = mixCache.get(cacheKey);

  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.mix;
  }

  const def = MIX_DEFINITIONS[mixId] || MIX_DEFINITIONS["for-you"];
  const targetCount = 18;
  const verifiedTracks: Track[] = [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const avoidArtistNames = new Set(
    skips
      .filter((s) => s.startsWith("artist:"))
      .map((s) => s.replace("artist:", "").toLowerCase().trim())
  );

  // Helper to verify and add tracks
  const addCandidates = async (candidates: Track[], maxToAdd: number) => {
    for (const cand of candidates) {
      if (verifiedTracks.length >= targetCount) break;
      if (!cand || !cand.title || !cand.artist) continue;
      if (cand.videoId && seenIds.has(cand.videoId)) continue;

      const aNorm = cand.artist.toLowerCase().trim();
      if (avoidArtistNames.has(aNorm)) continue;

      const tNorm = normalizeTrackTitle(cand.title);
      if (seenTitles.has(tNorm)) continue;

      const check = await verifyPlayableTrack(cand);
      if (check.valid && check.verifiedTrack) {
        seenIds.add(check.verifiedTrack.videoId);
        seenTitles.add(tNorm);
        verifiedTracks.push(check.verifiedTrack);
        if (verifiedTracks.length >= maxToAdd) break;
      }
    }
  };

  // ── Mix-Specific Generation Logic ──
  if (mixId === "favorites") {
    // 1. Liked songs first
    if (likedSongs.length > 0) {
      await addCandidates(likedSongs, targetCount);
    }
    // 2. High-completion history songs
    if (verifiedTracks.length < targetCount && history.length > 0) {
      const historyTracks = history
        .filter((h) => (h.completionPercentage || 0) >= 0.5)
        .map((h) => h.track);
      await addCandidates(historyTracks, targetCount);
    }
  } else if (mixId === "for-you") {
    // Top artists seeds
    const artistSeeds = profile.topArtists.slice(0, 3).map((a) => `${a.name} Best Songs`);
    const genreSeed = profile.topGenres[0]?.genre ? `${profile.topGenres[0].genre} Hits` : "";
    const queries = [...artistSeeds, genreSeed, ...def.fallbackQueries].filter(Boolean);

    for (const q of queries) {
      if (verifiedTracks.length >= targetCount) break;
      try {
        const results = await searchSongs(q);
        await addCandidates(results, targetCount);
      } catch {}
    }
  } else if (mixId === "discovery") {
    // Anti-fatigue: exclude top 5 familiar artists
    const familiarArtists = new Set(
      profile.topArtists.slice(0, 5).map((a) => a.name.toLowerCase().trim())
    );

    for (const q of def.fallbackQueries) {
      if (verifiedTracks.length >= targetCount) break;
      try {
        const results = await searchSongs(q);
        const filtered = results.filter(
          (t) => !familiarArtists.has((t.artist || "").toLowerCase().trim())
        );
        await addCandidates(filtered, targetCount);
      } catch {}
    }
  } else {
    // Mood / Activity based (chill, focus, workout, late-night)
    const topGenre = profile.topGenres[0]?.genre;
    const queries = [...def.fallbackQueries];
    if (topGenre) {
      queries.unshift(`${topGenre} ${def.title.replace(" Mix", "")}`);
    }

    for (const q of queries) {
      if (verifiedTracks.length >= targetCount) break;
      try {
        const results = await searchSongs(q);
        await addCandidates(results, targetCount);
      } catch {}
    }
  }

  // If still low, use fallback queries
  if (verifiedTracks.length < 8) {
    for (const fb of def.fallbackQueries) {
      if (verifiedTracks.length >= targetCount) break;
      try {
        const results = await searchSongs(fb);
        await addCandidates(results, targetCount);
      } catch {}
    }
  }

  const coverArtwork =
    verifiedTracks[0]?.thumbnail ||
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80";

  const totalDuration = verifiedTracks.reduce(
    (acc, t) => acc + (t.duration || 210),
    0
  );

  const smartMix: SmartMix = {
    id: mixId,
    title: def.title,
    subtitle: def.subtitle,
    description: def.description,
    gradient: def.gradient,
    accent: def.accent,
    tracks: verifiedTracks,
    coverArtwork,
    totalDuration,
  };

  mixCache.set(cacheKey, {
    mix: smartMix,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return smartMix;
}

export async function getAllSmartMixes(
  profile: UserTasteProfile,
  likedSongs: Track[] = [],
  history: ListeningHistoryEntry[] = [],
  skips: string[] = [],
  forceRefresh = false
): Promise<SmartMix[]> {
  const mixIds: SmartMixId[] = [
    "for-you",
    "chill",
    "focus",
    "workout",
    "late-night",
    "discovery",
    "favorites",
  ];

  const mixes = await Promise.all(
    mixIds.map((id) =>
      generateSmartMix(id, profile, likedSongs, history, skips, forceRefresh).catch((err) => {
        console.error(`Failed to generate mix ${id}:`, err);
        const def = MIX_DEFINITIONS[id];
        return {
          id,
          title: def.title,
          subtitle: def.subtitle,
          description: def.description,
          gradient: def.gradient,
          accent: def.accent,
          tracks: [],
          coverArtwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
          totalDuration: 0,
        };
      })
    )
  );

  return mixes.filter((m) => m.tracks.length > 0);
}
