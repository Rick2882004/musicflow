import { buildUserTasteProfile } from "../profile/taste-profile-service";
import {
  DiscoveryFeedParams,
  DiscoveryFeedResult,
  DiscoverySection,
} from "./types";
import { analyzeContext } from "./context-analyzer";
import {
  buildCandidateSeeds,
  generateRawCandidates,
} from "./candidate-generator";
import { verifyAndDeduplicateCandidates } from "./candidate-verifier";
import { rankCandidates, applyDiversityFilter } from "./recommendation-ranker";
import { generatePageSections } from "./section-generator";
import { searchSongs } from "@/lib/ytmusic";

// Cache for Discovery feeds (isolated per user/guest)
interface DiscoveryCacheEntry {
  result: DiscoveryFeedResult;
  timestamp: number;
}
const discoveryCache = new Map<string, DiscoveryCacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes fresh cache

/**
 * Generates an isolated cache key that strictly distinguishes users,
 * guests, pages, and key contextual parameters.
 */
function buildCacheKey(params: DiscoveryFeedParams): string {
  const userKey = params.userId ? `user:${params.userId}` : "guest";
  const pageKey = params.currentPage;
  const entityKey = params.pageEntity?.name ? `:${params.pageEntity.name.toLowerCase().trim()}` : "";
  const currentTrackKey = params.currentTrack?.videoId ? `:${params.currentTrack.videoId}` : "";
  const hourBucket = Math.floor(new Date().getHours() / 3); // 3-hour temporal bucket
  return `${userKey}:${pageKey}${entityKey}${currentTrackKey}:h${hourBucket}`;
}

/**
 * Main Central Discovery Engine entry point.
 * Returns structured, dynamically personalized discovery sections for any MusicFlow surface.
 */
export async function getDiscoveryFeed(
  params: DiscoveryFeedParams
): Promise<DiscoveryFeedResult> {
  const cacheKey = buildCacheKey(params);
  const cached = discoveryCache.get(cacheKey);

  // Return cached feed if still fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // 1. Build or use existing UserTasteProfile
  const tasteProfile =
    params.userTaste ||
    buildUserTasteProfile(params.signals || {});

  // 2. Perform AI Context Analysis (temporal, language/mood momentum, fatigue, skips)
  const contextAnalysis = analyzeContext({
    recentTracks: params.recentTracks || params.signals?.recentSongs,
    history: params.signals?.history,
    skips: params.signals?.skips,
    currentTrack: params.currentTrack,
    timeOfDayOverride: params.context?.timeOfDay,
  });

  try {
    // 3. Generate multi-seed real catalog queries
    const seeds = buildCandidateSeeds(
      params.currentPage,
      tasteProfile,
      contextAnalysis,
      params.pageEntity,
      params.searchIntent,
      params.currentTrack
    );

    // 4. Fetch raw candidates from real music catalog (zero fake tracks)
    const rawCandidates = await generateRawCandidates(seeds);

    // 5. Verify candidates against playability & canonical deduplication
    const verifiedCandidateItems = await verifyAndDeduplicateCandidates(
      rawCandidates.map((c) => ({ track: c.track, meta: c.seed }))
    );

    // Reconstruct CandidateRawItems with verified tracks
    const verifiedRawCandidates = verifiedCandidateItems.map((v) => ({
      track: v.track,
      seed: v.meta as unknown as (typeof rawCandidates)[0]["seed"],
    }));

    // 6. Multi-signal ranking
    const likedSet = new Set((params.signals?.likedSongs || []).map((s) => s.videoId));
    const recentSet = new Set((params.recentTracks || params.signals?.recentSongs || []).map((s) => s.videoId));

    const scoredCandidates = rankCandidates(verifiedRawCandidates, {
      userTaste: tasteProfile,
      contextAnalysis,
      likedSongVideoIds: likedSet,
      recentSongVideoIds: recentSet,
      targetEntityArtist: params.pageEntity?.artist || params.pageEntity?.name,
    });

    // 7. Apply diversity filter & interleaving (50/30/20 preference, similarity, discovery)
    const diverseCandidates = applyDiversityFilter(
      scoredCandidates,
      params.currentPage === "artist" ? 6 : 2
    );

    // 8. Generate page-specific structured sections
    const sections = generatePageSections(
      params.currentPage,
      diverseCandidates,
      tasteProfile,
      contextAnalysis,
      params.pageEntity
    );

    // Calculate queue coherence score if queue page
    let coherenceScore: number | undefined;
    if (params.currentPage === "queue") {
      coherenceScore = 88;
      if (params.currentTrack?.artist && diverseCandidates.length > 0) {
        const firstArtist = diverseCandidates[0]?.track.artist.toLowerCase().trim();
        if (firstArtist === params.currentTrack.artist.toLowerCase().trim()) {
          coherenceScore += 6;
        }
      }
    }

    const feedResult: DiscoveryFeedResult = {
      sections,
      tasteProfile,
      coherenceScore,
      source: "ai",
    };

    // Store in isolated cache
    discoveryCache.set(cacheKey, {
      result: feedResult,
      timestamp: Date.now(),
    });

    return feedResult;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[DiscoveryEngine] Pipeline error, utilizing deterministic fallback:", error);
    }

    // ── Resilient Deterministic Fallback ──
    // NEVER invent fake tracks. Query genuine real catalog trending music.
    const fallbackQuery = params.pageEntity?.name
      ? `${params.pageEntity.name} Songs`
      : "Top Global Hits 2026";

    const fallbackTracks = await searchSongs(fallbackQuery).catch(() => []);
    const verifiedFallback = await verifyAndDeduplicateCandidates(
      fallbackTracks.map((t) => ({ track: t }))
    );

    const fallbackSection: DiscoverySection = {
      sectionId: `${params.currentPage}-fallback`,
      title: "Popular Hits",
      subtitle: "Charts",
      type: "trending",
      tracks: verifiedFallback.map((v) => ({
        ...v.track,
        recommendationReason: "Popular worldwide",
      })),
      reason: "Trending tracks from verified catalog",
    };

    return {
      sections: fallbackSection.tracks.length > 0 ? [fallbackSection] : [],
      tasteProfile,
      source: "heuristic_fallback",
    };
  }
}

/**
 * Invalidate cached discovery state for a specific user (e.g. on logout)
 */
export function clearUserDiscoveryCache(userId?: string) {
  if (!userId) {
    // Clear all guest caches
    for (const key of discoveryCache.keys()) {
      if (key.startsWith("guest:")) {
        discoveryCache.delete(key);
      }
    }
    return;
  }

  const prefix = `user:${userId}`;
  for (const key of discoveryCache.keys()) {
    if (key.startsWith(prefix)) {
      discoveryCache.delete(key);
    }
  }
}
