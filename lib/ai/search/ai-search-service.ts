import { getAIProvider } from "../providers";
import { SearchIntent } from "../types";
import { searchSongs } from "@/lib/ytmusic";
import { searchCanonicalArtists, searchCanonicalAlbums } from "@/lib/canonical-music";
import { Track, Album, Artist } from "@/types/music";

interface CachedSearchIntent {
  intent: SearchIntent;
  timestamp: number;
}

const intentCache = new Map<string, CachedSearchIntent>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AISearchResponse {
  intent: SearchIntent;
  results: Track[];
  artists: Artist[];
  albums: Album[];
  explanation: string;
  source: "ai" | "fallback";
  moreLikeThis?: Track[];
}

function deduplicateTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  const out: Track[] = [];
  for (const t of tracks) {
    if (t.videoId && !seen.has(t.videoId)) {
      seen.add(t.videoId);
      out.push(t);
    }
  }
  return out;
}

export async function executeAISearch(
  query: string,
  context?: { recentArtists?: string[] }
): Promise<AISearchResponse> {
  const cleanQ = query.trim();
  if (!cleanQ) {
    return {
      intent: { rawQuery: "", intent: "music_discovery", searchKeywords: [] },
      results: [],
      artists: [],
      albums: [],
      explanation: "",
      source: "fallback",
    };
  }

  const cacheKey = cleanQ.toLowerCase();
  let intent: SearchIntent;

  // Check cache
  const cached = intentCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    intent = cached.intent;
  } else {
    try {
      const provider = getAIProvider();
      intent = await provider.analyzeSearchIntent(cleanQ, context);
      intentCache.set(cacheKey, { intent, timestamp: Date.now() });
    } catch (err) {
      console.warn("AI intent parsing failed, using raw query fallback:", err);
      intent = {
        rawQuery: cleanQ,
        intent: "music_discovery",
        searchKeywords: [cleanQ],
        explanation: `Results for "${cleanQ}"`,
      };
    }
  }

  // Resolve results against real MusicFlow catalog
  // CRITICAL: The user's explicit clean query is ALWAYS the primary catalog search query
  const primaryQuery = cleanQ;
  const keywords = intent.searchKeywords.length > 0 ? intent.searchKeywords : [cleanQ];
  const secondaryQuery = keywords.find(
    (k) => k.toLowerCase() !== cleanQ.toLowerCase()
  );

  try {
    // Run targeted queries
    const promises: [
      Promise<Track[]>,
      Promise<Artist[]>,
      Promise<Album[]>,
      Promise<Track[]>
    ] = [
      searchSongs(primaryQuery).catch(() => []),
      intent.artist
        ? searchCanonicalArtists(intent.artist).catch(() => [])
        : searchCanonicalArtists(primaryQuery).catch(() => []),
      searchCanonicalAlbums(primaryQuery).catch(() => []),
      secondaryQuery ? searchSongs(secondaryQuery).catch(() => []) : Promise.resolve([]),
    ];

    const [songs1, artistsRes, albumsRes, songs2] = await Promise.all(promises);

    // Merge and deduplicate real song tracks
    const allSongs = deduplicateTracks([...songs1, ...songs2]);

    // Preserve YouTube Music's natural catalog relevance ranking while honoring exact matches
    const normQ = cleanQ.toLowerCase();
    const indexedSongs = allSongs.map((song, idx) => ({ song, originalIndex: idx }));

    indexedSongs.sort((a, b) => {
      const aTitle = (a.song.title || "").toLowerCase().trim();
      const bTitle = (b.song.title || "").toLowerCase().trim();
      const aArtist = (a.song.artist || "").toLowerCase().trim();
      const bArtist = (b.song.artist || "").toLowerCase().trim();

      const aExactTitle = aTitle === normQ;
      const bExactTitle = bTitle === normQ;

      // 1. Exact title match prioritizes over non-exact title
      if (aExactTitle && !bExactTitle) return -1;
      if (!aExactTitle && bExactTitle) return 1;

      // If both have exact title matches (e.g. "Blinding Lights"):
      // Deprioritize self-named uploaders (where artist name is the song name) over authentic artists
      if (aExactTitle && bExactTitle) {
        const aArtistIsSong = aArtist === aTitle;
        const bArtistIsSong = bArtist === bTitle;
        if (!aArtistIsSong && bArtistIsSong) return -1;
        if (aArtistIsSong && !bArtistIsSong) return 1;
        return a.originalIndex - b.originalIndex;
      }

      // 2. Exact artist match
      const aExactArtist = aArtist === normQ;
      const bExactArtist = bArtist === normQ;
      if (aExactArtist && !bExactArtist) return -1;
      if (!aExactArtist && bExactArtist) return 1;

      // 3. Fall back strictly to original catalog ranking order
      return a.originalIndex - b.originalIndex;
    });

    const rankedSongs = indexedSongs.map((item) => item.song);

    // Generate "More Like This" recommendations from central discovery engine (with safety timeout)
    let moreLikeThis: Track[] = [];
    if (rankedSongs.length > 0) {
      try {
        const { getDiscoveryFeed } = await import("@/lib/ai/discovery/discovery-engine");
        const discPromise = getDiscoveryFeed({
          currentPage: "queue",
          currentTrack: rankedSongs[0],
          searchIntent: intent,
          limit: 6,
        });
        const timeoutPromise = new Promise<{ sections: { tracks: Track[] }[] }>((resolve) =>
          setTimeout(() => resolve({ sections: [] }), 1200)
        );
        const disc = await Promise.race([discPromise, timeoutPromise]);
        moreLikeThis = (disc.sections[0]?.tracks || []).filter(
          (t) => t.videoId !== rankedSongs[0].videoId
        ).slice(0, 6);
      } catch {
        // Non-blocking
      }
    }

    return {
      intent,
      results: rankedSongs,
      artists: (artistsRes as unknown as Artist[]) || [],
      albums: (albumsRes as unknown as Album[]) || [],
      explanation: intent.explanation || `Curated results for "${cleanQ}"`,
      source: "ai",
      moreLikeThis,
    };
  } catch (error) {
    console.error("AI Search catalog resolution error:", error);
    // Ultimate fallback: direct raw search
    const fallbackSongs = await searchSongs(cleanQ).catch(() => []);
    return {
      intent,
      results: fallbackSongs,
      artists: [],
      albums: [],
      explanation: `Keyword results for "${cleanQ}"`,
      source: "fallback",
    };
  }
}
