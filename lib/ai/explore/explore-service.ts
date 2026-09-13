import { Track } from "@/types/music";
import { UserTasteProfile } from "../types";
import { searchSongs } from "@/lib/ytmusic";
import { verifyPlayableTrack, normalizeTrackTitle } from "../queue/track-verifier";

export interface SurpriseDiscoveryParams {
  profile: UserTasteProfile;
  likedSongs?: Track[];
  recentTracks?: Track[];
  skips?: string[];
  limit?: number;
}

export interface SurpriseDiscoveryResult {
  tracks: Track[];
  affinityCount: number;
  noveltyCount: number;
  vibeSummary: string;
}

export async function generateSurpriseDiscovery({
  profile,
  likedSongs = [],
  recentTracks = [],
  skips = [],
  limit = 20,
}: SurpriseDiscoveryParams): Promise<SurpriseDiscoveryResult> {
  const avoidArtistNames = new Set(
    skips
      .filter((s) => s.startsWith("artist:"))
      .map((s) => s.replace("artist:", "").toLowerCase().trim())
  );

  const familiarArtists = new Set(
    [
      ...profile.topArtists.map((a) => a.name),
      ...likedSongs.map((s) => s.artist),
      ...recentTracks.map((s) => s.artist),
    ]
      .filter(Boolean)
      .map((name) => name.toLowerCase().trim())
  );

  const topGenre = profile.topGenres[0]?.genre || "Pop";

  // 1. Affinity Candidate Seeds (50%)
  const affinityQueries: string[] = [];
  if (profile.topArtists.length > 0) {
    affinityQueries.push(`${profile.topArtists[0].name} Top Hits`);
  }
  if (profile.topArtists.length > 1) {
    affinityQueries.push(`${profile.topArtists[1].name} Best Songs`);
  }
  affinityQueries.push(`${topGenre} Essential Hits`);

  // 2. Novelty / Discovery Candidate Seeds (50%)
  const noveltyQueries: string[] = [
    `${topGenre} Emerging Artists 2026`,
    "Viral Underground Music 2026",
    "Indie Discoveries New Music",
    "Global Hidden Gems",
  ];

  // Search in parallel
  const [affinityResults, noveltyResults] = await Promise.all([
    Promise.allSettled(affinityQueries.map((q) => searchSongs(q).catch(() => []))),
    Promise.allSettled(noveltyQueries.map((q) => searchSongs(q).catch(() => []))),
  ]);

  const rawAffinity: Track[] = [];
  for (const r of affinityResults) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      rawAffinity.push(...r.value);
    }
  }

  const rawNovelty: Track[] = [];
  for (const r of noveltyResults) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      rawNovelty.push(...r.value);
    }
  }

  // Verification & Strict Anti-Fatigue (Max 1 track per artist across entire set)
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const seenArtists = new Set<string>();

  const targetHalf = Math.ceil(limit / 2);
  const verifiedAffinity: Track[] = [];
  const verifiedNovelty: Track[] = [];

  // Verify affinity
  for (const cand of rawAffinity) {
    if (verifiedAffinity.length >= targetHalf) break;
    if (!cand || !cand.title || !cand.artist) continue;
    if (cand.videoId && seenIds.has(cand.videoId)) continue;

    const aNorm = cand.artist.toLowerCase().trim();
    if (avoidArtistNames.has(aNorm) || seenArtists.has(aNorm)) continue;

    const tNorm = normalizeTrackTitle(cand.title);
    if (seenTitles.has(tNorm)) continue;

    const check = await verifyPlayableTrack(cand);
    if (check.valid && check.verifiedTrack) {
      seenIds.add(check.verifiedTrack.videoId);
      seenTitles.add(tNorm);
      seenArtists.add(aNorm);
      verifiedAffinity.push(check.verifiedTrack);
    }
  }

  // Verify novelty (prioritizing unfamiliar artists)
  for (const cand of rawNovelty) {
    if (verifiedNovelty.length >= targetHalf) break;
    if (!cand || !cand.title || !cand.artist) continue;
    if (cand.videoId && seenIds.has(cand.videoId)) continue;

    const aNorm = cand.artist.toLowerCase().trim();
    if (avoidArtistNames.has(aNorm) || seenArtists.has(aNorm)) continue;
    if (familiarArtists.has(aNorm)) continue; // Keep strictly novel

    const tNorm = normalizeTrackTitle(cand.title);
    if (seenTitles.has(tNorm)) continue;

    const check = await verifyPlayableTrack(cand);
    if (check.valid && check.verifiedTrack) {
      seenIds.add(check.verifiedTrack.videoId);
      seenTitles.add(tNorm);
      seenArtists.add(aNorm);
      verifiedNovelty.push(check.verifiedTrack);
    }
  }

  // Interleave affinity & novelty for perfect discovery flow
  const finalInterleaved: Track[] = [];
  const maxLen = Math.max(verifiedAffinity.length, verifiedNovelty.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < verifiedAffinity.length) finalInterleaved.push(verifiedAffinity[i]);
    if (i < verifiedNovelty.length) finalInterleaved.push(verifiedNovelty[i]);
    if (finalInterleaved.length >= limit) break;
  }

  return {
    tracks: finalInterleaved,
    affinityCount: verifiedAffinity.length,
    noveltyCount: verifiedNovelty.length,
    vibeSummary: `Curated ${finalInterleaved.length} tracks with 50/50 balance between your beloved favorites and fresh discoveries.`,
  };
}
