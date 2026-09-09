import { getAIProvider } from "../providers";
import { SIMILAR_ARTISTS } from "../providers/local";
import { UserTasteProfile, QueueRankingContext } from "../types";
import { searchSongs } from "@/lib/ytmusic";
import { Track } from "@/types/music";
import {
  verifyPlayableTrack,
  normalizeTrackTitle,
  isValidYouTubeVideoId,
} from "./track-verifier";

export interface SmartQueueResult {
  nextTracks: Track[];
  coherenceScore: number;
}

export async function computeAISmartQueue(
  currentTrack: Track,
  queue: Track[],
  recentVideoIds: string[],
  profile: UserTasteProfile,
  skips: string[] = []
): Promise<SmartQueueResult> {
  const provider = getAIProvider();

  // =========================================================================
  // STAGE 1: Current Track Analysis
  // =========================================================================
  const cleanTitle = normalizeTrackTitle(currentTrack.title);
  const rawArtist = (currentTrack.artist || "").trim();
  const cleanArtist = rawArtist.toLowerCase();

  const mappedSimilar = cleanArtist && SIMILAR_ARTISTS[cleanArtist]
    ? SIMILAR_ARTISTS[cleanArtist]
    : [];

  const topGenre = profile.topGenres[0]?.genre || "Popular";
  const userFavArtist = profile.topArtists.find(
    (a) => a.name.toLowerCase().trim() !== cleanArtist
  )?.name;

  // =========================================================================
  // STAGE 2: Discovery Engine Multi-Seed Real Catalog Candidates
  // =========================================================================
  const rawCandidates: Track[] = [];

  try {
    const { getDiscoveryFeed } = await import("@/lib/ai/discovery/discovery-engine");
    const discoveryFeed = await getDiscoveryFeed({
      currentPage: "queue",
      currentTrack,
      userTaste: profile,
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
      console.warn("[SmartQueue Debug] Central discovery feed failed, using direct seeds:", err);
    }
  }

  // Fallback direct seeds if discovery feed returned few items
  if (rawCandidates.length < 5) {
    const seeds: string[] = [];
    if (rawArtist) {
      seeds.push(`${rawArtist} Top Hits`);
    }
    if (mappedSimilar.length > 0) {
      seeds.push(`${mappedSimilar[0]} Best Songs`);
    }
    if (userFavArtist) {
      seeds.push(`${userFavArtist} Songs`);
    }
    seeds.push(`${topGenre} Hits`);

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
  }

  // =========================================================================
  // STAGE 3: Playability & Identity Verification
  // =========================================================================
  const verifiedCandidates: Track[] = [];
  const seenVideoIds = new Set<string>();

  for (const raw of rawCandidates) {
    if (!raw || !raw.title || !raw.artist) continue;

    // Fast-path deduplication
    if (raw.videoId && seenVideoIds.has(raw.videoId)) continue;

    const verification = await verifyPlayableTrack(raw);

    if (verification.valid && verification.verifiedTrack) {
      const vTrack = verification.verifiedTrack;
      seenVideoIds.add(vTrack.videoId);
      verifiedCandidates.push(vTrack);

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[SmartQueue Debug] Candidate: "${vTrack.title}" | Artist: "${vTrack.artist}" | VideoID: ${vTrack.videoId} | Verified: true`
        );
      }
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[SmartQueue Debug] Rejected: "${raw.title}" | Reason: ${verification.reason}`
        );
      }
    }
  }

  // =========================================================================
  // STAGE 4 & 5: AI Ranking & Diversity Sequencing
  // =========================================================================
  const context: QueueRankingContext = {
    currentTrack,
    queue,
    recentVideoIds,
    profile,
    skips,
  };

  const ranked = await provider.rankQueueCandidates(verifiedCandidates, context);

  // =========================================================================
  // STAGE 6: Final Queue Validation (Double-Check Invariant)
  // =========================================================================
  const queuedVideoIds = new Set(queue.map((t) => t.videoId));
  if (currentTrack.videoId) {
    queuedVideoIds.add(currentTrack.videoId);
  }

  const finalTracks: Track[] = [];
  const finalSeenTitles = new Set<string>();
  if (cleanTitle) {
    finalSeenTitles.add(cleanTitle);
  }

  for (const track of ranked) {
    // 1. Must have valid videoId
    if (!isValidYouTubeVideoId(track.videoId)) continue;
    // 2. Must not be in queue or currentTrack
    if (queuedVideoIds.has(track.videoId)) continue;
    // 3. Must not duplicate canonical song title
    const tCanon = normalizeTrackTitle(track.title);
    if (!tCanon || finalSeenTitles.has(tCanon)) continue;

    finalSeenTitles.add(tCanon);
    queuedVideoIds.add(track.videoId);
    finalTracks.push(track);

    if (finalTracks.length >= 6) break;
  }

  // Calculate musical coherence score (0..99)
  let coherence = 88;
  if (finalTracks.length > 0) {
    // If top recommendation shares artist or genre, boost coherence
    const sharesArtist = finalTracks.some(
      (t) => t.artist.toLowerCase().trim() === cleanArtist
    );
    const sharesSimilar = mappedSimilar.some((sm) =>
      finalTracks.some((t) => t.artist.toLowerCase().includes(sm.toLowerCase()))
    );
    if (sharesArtist) coherence += 5;
    if (sharesSimilar) coherence += 4;
  }

  return {
    nextTracks: finalTracks,
    coherenceScore: Math.min(coherence, 99),
  };
}
