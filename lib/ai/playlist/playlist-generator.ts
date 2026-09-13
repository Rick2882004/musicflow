import { Track } from "@/types/music";
import { searchSongs } from "@/lib/ytmusic";
import { verifyPlayableTrack, normalizeTrackTitle } from "../queue/track-verifier";

export interface ParsedPrompt {
  moods: string[];
  genres: string[];
  activities: string[];
  targetTracks: number;
  suggestedTitle: string;
  suggestedDescription: string;
  searchSeeds: string[];
}

export interface GeneratedPlaylist {
  title: string;
  description: string;
  prompt: string;
  coverImage: string;
  tracks: Track[];
  totalDuration: number;
}

const MOOD_KEYWORDS: Record<string, { moods: string[]; genres: string[]; seeds: string[] }> = {
  workout: {
    moods: ["high energy", "intense", "motivational"],
    genres: ["EDM", "Hip Hop", "Trap"],
    seeds: ["Workout Motivation Hits", "High Energy Gym EDM", "Intense Training Beats"],
  },
  gym: {
    moods: ["high energy", "powerful"],
    genres: ["Hip Hop", "Rock", "Phonk"],
    seeds: ["Gym Pump Workout", "Hardstyle Gym Motivation", "Aggressive Workout Hip Hop"],
  },
  chill: {
    moods: ["relaxed", "calm", "mellow"],
    genres: ["Lo-Fi", "Acoustic", "Indie"],
    seeds: ["Lo-Fi Chill Beats to Relax", "Acoustic Morning Vibes", "Cozy Coffee House"],
  },
  rain: {
    moods: ["melancholic", "reflective", "peaceful"],
    genres: ["Lo-Fi", "Piano", "Indie Folk"],
    seeds: ["Rainy Day Lo-Fi Beats", "Peaceful Piano Reflections", "Acoustic Rainy Afternoon"],
  },
  focus: {
    moods: ["concentrated", "zen", "ambient"],
    genres: ["Ambient", "Instrumental", "Electronic"],
    seeds: ["Deep Focus Flow State", "Electronic Study Beats", "Instrumental Concentration"],
  },
  study: {
    moods: ["focused", "calm"],
    genres: ["Lo-Fi", "Classical", "Ambient"],
    seeds: ["Study Session Background", "Gentle Classical Focus", "Ambient Drone Study"],
  },
  coding: {
    moods: ["hypnotic", "cyberpunk", "flowing"],
    genres: ["Synthwave", "Cyberpunk", "Downtempo"],
    seeds: ["Synthwave Coding Beats", "Cyberpunk Focus Instrumental", "Chill Dark Electro"],
  },
  "night drive": {
    moods: ["nocturnal", "atmospheric", "cinematic"],
    genres: ["Synthwave", "R&B", "Dream Pop"],
    seeds: ["Late Night City Drive Synthwave", "Nocturnal R&B Slowed", "Midnight Neon Highway"],
  },
  party: {
    moods: ["euphoric", "upbeat", "celebratory"],
    genres: ["Dance", "Pop", "Club"],
    seeds: ["Party Dance Anthems 2026", "Club Bangers Worldwide", "Upbeat Pop Hits"],
  },
  romance: {
    moods: ["intimate", "warm", "loving"],
    genres: ["R&B", "Acoustic Pop", "Soul"],
    seeds: ["Romantic Candlelight Melodies", "Sweet Acoustic Love Songs", "Warm R&B Duets"],
  },
};

