import { ScoredRecommendation, UserTasteProfile } from "../types";
import { buildUserTasteProfile, UserSignals } from "../profile/taste-profile-service";
import { getAIProvider } from "../providers";
import { searchSongs } from "@/lib/ytmusic";
import { Track } from "@/types/music";

export async function generatePersonalizedRecommendations(
  signals: UserSignals,
  limit: number = 20
): Promise<{ recommendations: ScoredRecommendation[]; tasteProfile: UserTasteProfile }> {
  const tasteProfile = buildUserTasteProfile(signals);
  const provider = getAIProvider();

  // 1. Get seed queries with personalized reasons
  const seedQueries = await provider.generateRecommendationKeywords(tasteProfile, 4);

  // 2. Concurrently fetch real tracks for each seed query
  const seedResults = await Promise.allSettled(
    seedQueries.map(async (seed) => {
      const tracks = await searchSongs(seed.query);
      return { seed, tracks };
    })
  );

  const rawCandidates: Array<{ track: Track; seedReason: string }> = [];

  for (const res of seedResults) {
    if (res.status === "fulfilled" && res.value.tracks.length > 0) {
      for (const t of res.value.tracks.slice(0, 10)) {
        rawCandidates.push({ track: t, seedReason: res.value.seed.reason });
      }
    }
  }

  // Cold-start fallback if seeds yielded no tracks
  if (rawCandidates.length === 0) {
    const fallbackTracks = await searchSongs("Top Global Hits 2026").catch(() => []);
    for (const t of fallbackTracks) {
      rawCandidates.push({ track: t, seedReason: "Popular worldwide" });
    }
  }

  // 3. Multi-signal scoring and explainability mapping
  const artistAffinityMap = new Map(tasteProfile.topArtists.map((a) => [a.name.toLowerCase(), a.weight]));
  const completedSet = new Set(tasteProfile.completedTrackIds);
  const skippedSet = new Set(tasteProfile.skippedTrackIds);
  const likedSet = new Set((signals.likedSongs || []).map((s) => s.videoId));
  const recentSet = new Set((signals.recentSongs || []).map((s) => s.videoId));
  const replaySet = new Set(tasteProfile.replayTrackIds);

  const scoredTracks: ScoredRecommendation[] = [];
  const seenVideoIds = new Set<string>();

  for (const { track, seedReason } of rawCandidates) {
    if (!track.videoId || seenVideoIds.has(track.videoId)) continue;
    seenVideoIds.add(track.videoId);

    let score = 5.0; // base score
    let reason = seedReason;

    // Signals
    const lowerArtist = (track.artist || "").toLowerCase();
    const artistAffinity = artistAffinityMap.get(lowerArtist) || 0;
    const genreAffinity = 0;
    const moodAffinity = 0;
    let noveltyScore = 0;
    let repetitionPenalty = 0;

    // 1. Artist affinity
    if (artistAffinity > 0) {
      score += Math.min(artistAffinity * 1.5, 6.0);
      reason = `Because you love ${track.artist}`;
    }

    // 2. Liked boost
    if (likedSet.has(track.videoId)) {
      score += 2.5;
      reason = "From your Liked Songs collection";
    }

    // 3. Completion / Replay boost
    if (replaySet.has(track.videoId)) {
      score += 2.0;
      reason = "A song you enjoy on repeat";
    } else if (completedSet.has(track.videoId)) {
      score += 1.2;
    }

    // 4. Skip penalty
    if (skippedSet.has(track.videoId)) {
      score -= 4.0; // heavily downrank skipped tracks
    }

    // 5. Repetition vs Novelty
    if (recentSet.has(track.videoId)) {
      repetitionPenalty = 2.0;
      score -= repetitionPenalty; // avoid playing the same song back-to-back
    } else if (artistAffinity > 0) {
      noveltyScore = 1.0;
      score += noveltyScore;
      reason = `Fresh discovery by ${track.artist}`;
    } else {
      noveltyScore = 1.5;
      score += noveltyScore;
    }

    scoredTracks.push({
      ...track,
      score: Math.round(score * 10) / 10,
      recommendationReason: reason,
      matchSignals: {
        artistAffinity: Math.round(artistAffinity * 10) / 10,
        genreAffinity,
        moodAffinity,
        noveltyScore,
        repetitionPenalty,
      },
    });
  }

  // 4. Sort descending by computed score
  scoredTracks.sort((a, b) => b.score - a.score);

  return {
    recommendations: scoredTracks.slice(0, limit),
    tasteProfile,
  };
}
