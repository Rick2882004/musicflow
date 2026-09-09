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
  const keywords = intent.searchKeywords.length > 0 ? intent.searchKeywords : [cleanQ];
  const primaryQuery = keywords[0];

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
      keywords[1] ? searchSongs(keywords[1]).catch(() => []) : Promise.resolve([]),
    ];

    const [songs1, artistsRes, albumsRes, songs2] = await Promise.all(promises);

    // Merge and deduplicate real song tracks
    const allSongs = deduplicateTracks([...songs1, ...songs2]);

    // Prioritized Search Result Ranking:
    // 1. Exact title match
    // 2. Exact artist match
    // 3. Exact album match
    // 4. AI intent match (artist, mood, activity, language)
    const normQ = cleanQ.toLowerCase();
    const targetArtist = intent.artist?.toLowerCase();

    allSongs.sort((a, b) => {
      const aTitle = (a.title || "").toLowerCase();
      const bTitle = (b.title || "").toLowerCase();
      const aArtist = (a.artist || "").toLowerCase();
      const bArtist = (b.artist || "").toLowerCase();

      // 1. Exact title match beats everything
      const aExactTitle = aTitle === normQ;
      const bExactTitle = bTitle === normQ;
      if (aExactTitle && !bExactTitle) return -1;
      if (!aExactTitle && bExactTitle) return 1;

      // Title starts with query
      const aStartsTitle = aTitle.startsWith(normQ);
      const bStartsTitle = bTitle.startsWith(normQ);
      if (aStartsTitle && !bStartsTitle) return -1;
      if (!aStartsTitle && bStartsTitle) return 1;

      // 2. Exact artist match
      const aExactArtist = aArtist === normQ;
      const bExactArtist = bArtist === normQ;
      if (aExactArtist && !bExactArtist) return -1;
      if (!aExactArtist && bExactArtist) return 1;

      // 3. Target artist from AI intent match
      if (targetArtist) {
        const aTarget = aArtist.includes(targetArtist);
        const bTarget = bArtist.includes(targetArtist);
        if (aTarget && !bTarget) return -1;
        if (!aTarget && bTarget) return 1;
      }

      return 0;
    });

    // Generate "More Like This" recommendations from central discovery engine
    let moreLikeThis: Track[] = [];
    if (allSongs.length > 0) {
      try {
        const { getDiscoveryFeed } = await import("@/lib/ai/discovery/discovery-engine");
        const disc = await getDiscoveryFeed({
          currentPage: "queue",
          currentTrack: allSongs[0],
          searchIntent: intent,
          limit: 6,
        });
        moreLikeThis = (disc.sections[0]?.tracks || []).filter(
          (t) => t.videoId !== allSongs[0].videoId
        ).slice(0, 6);
      } catch {
        // Non-blocking
      }
    }

    return {
      intent,
      results: allSongs,
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