export function parsePlaylistPrompt(prompt: string, customDurationMinutes?: number): ParsedPrompt {
  const lower = prompt.toLowerCase();
  const moods: string[] = [];
  const genres: string[] = [];
  const activities: string[] = [];
  const searchSeeds: string[] = [];

  // Keyword Matching
  for (const [key, mapping] of Object.entries(MOOD_KEYWORDS)) {
    if (lower.includes(key)) {
      moods.push(...mapping.moods);
      genres.push(...mapping.genres);
      searchSeeds.push(...mapping.seeds);
      activities.push(key);
    }
  }

  // Genre detection directly
  const knownGenres = ["bollywood", "punjabi", "rock", "pop", "hip hop", "rap", "jazz", "synthwave", "lofi", "lo-fi", "classical", "metal", "country", "electronic", "reggae", "latin", "r&b"];
  for (const g of knownGenres) {
    if (lower.includes(g)) {
      genres.push(g.toUpperCase());
      searchSeeds.push(`${g} Hits`);
    }
  }

  // Duration Parsing
  let targetTracks = 18;
  if (customDurationMinutes && customDurationMinutes > 0) {
    targetTracks = Math.max(5, Math.min(40, Math.round((customDurationMinutes * 60) / 210)));
  } else {
    const hourMatch = lower.match(/(\d+)\s*(?:hours?|hrs?|h)/);
    const minMatch = lower.match(/(\d+)\s*(?:mins?|minutes?|m)/);
    const trackMatch = lower.match(/(\d+)\s*(?:songs?|tracks?)/);

    if (trackMatch) {
      targetTracks = Math.max(5, Math.min(40, parseInt(trackMatch[1], 10)));
    } else if (hourMatch) {
      const hours = parseInt(hourMatch[1], 10);
      targetTracks = Math.max(5, Math.min(40, Math.round((hours * 3600) / 210)));
    } else if (minMatch) {
      const mins = parseInt(minMatch[1], 10);
      targetTracks = Math.max(5, Math.min(40, Math.round((mins * 60) / 210)));
    }
  }

  // Fallback search seeds
  if (searchSeeds.length === 0) {
    searchSeeds.push(`${prompt} Songs`, `${prompt} Music Hits`, `${prompt} Playlist`);
  }

  // Generate a clean suggested title
  const words = prompt
    .split(/\s+/)
    .slice(0, 5)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const suggestedTitle = words.length > 0 ? `${words} Mix` : "AI Generated Mix";
  const suggestedDescription = `Handcrafted by AI based on "${prompt}" — ${targetTracks} verified playable tracks.`;

  return {
    moods: Array.from(new Set(moods)),
    genres: Array.from(new Set(genres)),
    activities: Array.from(new Set(activities)),
    targetTracks,
    suggestedTitle,
    suggestedDescription,
    searchSeeds: Array.from(new Set(searchSeeds)),
  };
}

export async function generatePlaylistFromPrompt(
  prompt: string,
  durationMinutes?: number
): Promise<GeneratedPlaylist> {
  const parsed = parsePlaylistPrompt(prompt, durationMinutes);

  const rawCandidates: Track[] = [];
  const searchPromises = parsed.searchSeeds.slice(0, 4).map(async (seed) => {
    try {
      return await searchSongs(seed);
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(searchPromises);
  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      rawCandidates.push(...r.value);
    }
  }

  // Also query prompt directly
  try {
    const directHits = await searchSongs(prompt);
    rawCandidates.unshift(...directHits);
  } catch {}

  const verifiedTracks: Track[] = [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const seenArtists = new Map<string, number>();

  for (const cand of rawCandidates) {
    if (verifiedTracks.length >= parsed.targetTracks) break;
    if (!cand || !cand.title || !cand.artist) continue;
    if (cand.videoId && seenIds.has(cand.videoId)) continue;

    const tNorm = normalizeTrackTitle(cand.title);
    if (seenTitles.has(tNorm)) continue;

    // Artist frequency capping: max 2 per artist in a generated playlist
    const aNorm = cand.artist.toLowerCase().trim();
    const artistCount = seenArtists.get(aNorm) || 0;
    if (artistCount >= 2) continue;

    const check = await verifyPlayableTrack(cand);
    if (check.valid && check.verifiedTrack) {
      seenIds.add(check.verifiedTrack.videoId);
      seenTitles.add(tNorm);
      seenArtists.set(aNorm, artistCount + 1);
      verifiedTracks.push(check.verifiedTrack);
    }
  }

  const coverImage =
    verifiedTracks[0]?.thumbnail ||
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80";

  const totalDuration = verifiedTracks.reduce(
    (acc, t) => acc + (t.duration || 210),
    0
  );

  return {
    title: parsed.suggestedTitle,
    description: parsed.suggestedDescription,
    prompt,
    coverImage,
    tracks: verifiedTracks,
    totalDuration,
  };
}
