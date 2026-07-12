import { Track } from "@/types/music";

export interface ScoredTrack extends Track {
  score: number;
  recommendationReason: string;
}

export function computeHybridRecommendations(
  candidateTracks: Track[],
  likedSongs: Track[],
  recentSongs: Track[],
  skipList: string[],
  completionList: string[]
): ScoredTrack[] {
  // 1. Build artist affinity map from liked & recent songs
  const artistAffinity: Record<string, number> = {};
  
  likedSongs.forEach((song) => {
    if (song.artist) {
      artistAffinity[song.artist] = (artistAffinity[song.artist] || 0) + 1.8;
    }
  });
  
  recentSongs.forEach((song) => {
    if (song.artist) {
      artistAffinity[song.artist] = (artistAffinity[song.artist] || 0) + 1.0;
    }
  });

  // 2. Score candidate tracks
  const scored = candidateTracks.map((track) => {
    let score = 1.0; // base score
    let reason = "Discover New Sound";

    // Artist affinity boost
    const artistScore = artistAffinity[track.artist] || 0;
    if (artistScore > 0) {
      score += artistScore * 0.6;
      reason = `Inspired by ${track.artist}`;
    }

    // Skip penalty
    if (skipList.includes(track.videoId)) {
      score -= 0.9; // penalty for skipped tracks
    }

    // Completion boost
    if (completionList.includes(track.videoId)) {
      score += 0.5; // boost for tracks completed without skipping
      reason = `Highly Listened`;
    }

    // Liked status boost
    const isLiked = likedSongs.some((l) => l.videoId === track.videoId);
    if (isLiked) {
      score += 1.5;
      reason = `From your Liked Songs`;
    }

    // Freshness / Recency weight (recently played tracks shouldn't dominate)
    const isRecentlyPlayed = recentSongs.some((r) => r.videoId === track.videoId);
    if (isRecentlyPlayed) {
      score -= 0.4; // reduce score slightly to avoid repetition
    } else {
      score += 0.3; // discovery boost for fresh recommendations
    }

    return {
      ...track,
      score: Math.round(score * 10) / 10,
      recommendationReason: reason,
    } as ScoredTrack;
  });

  // Remove any duplicate tracks
  const uniqueScored: Record<string, ScoredTrack> = {};
  scored.forEach((t) => {
    if (!uniqueScored[t.videoId] || uniqueScored[t.videoId].score < t.score) {
      uniqueScored[t.videoId] = t;
    }
  });

  // Sort by highest score first
  return Object.values(uniqueScored).sort((a, b) => b.score - a.score);
}
