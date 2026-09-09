import { UserTasteProfile } from "../types";
import { ContextAnalysisResult, ScoredCandidate } from "./types";
import { CandidateRawItem } from "./candidate-generator";
import { generateExplanation } from "./explanations";
import { normalizeTrackTitle } from "../queue/track-verifier";

export interface RankerContext {
  userTaste: UserTasteProfile;
  contextAnalysis: ContextAnalysisResult;
  likedSongVideoIds?: Set<string>;
  recentSongVideoIds?: Set<string>;
  targetEntityArtist?: string;
}

export function rankCandidates(
  candidates: CandidateRawItem[],
  context: RankerContext
): ScoredCandidate[] {
  const {
    userTaste,
    contextAnalysis,
    likedSongVideoIds = new Set(),
    recentSongVideoIds = new Set(),
    targetEntityArtist,
  } = context;

  const artistAffinityMap = new Map(
    userTaste.topArtists.map((a) => [a.name.toLowerCase().trim(), a.weight])
  );
  const completedSet = new Set(userTaste.completedTrackIds);
  const skippedSet = new Set([...userTaste.skippedTrackIds, ...contextAnalysis.skipAversionList]);
  const replaySet = new Set(userTaste.replayTrackIds);
  const fatigueSet = new Set(contextAnalysis.artistFatigueList.map((a) => a.toLowerCase().trim()));

  const scored: ScoredCandidate[] = [];

  for (const { track, seed } of candidates) {
    if (!track || !track.videoId || !track.title || !track.artist) continue;

    let score = 5.0; // Base score
    const artistLower = track.artist.toLowerCase().trim();
    const titleLower = track.title.toLowerCase().trim();

    // 1. Artist Affinity
    const affinity = artistAffinityMap.get(artistLower) || 0;
    if (affinity > 0) {
      score += Math.min(affinity * 1.4, 5.5);
    }

    // 2. Liked Songs boost
    const isLiked = likedSongVideoIds.has(track.videoId);
    if (isLiked) {
      score += 2.5;
    }

    // 3. Replay & Completion boost
    const isReplay = replaySet.has(track.videoId);
    if (isReplay) {
      score += 2.0;
    } else if (completedSet.has(track.videoId)) {
      score += 1.2;
    }

    // 4. Skip penalty
    if (skippedSet.has(track.videoId)) {
      score -= 5.0;
    }

    // 5. Recent track repetition penalty
    if (recentSongVideoIds.has(track.videoId)) {
      score -= 3.0;
    }

    // 6. Artist Fatigue Cooldown
    if (fatigueSet.has(artistLower)) {
      score -= 2.5;
    }

    // 7. Contextual Language Momentum Boost
    let matchedLanguage: string | undefined;
    if (contextAnalysis.recentLanguageMomentum) {
      const lang = contextAnalysis.recentLanguageMomentum.toLowerCase();
      if (
        titleLower.includes(lang) ||
        (lang === "bengali" && (artistLower.includes("anupam") || artistLower.includes("fossils") || artistLower.includes("nachiketa"))) ||
        (lang === "punjabi" && (artistLower.includes("dhillon") || artistLower.includes("diljit") || artistLower.includes("aujla")))
      ) {
        score += 2.2;
        matchedLanguage = contextAnalysis.recentLanguageMomentum;
      }
    }

    // 8. Contextual Time of Day / Mood Compatibility Boost
    if (seed.seedType === "temporal_vibe") {
      score += 1.5;
    } else if (seed.seedType === "mood_vibe") {
      score += 1.3;
    }

    // 9. Target entity boost (for artist/album page)
    if (targetEntityArtist && artistLower.includes(targetEntityArtist.toLowerCase())) {
      score += 3.0;
    }

    // 10. Controlled Novelty Bonus
    const isNovelty = seed.seedType === "discovery_novelty" || (affinity === 0 && !isLiked && !isReplay);
    if (isNovelty) {
      score += 1.4;
    }

    // Explanation generation
    const reason = generateExplanation({
      matchedArtist: affinity > 0 ? track.artist : undefined,
      sourceArtist: seed.targetArtist,
      matchedGenre: seed.targetGenre,
      matchedLanguage,
      matchedMood: seed.targetMood,
      isLiked,
      isReplay,
      isDiscovery: isNovelty,
      timeOfDayVibe: seed.seedType === "temporal_vibe" ? contextAnalysis.timeOfDayVibe : undefined,
    });

    scored.push({
      track: {
        ...track,
        recommendationReason: reason,
      },
      score: Math.round(score * 10) / 10,
      reason,
      seedType: seed.seedType,
      matchedArtist: affinity > 0 ? track.artist : seed.targetArtist,
      matchedGenre: seed.targetGenre,
      matchedMood: seed.targetMood,
      isNovelty,
    });
  }

  // Sort descending by calculated score
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Interleaves candidates to balance 50% preference / 30% similarity / 20% discovery,
 * and prevents consecutive tracks by the exact same artist.
 */
export function applyDiversityFilter(
  candidates: ScoredCandidate[],
  maxPerArtist: number = 2
): ScoredCandidate[] {
  const result: ScoredCandidate[] = [];
  const artistCounts = new Map<string, number>();
  const seenCanonicalTitles = new Set<string>();

  // Split candidates into 3 buckets
  const preferenceBucket = candidates.filter(
    (c) => c.seedType === "artist_affinity" || c.seedType === "page_entity" || c.score >= 7.5
  );
  const similarityBucket = candidates.filter(
    (c) => c.seedType === "similar_artist" || c.seedType === "genre_affinity" || c.seedType === "daily_mix"
  );
  const discoveryBucket = candidates.filter(
    (c) => c.seedType === "discovery_novelty" || c.seedType === "temporal_vibe" || c.isNovelty
  );

  let pIdx = 0;
  let sIdx = 0;
  let dIdx = 0;

  const total = candidates.length;
  let lastArtist = "";

  while (result.length < total && (pIdx < preferenceBucket.length || sIdx < similarityBucket.length || dIdx < discoveryBucket.length)) {
    // Pick candidates following ~ 50% (2 items), 30% (1 item), 20% (1 item) cadence
    const nextCandidates: (ScoredCandidate | undefined)[] = [
      preferenceBucket[pIdx++],
      preferenceBucket[pIdx++],
      similarityBucket[sIdx++],
      discoveryBucket[dIdx++],
    ];

    for (const c of nextCandidates) {
      if (!c) continue;

      const artist = c.track.artist.toLowerCase().trim();
      const currentCount = artistCounts.get(artist) || 0;

      // Artist saturation limit per section
      if (currentCount >= maxPerArtist) continue;

      // Avoid consecutive tracks by the exact same artist if other choices exist
      if (artist === lastArtist && result.length > 0) {
        continue;
      }

      // Canonical title deduplication check
      const canon = normalizeTrackTitle(c.track.title);
      if (canon && seenCanonicalTitles.has(canon)) continue;

      if (canon) seenCanonicalTitles.add(canon);
      artistCounts.set(artist, currentCount + 1);
      lastArtist = artist;
      result.push(c);
    }
  }

  // Fallback: If interleaving filtered too aggressively, add remaining valid items respecting canonical deduplication and maxPerArtist
  if (result.length < 5) {
    for (const c of candidates) {
      if (result.some((r) => r.track.videoId === c.track.videoId)) continue;
      const artist = c.track.artist.toLowerCase().trim();
      const currentCount = artistCounts.get(artist) || 0;
      if (currentCount >= maxPerArtist) continue;

      const canon = normalizeTrackTitle(c.track.title);
      if (canon && seenCanonicalTitles.has(canon)) continue;

      if (canon) seenCanonicalTitles.add(canon);
      artistCounts.set(artist, currentCount + 1);
      result.push(c);
      if (result.length >= 10) break;
    }
  }

  return result;
}
