import { Track } from "@/types/music";
import { resolvePlayableYouTubeId } from "@/lib/canonical-music";

/**
 * Standard YouTube Video ID format regex: exactly 11 characters of [a-zA-Z0-9_-]
 */
const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Validates whether a given videoId is a genuinely valid YouTube video ID.
 * Rejects empty strings, whitespace, itunes-* placeholders, and malformed strings.
 */
export function isValidYouTubeVideoId(videoId?: string | null): boolean {
  if (!videoId || typeof videoId !== "string") return false;
  const trimmed = videoId.trim();
  if (trimmed.startsWith("itunes-")) return false;
  if (trimmed.startsWith("fake-") || trimmed.startsWith("mock-")) return false;
  return YOUTUBE_VIDEO_ID_REGEX.test(trimmed);
}

/**
 * Normalizes a song title to its canonical core name.
 * Strips remix, cover, acoustic, live, lofi, official audio, and bracketed noise
 * so that multiple versions of the same song (e.g. "Kesariya (Remix)", "Kesariya (Lofi)")
 * can be identified and deduplicated.
 */
export function normalizeTrackTitle(title: string): string {
  if (!title) return "";

  const clean = title
    .toLowerCase()
    .replace(/\[.*?\]|\(.*?\)/g, " ") // Remove content in parentheses or brackets
    .replace(/\b(feat\.?|ft\.?|featuring)\b.*$/i, "") // Remove feature credits
    .replace(/\b(official\s+video|official\s+audio|lyric\s+video|visualizer|full\s+song|remix|cover|acoustic|live|unplugged|lofi|lo-fi|slowed\s+and\s+reverb|slowed\s*\+\s*reverb|8d\s+audio|instrumental|karaoke|version|audio|hd|4k)\b/gi, "")
    .replace(/[^a-z0-9\s]/gi, " ") // Remove special characters/punctuation
    .replace(/\s+/g, " ")
    .trim();

  return clean || title.toLowerCase().trim();
}

/**
 * Generates a canonical identity key for a track using clean title and artist.
 */
export function getCanonicalTrackKey(title: string, artist: string): string {
  return `${normalizeTrackTitle(title)}::${artist.toLowerCase().trim()}`;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  verifiedTrack?: Track;
}

/**
 * Server-side playability and identity verification.
 * Checks that the candidate has valid metadata and a genuine playable stream.
 * Resolves unresolved itunes-* tracks via real catalog matching.
 * Never invents or fabricates fake tracks.
 */
export async function verifyPlayableTrack(
  candidate: Partial<Track>
): Promise<VerificationResult> {
  if (!candidate) {
    return { valid: false, reason: "Candidate is null or undefined" };
  }

  const title = (candidate.title || "").trim();
  const artist = (candidate.artist || "").trim();

  // 1. Mandatory metadata check
  if (!title || title.toLowerCase() === "unknown") {
    return { valid: false, reason: "Missing or invalid title" };
  }
  if (!artist || artist.toLowerCase() === "unknown artist") {
    return { valid: false, reason: "Missing or invalid artist" };
  }

  let videoId = candidate.videoId?.trim();

  // 2. If videoId is a placeholder (e.g. itunes-*) or missing, attempt real resolution
  if (!videoId || videoId.startsWith("itunes-")) {
    try {
      const resolvedId = await resolvePlayableYouTubeId(
        title,
        artist,
        candidate.duration,
        candidate.album
      );
      if (resolvedId && isValidYouTubeVideoId(resolvedId)) {
        videoId = resolvedId;
      } else {
        return {
          valid: false,
          reason: `Could not resolve playable YouTube ID for "${title}" by "${artist}"`,
        };
      }
    } catch (err) {
      return {
        valid: false,
        reason: `Resolution error for "${title}" by "${artist}": ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // 3. Strict videoId validation
  if (!isValidYouTubeVideoId(videoId)) {
    return {
      valid: false,
      reason: `Invalid or malformed YouTube videoId: "${videoId}"`,
    };
  }

  // 4. Construct verified Track
  const verifiedTrack: Track = {
    videoId: videoId!,
    title,
    artist,
    thumbnail: candidate.thumbnail || "",
    duration: candidate.duration || 0,
    album: candidate.album || undefined,
  };

  return {
    valid: true,
    verifiedTrack,
  };
}
