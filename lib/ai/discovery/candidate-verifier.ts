import { Track } from "@/types/music";
import {
  verifyPlayableTrack,
  isValidYouTubeVideoId,
  normalizeTrackTitle,
} from "../queue/track-verifier";

export interface CandidateWithMeta<T = Record<string, unknown>> {
  track: Track;
  meta?: T;
}

export async function verifyCandidateTrack(
  candidate: Track
): Promise<{ valid: boolean; verifiedTrack?: Track; reason?: string }> {
  return await verifyPlayableTrack(candidate);
}

/**
 * Validates, resolves, and deduplicates candidates against:
 * 1. Strict playability and 11-char YouTube ID validity
 * 2. Exact videoId duplication
 * 3. Canonical track title duplication (prevents cover/remix flooding)
 */
export async function verifyAndDeduplicateCandidates<T = Record<string, unknown>>(
  rawCandidates: CandidateWithMeta<T>[],
  existingVideoIds: Set<string> = new Set(),
  existingCanonicalTitles: Set<string> = new Set()
): Promise<CandidateWithMeta<T>[]> {
  const verifiedList: CandidateWithMeta<T>[] = [];
  const seenIds = new Set<string>(existingVideoIds);
  const seenTitles = new Set<string>(existingCanonicalTitles);

  for (const item of rawCandidates) {
    const { track, meta } = item;
    if (!track || !track.title || !track.artist) continue;

    // 1. Video ID check
    if (!track.videoId || !isValidYouTubeVideoId(track.videoId)) continue;
    if (seenIds.has(track.videoId)) continue;

    // 2. Canonical title check
    const canonTitle = normalizeTrackTitle(track.title);
    if (!canonTitle || seenTitles.has(canonTitle)) continue;

    // 3. Track playability verification
    const verification = await verifyPlayableTrack(track);
    if (verification.valid && verification.verifiedTrack) {
      const vTrack = verification.verifiedTrack;
      seenIds.add(vTrack.videoId);
      seenTitles.add(canonTitle);
      verifiedList.push({ track: vTrack, meta });
    }
  }

  return verifiedList;
}
