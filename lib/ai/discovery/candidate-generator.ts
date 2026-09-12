import { Track } from "@/types/music";
import { searchSongs } from "@/lib/ytmusic";
import { SIMILAR_ARTISTS } from "../providers/local";
import { UserTasteProfile, SearchIntent } from "../types";
import { ContextAnalysisResult, PageEntityContext } from "./types";
import { normalizeTrackTitle } from "../queue/track-verifier";

export interface GeneratedSeed {
  query: string;
  seedType:
    | "artist_affinity"
    | "similar_artist"
    | "liked_seed"
    | "genre_affinity"
    | "language_momentum"
    | "mood_vibe"
    | "temporal_vibe"
    | "discovery_novelty"
    | "page_entity"
    | "daily_mix";
  label: string;
  targetArtist?: string;
  targetGenre?: string;
  targetMood?: string;
}

export interface CandidateRawItem {
  track: Track;
  seed: GeneratedSeed;
}

// Module-level query cache to avoid repeating identical catalog searches
const queryCache = new Map<string, { tracks: Track[]; timestamp: number }>();
const QUERY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function cachedSearchSongs(query: string): Promise<Track[]> {
  const key = query.toLowerCase().trim();
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL) {
    return cached.tracks;
  }

  try {
    const tracks = await searchSongs(query);
    const validTracks = tracks.filter((t) => t && t.videoId && t.title && t.artist);
    queryCache.set(key, { tracks: validTracks, timestamp: Date.now() });
    return validTracks;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[DiscoveryCandidateGenerator] Search failed for "${query}":`, err);
    }
    return [];
  }
}

/**
 * Generates multi-seed real catalog queries customized for the current page,
 * user taste profile, and temporal/session context.
 */
export function buildCandidateSeeds(
  page: string,
  userTaste: UserTasteProfile,
  contextAnalysis: ContextAnalysisResult,
  pageEntity?: PageEntityContext,
  searchIntent?: SearchIntent,
  currentTrack?: Track
): GeneratedSeed[] {
  const seeds: GeneratedSeed[] = [];
  const topArtistObj = userTaste.topArtists[0];
  const topArtistName = topArtistObj?.name;
  const secondArtistName = userTaste.topArtists[1]?.name;

  const topGenreObj = userTaste.topGenres[0];
  const topGenre = topGenreObj?.genre || "Bollywood";

  const topLangObj = userTaste.topLanguages[0];
  const topLanguage = topLangObj?.language || "Hindi";

  // ── Page-specific seed strategy ──
  if (page === "home") {
    // 1. Top Artist Hits
    if (topArtistName) {
      seeds.push({
        query: `${topArtistName} Best Songs`,
        seedType: "artist_affinity",
        label: `Because you listen to ${topArtistName}`,
        targetArtist: topArtistName,
      });

      // Similar Artists from knowledge graph (1 high-value seed to keep Home fast)
      const lower = topArtistName.toLowerCase().trim();
      const similar = SIMILAR_ARTISTS[lower];
      if (similar && similar.length > 0) {
        seeds.push({
          query: `${similar[0]} Top Hits`,
          seedType: "similar_artist",
          label: `Fans of ${topArtistName} also like`,
          targetArtist: similar[0],
        });
      }
    }

    // 2. Second Artist or Genre Affinity
    if (secondArtistName) {
      seeds.push({
        query: `${secondArtistName} Hits`,
        seedType: "artist_affinity",
        label: `More from ${secondArtistName}`,
        targetArtist: secondArtistName,
      });
    }

    // 3. Language Momentum (e.g., Bengali, Punjabi, Hindi)
    if (contextAnalysis.recentLanguageMomentum) {
      seeds.push({
        query: `Best ${contextAnalysis.recentLanguageMomentum} Songs Hits`,
        seedType: "language_momentum",
        label: `Popular in ${contextAnalysis.recentLanguageMomentum}`,
      });
    } else if (topLanguage) {
      seeds.push({
        query: `Top ${topLanguage} Melodies`,
        seedType: "language_momentum",
        label: `Popular in ${topLanguage}`,
      });
    }

    // 4. Temporal / Session Vibe
    if (contextAnalysis.timeOfDayVibe === "late_night_calm") {
      seeds.push({
        query: "Late Night Chill Melodies Lofi",
        seedType: "temporal_vibe",
        label: "Your Late Night Vibe",
        targetMood: "Chill",
      });
    } else if (contextAnalysis.timeOfDayVibe === "energetic_morning") {
      seeds.push({
        query: "Morning Acoustic Energy Melodies",
        seedType: "temporal_vibe",
        label: "Your Morning Vibe",
        targetMood: "Energetic",
      });
    } else if (contextAnalysis.timeOfDayVibe === "relaxed_evening") {
      seeds.push({
        query: "Unwind Relaxing Acoustic Hits",
        seedType: "temporal_vibe",
        label: "Your Evening Vibe",
        targetMood: "Chill",
      });
    } else {
      seeds.push({
        query: "Focus Flow Instrumental Acoustic",
        seedType: "temporal_vibe",
        label: "Your Current Vibe",
        targetMood: "Focus",
      });
    }

    // 5. Daily Mix clusters
    seeds.push({
      query: `${topGenre} Superhits`,
      seedType: "daily_mix",
      label: `Your ${topGenre} Mix`,
      targetGenre: topGenre,
    });

    // 6. Controlled Novelty / Discovery
    seeds.push({
      query: "Fresh Indie Acoustic Discoveries",
      seedType: "discovery_novelty",
      label: "Discover Something New",
    });

    // Cold-start fallback if user has no top artist
    if (!topArtistName) {
      seeds.push({
        query: "Top Global Hits 2026",
        seedType: "discovery_novelty",
        label: "Trending Worldwide",
      });
      seeds.push({
        query: "Trending Bollywood Hits",
        seedType: "genre_affinity",
        label: "Trending Bollywood",
      });
    }
  } else if (page === "browse") {
    seeds.push({
      query: "Trending Worldwide Hits Charts",
      seedType: "discovery_novelty",
      label: "Trending For You",
    });
    if (topArtistName) {
      seeds.push({
        query: `${topArtistName} Radio`,
        seedType: "artist_affinity",
        label: "Based On Your Listening",
        targetArtist: topArtistName,
      });
    }
    if (topLanguage) {
      seeds.push({
        query: `Popular ${topLanguage} Songs Today`,
        seedType: "language_momentum",
        label: `Popular In ${topLanguage}`,
      });
    }
    seeds.push({
      query: "Late Night Lo-Fi Chill Beats",
      seedType: "temporal_vibe",
      label: "Late Night Picks",
    });
    seeds.push({
      query: "Indie Hidden Gems Melodies",
      seedType: "discovery_novelty",
      label: "Hidden Gems",
    });
  } else if (page === "genres") {
    const selectedGenreName = pageEntity?.name || "Bollywood";
    seeds.push({
      query: `${selectedGenreName} Top Hits`,
      seedType: "page_entity",
      label: `Recommended ${selectedGenreName} For You`,
      targetGenre: selectedGenreName,
    });
    if (topArtistName) {
      seeds.push({
        query: `${selectedGenreName} ${topArtistName}`,
        seedType: "artist_affinity",
        label: `Because You Like ${topArtistName}`,
        targetArtist: topArtistName,
      });
    }
    seeds.push({
      query: `${selectedGenreName} Romantic Melodies`,
      seedType: "mood_vibe",
      label: `More Romantic ${selectedGenreName}`,
      targetMood: "Romantic",
    });
    seeds.push({
      query: `${selectedGenreName} Deep Cuts Acoustic`,
      seedType: "discovery_novelty",
      label: `${selectedGenreName} Deep Cuts`,
    });
  } else if (page === "moods") {
    const moodName = pageEntity?.name || "Chill";
    seeds.push({
      query: `${moodName} Mood Songs Hits`,
      seedType: "mood_vibe",
      label: `${moodName} Flow For You`,
      targetMood: moodName,
    });
    if (topLanguage) {
      seeds.push({
        query: `${topLanguage} ${moodName} Songs`,
        seedType: "language_momentum",
        label: `${moodName} in ${topLanguage}`,
      });
    }
  } else if (page === "artist") {
    const artistName = pageEntity?.name || topArtistName || "Arijit Singh";
    seeds.push({
      query: `${artistName} Top Tracks`,
      seedType: "page_entity",
      label: `More From ${artistName}`,
      targetArtist: artistName,
    });
    const lower = artistName.toLowerCase().trim();
    const similar = SIMILAR_ARTISTS[lower];
    if (similar && similar.length > 0) {
      seeds.push({
        query: `${similar[0]} Best Songs`,
        seedType: "similar_artist",
        label: "Similar Artists",
        targetArtist: similar[0],
      });
      if (similar[1]) {
        seeds.push({
          query: `${similar[1]} Melodies`,
          seedType: "similar_artist",
          label: "Similar Artists",
          targetArtist: similar[1],
        });
      }
    }
    seeds.push({
      query: `${artistName} Deep Cuts Collaborations`,
      seedType: "discovery_novelty",
      label: "Deep Cuts & Collaborations",
      targetArtist: artistName,
    });
  } else if (page === "album") {
    const albumArtist = pageEntity?.artist || pageEntity?.name || "Various Artists";
    seeds.push({
      query: `${albumArtist} Top Hits`,
      seedType: "page_entity",
      label: `More From ${albumArtist}`,
      targetArtist: albumArtist,
    });
    const lower = albumArtist.toLowerCase().trim();
    const similar = SIMILAR_ARTISTS[lower];
    if (similar && similar.length > 0) {
      seeds.push({
        query: `${similar[0]} Hits`,
        seedType: "similar_artist",
        label: "More Like This Album",
        targetArtist: similar[0],
      });
    }
  } else if (page === "playlist") {
    const sampleTracks = pageEntity?.tracks || [];
    if (sampleTracks.length > 0) {
      const firstArtist = sampleTracks[0]?.artist;
      if (firstArtist) {
        seeds.push({
          query: `${firstArtist} Melodies`,
          seedType: "page_entity",
          label: "Continue This Playlist",
          targetArtist: firstArtist,
        });
      }
      if (sampleTracks[1]?.artist && sampleTracks[1].artist !== firstArtist) {
        seeds.push({
          query: `${sampleTracks[1].artist} Best Songs`,
          seedType: "page_entity",
          label: "More Songs For This Playlist",
          targetArtist: sampleTracks[1].artist,
        });
      }
    }
    seeds.push({
      query: `${topGenre} Playlist Hits`,
      seedType: "genre_affinity",
      label: "Similar To This Playlist",
    });
  } else if (page === "queue") {
    if (currentTrack?.artist) {
      seeds.push({
        query: `${currentTrack.artist} Top Hits`,
        seedType: "page_entity",
        label: `From ${currentTrack.artist}`,
        targetArtist: currentTrack.artist,
      });
      const lower = currentTrack.artist.toLowerCase().trim();
      const similar = SIMILAR_ARTISTS[lower];
      if (similar && similar.length > 0) {
        seeds.push({
          query: `${similar[0]} Best Songs`,
          seedType: "similar_artist",
          label: `Similar to ${currentTrack.artist}`,
          targetArtist: similar[0],
        });
      }
    }
    if (topArtistName && topArtistName !== currentTrack?.artist) {
      seeds.push({
        query: `${topArtistName} Songs`,
        seedType: "artist_affinity",
        label: `Because you love ${topArtistName}`,
        targetArtist: topArtistName,
      });
    }
    seeds.push({
      query: `${topGenre} Melodies`,
      seedType: "genre_affinity",
      label: `${topGenre} Mix`,
    });
  }

  return seeds;
}

/**
 * Concurrently queries real catalog search endpoints for each seed,
 * returning raw CandidateRawItem objects.
 */
export async function generateRawCandidates(seeds: GeneratedSeed[]): Promise<CandidateRawItem[]> {
  const results = await Promise.allSettled(
    seeds.map(async (seed) => {
      const tracks = await cachedSearchSongs(seed.query);
      return tracks.map((track) => ({ track, seed }));
    })
  );

  const rawCandidates: CandidateRawItem[] = [];
  const seenIds = new Set<string>();
  const seenCanonTitles = new Set<string>();

  for (const res of results) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      for (const item of res.value) {
        if (!item.track || !item.track.videoId) continue;
        if (seenIds.has(item.track.videoId)) continue;

        const canonTitle = normalizeTrackTitle(item.track.title);
        if (canonTitle && seenCanonTitles.has(canonTitle)) continue;

        seenIds.add(item.track.videoId);
        if (canonTitle) seenCanonTitles.add(canonTitle);
        rawCandidates.push(item);
      }
    }
  }

  return rawCandidates;
}
