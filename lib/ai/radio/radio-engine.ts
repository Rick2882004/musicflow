import { Track } from "@/types/music";
import { UserTasteProfile, QueueRankingContext } from "../types";
import { SIMILAR_ARTISTS } from "../providers/local";
import { getAIProvider } from "../providers";
import { searchSongs } from "@/lib/ytmusic";
import {
  verifyPlayableTrack,
  normalizeTrackTitle,
  isValidYouTubeVideoId,
} from "../queue/track-verifier";

export interface RadioEngineOptions {
  seedTrack: Track;
  currentTrack: Track;
  queue: Track[];
  recentVideoIds: string[];
  seenSessionTrackIds?: string[];
  skips?: string[];
  consecutiveSkips?: number;
  tracksAppendedCount?: number;
  tasteProfile: UserTasteProfile;
  limit?: number;
}

export interface RadioEngineResult {
  nextTracks: Track[];
  coherenceScore: number;
  noveltyRatio: number;
}

/**
 * Orchestrates continuous AI Radio candidate generation, playability verification,
 * progressive novelty scaling, and multi-signal adaptation.
 * Guaranteed to produce real music only (zero synthetic tracks).
 */
export async function computeAIRadioQueue(
  options: RadioEngineOptions
): Promise<RadioEngineResult> {
  const {
    seedTrack,
    currentTrack,
    queue = [],
    recentVideoIds = [],
    seenSessionTrackIds = [],
    skips = [],
    consecutiveSkips = 0,
    tracksAppendedCount = 0,
    tasteProfile,
    limit = 6,
  } = options;

  const rawCandidates: Track[] = [];
  const rawSeedArtist = (seedTrack?.artist || currentTrack?.artist || "").trim();
  const cleanSeedArtist = rawSeedArtist.toLowerCase();

  const mappedSimilar = cleanSeedArtist && SIMILAR_ARTISTS[cleanSeedArtist]
    ? SIMILAR_ARTISTS[cleanSeedArtist]
    : [];

  const topGenre = tasteProfile.topGenres[0]?.genre || "Popular";
  const userFavArtist = tasteProfile.topArtists.find(
    (a) => a.name.toLowerCase().trim() !== cleanSeedArtist
  )?.name;

  // ── 1. Calculate Progressive Novelty Ratio ──
  // Early session: 80% preference / 20% discovery
  // Mid session (> 5 tracks): 70% preference / 30% discovery
  // Long session (> 12 tracks): 60% preference / 40% discovery
  let noveltyRatio = 0.2;
  if (tracksAppendedCount > 12) {
    noveltyRatio = 0.4;
  } else if (tracksAppendedCount > 5) {
    noveltyRatio = 0.3;
  }

  // ── 2. Tap Central Discovery Engine ──
  try {
    const { getDiscoveryFeed } = await import("@/lib/ai/discovery/discovery-engine");
    const discoveryFeed = await getDiscoveryFeed({
      currentPage: "queue",
      currentTrack,
      userTaste: tasteProfile,
      recentTracks: queue,
      signals: { skips },
      limit: 15,
    });

    if (discoveryFeed.sections && discoveryFeed.sections.length > 0) {
      for (const sec of discoveryFeed.sections) {
        rawCandidates.push(...sec.tracks);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[AIRadioEngine] Central discovery feed failed, using direct catalog seeds:", err);
    }
  }

  // ── 3. Adaptive Direct Catalog Seeds ──
  const seeds: string[] = [];

  // Adapt to consecutive skips: if 2+ consecutive skips, pivot direction
  if (consecutiveSkips >= 2) {
    // Directional pivot: broaden beyond seed artist to adjacent genres or alternative favorites
    if (mappedSimilar.length > 1) {
      seeds.push(`${mappedSimilar[1]} Best Songs`);
    }
    if (userFavArtist) {
      seeds.push(`${userFavArtist} Top Hits`);
    }
    seeds.push(`${topGenre} Trending Hits`);
  } else {
    // Normal progression seeds
    if (rawSeedArtist) {
      seeds.push(`${rawSeedArtist} Songs`);
    }
    if (mappedSimilar.length > 0) {
      seeds.push(`${mappedSimilar[0]} Top Hits`);
    }
    if (userFavArtist && userFavArtist.toLowerCase().trim() !== cleanSeedArtist) {
      seeds.push(`${userFavArtist} Best Songs`);
    }
    seeds.push(`${topGenre} Hits`);

    // In longer sessions, inject controlled discovery seeds
    if (noveltyRatio >= 0.3) {
      seeds.push(`Indie ${topGenre} Melodies`);
    }
  }

  const searchPromises = seeds.map(async (seed) => {
    try {
      return await searchSongs(seed);
    } catch {
      return [];
    }
  });

  const searchResults = await Promise.allSettled(searchPromises);
  for (const res of searchResults) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      rawCandidates.push(...res.value);
    }
  }

  // ── 4. Strict Playability & Identity Verification ──
  const verifiedCandidates: Track[] = [];
  const candidateSeenIds = new Set<string>();

  for (const raw of rawCandidates) {
    if (!raw || !raw.title || !raw.artist) continue;
    if (raw.videoId && candidateSeenIds.has(raw.videoId)) continue;

    const verification = await verifyPlayableTrack(raw);
    if (verification.valid && verification.verifiedTrack) {
      const vTrack = verification.verifiedTrack;
      candidateSeenIds.add(vTrack.videoId);
      verifiedCandidates.push(vTrack);
    }
  }

  // ── 5. AI Ranking & Multi-Signal Sequencing ──
  const provider = getAIProvider();
  const context: QueueRankingContext = {
    currentTrack,
    queue,
    recentVideoIds,
    profile: tasteProfile,
    skips,
  };

  const ranked = await provider.rankQueueCandidates(verifiedCandidates, context);

  // ── 6. Final Queue & Session Deduplication Invariant ──
  const excludedVideoIds = new Set<string>([
    ...queue.map((t) => t.videoId),
    ...seenSessionTrackIds,
  ]);
  if (currentTrack.videoId) excludedVideoIds.add(currentTrack.videoId);
  if (seedTrack?.videoId) excludedVideoIds.add(seedTrack.videoId);

  const cleanCurrentTitle = normalizeTrackTitle(currentTrack.title);
  const cleanSeedTitle = seedTrack?.title ? normalizeTrackTitle(seedTrack.title) : "";
  const finalSeenTitles = new Set<string>();
  if (cleanCurrentTitle) finalSeenTitles.add(cleanCurrentTitle);
  if (cleanSeedTitle) finalSeenTitles.add(cleanSeedTitle);

  const finalTracks: Track[] = [];
  const artistCount = new Map<string, number>();

  for (const track of ranked) {
    // 1. Strict 11-char YouTube ID validity
    if (!isValidYouTubeVideoId(track.videoId)) continue;

    // 2. Must not be in active queue or previously generated in this Radio session
    if (excludedVideoIds.has(track.videoId)) continue;

    // 3. Must not duplicate canonical song title
    const tCanon = normalizeTrackTitle(track.title);
    if (!tCanon || finalSeenTitles.has(tCanon)) continue;

    // 4. Artist repetition cooldown (max 2 per artist in this batch)
    const aLower = track.artist.toLowerCase().trim();
    const count = artistCount.get(aLower) || 0;
    if (count >= 2) continue;

    finalSeenTitles.add(tCanon);
    excludedVideoIds.add(track.videoId);
    artistCount.set(aLower, count + 1);
    finalTracks.push(track);

    if (finalTracks.length >= limit) break;
  }

  // Calculate musical coherence score (0..99)
  let coherence = 88;
  if (finalTracks.length > 0) {
    const sharesSeedArtist = finalTracks.some(
      (t) => t.artist.toLowerCase().trim() === cleanSeedArtist
    );
    const sharesSimilar = mappedSimilar.some((sm) =>
      finalTracks.some((t) => t.artist.toLowerCase().includes(sm.toLowerCase()))
    );
    if (sharesSeedArtist) coherence += 5;
    if (sharesSimilar) coherence += 4;
  }

  return {
    nextTracks: finalTracks,
    coherenceScore: Math.min(coherence, 99),
    noveltyRatio,
  };
}
