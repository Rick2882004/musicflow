/**
 * Official iTunes Search API / Apple iTunes Music Catalog Integration
 * 
 * Provides:
 * - High-resolution cover artwork (600x600 and 1000x1000)
 * - Accurate track, album, and artist metadata matching
 * - Fuzzy and normalized string comparisons with Remix/Live/Acoustic safeguards
 * - Server-side LRU memory caching (24h TTL) and request deduplication
 */

export interface ResolvedTrackMetadata {
  matched: boolean;
  score: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  artworkUrl: string; // 600x600 high resolution
  highResArtworkUrl: string; // 1000x1000 ultra-high resolution
  thumbnailUrl?: string; // 100x100 original
  releaseDate?: string;
  releaseYear?: number;
  genre?: string;
  itunesTrackId?: number;
  itunesCollectionId?: number;
  previewUrl?: string;
}

export interface ResolvedAlbumMetadata {
  matched: boolean;
  score: number;
  albumName?: string;
  artistName?: string;
  artworkUrl: string; // 600x600
  highResArtworkUrl: string; // 1000x1000
  thumbnailUrl?: string; // 100x100
  releaseDate?: string;
  releaseYear?: number;
  genre?: string;
  trackCount?: number;
  copyright?: string;
  itunesCollectionId?: number;
}

// ── In-Memory Server Cache & Deduplication ──
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 3000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const trackMetadataCache = new Map<string, CacheEntry<ResolvedTrackMetadata | null>>();
const albumMetadataCache = new Map<string, CacheEntry<ResolvedAlbumMetadata | null>>();

const pendingTrackRequests = new Map<string, Promise<ResolvedTrackMetadata | null>>();
const pendingAlbumRequests = new Map<string, Promise<ResolvedAlbumMetadata | null>>();

function cleanCache<T>(cache: Map<string, CacheEntry<T>>) {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
      }
    }
    // If still too large, prune oldest entries
    if (cache.size > MAX_CACHE_ENTRIES) {
      const keysToDelete = Array.from(cache.keys()).slice(0, 500);
      for (const k of keysToDelete) cache.delete(k);
    }
  }
}

// ── Normalization & Cleaning Utilities ──
export function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics / accents
    .toLowerCase()
    .replace(/['"’`]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // Unicode-aware letters and numbers
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanTrackTitle(raw: string): string {
  if (!raw) return "";
  let s = raw;
  // Strip common YouTube fluff in brackets or parentheses
  s = s.replace(/\[(?:official|audio|video|lyric|lyrical|hd|4k|remastered|visualizer|full song|slowed|reverb|teaser|trailer|hq).*?\]/gi, "");
  s = s.replace(/\((?:official|audio|video|lyric|lyrical|hd|4k|remastered|visualizer|full song|slowed|reverb|teaser|trailer|hq).*?\)/gi, "");
  // Strip trailing | Artist or | Movie Info
  s = s.replace(/\s*\|.*$/, "");
  // Strip (From "...") or (From '...')
  s = s.replace(/\(from\s+["'][^"']+["']\)/gi, "");
  s = s.replace(/\(from\s+[^)]+\)/gi, "");
  // Strip featuring clauses inside brackets/parentheses or after feat/ft
  s = s.replace(/\((?:feat\.?|ft\.?)\s+[^)]*\)/gi, "");
  s = s.replace(/\b(?:feat\.?|ft\.?)\s+[^(\[-]*/gi, "");
  // Strip trailing " - ..." if it contains video/audio/song keywords or is excessively long
  s = s.replace(/\s+-\s+.*$/, (match) => {
    if (/video|audio|lyric|song|soundtrack|ost|teaser/i.test(match) || match.length > 25) return "";
    return match;
  });
  return s.trim();
}

export function cleanArtistName(raw: string): string {
  if (!raw) return "";
  let a = raw;
  a = a.replace(/\s*-\s*topic/gi, "");
  a = a.replace(/\s*vevo/gi, "");
  a = a.replace(/\[.*?\]/g, "");
  return a.trim();
}

export function toHighResArtwork(url100?: string, size: 600 | 1000 = 600): string {
  if (!url100) return "";
  // iTunes artwork URLs end in /100x100bb.jpg (or similar dimension tags)
  return url100.replace(/\/\d+x\d+bb\.jpg$/i, `/${size}x${size}bb.jpg`);
}

// ── Match Scoring ──
interface MatchEvaluation {
  score: number;
  titleScore: number;
  artistScore: number;
  albumBonus: number;
  rejectedReason?: string;
}

export function calculateTrackScore(
  queryTitle: string,
  queryArtist: string,
  queryAlbum: string | undefined,
  candidate: any // eslint-disable-line @typescript-eslint/no-explicit-any
): MatchEvaluation {
  const normQTitle = normalizeString(cleanTrackTitle(queryTitle));
  const normQArtist = normalizeString(cleanArtistName(queryArtist));
  const normQAlbum = queryAlbum ? normalizeString(cleanTrackTitle(queryAlbum)) : "";

  const normITitle = normalizeString(candidate.trackName || candidate.trackCensoredName || "");
  const normIArtist = normalizeString(candidate.artistName || "");
  const normIAlbum = normalizeString(candidate.collectionName || candidate.collectionCensoredName || "");

  // Guard against sensitive tag mismatches: remix, live, acoustic, instrumental, etc.
  const sensitiveTags = ["remix", "live", "acoustic", "instrumental", "piano", "cover", "karaoke", "lullaby", "tribute"];
  for (const tag of sensitiveTags) {
    const qHas = new RegExp(`\\b${tag}\\b`, "i").test(queryTitle);
    const iHas = new RegExp(`\\b${tag}\\b`, "i").test(candidate.trackName || "") ||
                 new RegExp(`\\b${tag}\\b`, "i").test(candidate.collectionName || "");
    if (qHas !== iHas) {
      return { score: 0.15, titleScore: 0, artistScore: 0, albumBonus: 0, rejectedReason: `mismatched tag: ${tag}` };
    }
  }

  // 1. Title Similarity
  let titleScore = 0;
  if (normITitle === normQTitle) {
    titleScore = 1.0;
  } else if (normITitle.startsWith(normQTitle) || normQTitle.startsWith(normITitle)) {
    titleScore = 0.92;
  } else if (normITitle.includes(normQTitle) || normQTitle.includes(normITitle)) {
    titleScore = 0.85;
  } else {
    // Word token overlap (exclude stop words)
    const stopWords = new Set(["the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "from", "with", "by"]);
    const qWords = normQTitle.split(" ").filter((w) => w.length > 1 && !stopWords.has(w));
    const iWords = normITitle.split(" ").filter((w) => w.length > 1 && !stopWords.has(w));
    if (qWords.length > 0 && iWords.length > 0) {
      const common = qWords.filter((w) => iWords.includes(w));
      const jaccard = common.length / new Set([...qWords, ...iWords]).size;
      titleScore = jaccard;
    }
  }

  // 2. Artist Similarity
  let artistScore = 0;
  if (normIArtist === normQArtist) {
    artistScore = 1.0;
  } else if (normIArtist.includes(normQArtist) || normQArtist.includes(normIArtist)) {
    artistScore = 0.90;
  } else {
    const qTokens = normQArtist.split(/[\s,&]+/).filter((w) => w.length > 2);
    const iTokens = normIArtist.split(/[\s,&]+/).filter((w) => w.length > 2);
    if (qTokens.length > 0 && iTokens.length > 0) {
      const matched = qTokens.filter((t) => iTokens.includes(t));
      artistScore = matched.length / qTokens.length >= 0.5 ? 0.80 : (matched.length / qTokens.length) * 0.7;
    }
  }

  // 3. Album bonus (if query specifies album)
  let albumBonus = 0;
  if (normQAlbum && normIAlbum) {
    if (normIAlbum === normQAlbum || normIAlbum.includes(normQAlbum) || normQAlbum.includes(normIAlbum)) {
      albumBonus = 0.1;
    }
  }

  const finalScore = Math.min(1.0, titleScore * 0.65 + artistScore * 0.35 + albumBonus);
  return { score: finalScore, titleScore, artistScore, albumBonus };
}

export function calculateAlbumScore(
  queryAlbum: string,
  queryArtist: string | undefined,
  candidate: any // eslint-disable-line @typescript-eslint/no-explicit-any
): number {
  const normQAlbum = normalizeString(cleanTrackTitle(queryAlbum));
  const normQArtist = queryArtist ? normalizeString(cleanArtistName(queryArtist)) : "";

  const normIAlbum = normalizeString(candidate.collectionName || "");
  const normIArtist = normalizeString(candidate.artistName || "");

  let albumScore = 0;
  if (normIAlbum === normQAlbum) {
    albumScore = 1.0;
  } else if (normIAlbum.startsWith(normQAlbum) || normQAlbum.startsWith(normIAlbum)) {
    albumScore = 0.90;
  } else if (normIAlbum.includes(normQAlbum) || normQAlbum.includes(normIAlbum)) {
    albumScore = 0.82;
  } else {
    const qWords = normQAlbum.split(" ").filter((w) => w.length > 1);
    const iWords = normIAlbum.split(" ").filter((w) => w.length > 1);
    const common = qWords.filter((w) => iWords.includes(w));
    albumScore = common.length / Math.max(1, qWords.length);
  }

  let artistScore = 0.5; // default if no artist provided
  if (normQArtist && normIArtist) {
    if (normIArtist === normQArtist) artistScore = 1.0;
    else if (normIArtist.includes(normQArtist) || normQArtist.includes(normIArtist)) artistScore = 0.9;
    else {
      const qTokens = normQArtist.split(/[\s,&]+/).filter((w) => w.length > 2);
      const iTokens = normIArtist.split(/[\s,&]+/).filter((w) => w.length > 2);
      const common = qTokens.filter((t) => iTokens.includes(t));
      artistScore = common.length > 0 ? 0.8 : 0.2;
    }
  }

  return normQArtist ? albumScore * 0.7 + artistScore * 0.3 : albumScore;
}

// ── iTunes Track Resolution ──
export async function resolveITunesTrack(
  title: string,
  artist: string,
  album?: string
): Promise<ResolvedTrackMetadata | null> {
  const cleanT = cleanTrackTitle(title);
  const cleanA = cleanArtistName(artist);
  if (!cleanT) return null;

  const cacheKey = `${normalizeString(cleanA)}:::${normalizeString(cleanT)}${album ? `:::${normalizeString(album)}` : ""}`;

  // 1. Check in-memory cache
  const cached = trackMetadataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Check pending in-flight request to deduplicate
  const inFlight = pendingTrackRequests.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  // 3. Perform network search
  const promise = (async (): Promise<ResolvedTrackMetadata | null> => {
    try {
      const query = `${cleanT} ${cleanA}`.trim();
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=6`;

      const response = await fetch(url, {
        next: { revalidate: 86400 }, // 24h cache in Next.js fetch cache
      });

      if (!response.ok) {
        throw new Error(`iTunes Search failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      const results: any[] = data.results || []; // eslint-disable-line @typescript-eslint/no-explicit-any

      let bestMatch: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
      let bestScore = 0;

      for (const item of results) {
        const evalResult = calculateTrackScore(title, artist, album, item);
        if (evalResult.score > bestScore) {
          bestScore = evalResult.score;
          bestMatch = item;
        }
      }

      // Confidence threshold: 0.60
      if (bestMatch && bestScore >= 0.60) {
        const rawArt = bestMatch.artworkUrl100 || "";
        const artwork600 = toHighResArtwork(rawArt, 600);
        const artwork1000 = toHighResArtwork(rawArt, 1000);

        const result: ResolvedTrackMetadata = {
          matched: true,
          score: bestScore,
          trackName: bestMatch.trackName,
          artistName: bestMatch.artistName,
          albumName: bestMatch.collectionName,
          artworkUrl: artwork600 || rawArt,
          highResArtworkUrl: artwork1000 || artwork600 || rawArt,
          thumbnailUrl: rawArt,
          releaseDate: bestMatch.releaseDate,
          releaseYear: bestMatch.releaseDate ? new Date(bestMatch.releaseDate).getFullYear() : undefined,
          genre: bestMatch.primaryGenreName,
          itunesTrackId: bestMatch.trackId,
          itunesCollectionId: bestMatch.collectionId,
          previewUrl: bestMatch.previewUrl,
        };

        trackMetadataCache.set(cacheKey, { data: result, timestamp: Date.now() });
        cleanCache(trackMetadataCache);
        return result;
      }

      // If no confident match, record null so we don't spam iTunes repeatedly
      trackMetadataCache.set(cacheKey, { data: null, timestamp: Date.now() });
      cleanCache(trackMetadataCache);
      return null;
    } catch (err) {
      console.warn("iTunes track search error:", err);
      return null;
    } finally {
      pendingTrackRequests.delete(cacheKey);
    }
  })();

  pendingTrackRequests.set(cacheKey, promise);
  return promise;
}

// ── iTunes Album Resolution ──
export async function resolveITunesAlbum(
  albumName: string,
  artistName?: string
): Promise<ResolvedAlbumMetadata | null> {
  const cleanName = cleanTrackTitle(albumName);
  const cleanA = artistName ? cleanArtistName(artistName) : "";
  if (!cleanName) return null;

  const cacheKey = `album:::${normalizeString(cleanA)}:::${normalizeString(cleanName)}`;

  const cached = albumMetadataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = pendingAlbumRequests.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async (): Promise<ResolvedAlbumMetadata | null> => {
    try {
      const query = `${cleanName} ${cleanA}`.trim();
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=5`;

      const response = await fetch(url, {
        next: { revalidate: 86400 },
      });

      if (!response.ok) {
        throw new Error(`iTunes Album Search failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      const results: any[] = data.results || []; // eslint-disable-line @typescript-eslint/no-explicit-any

      let bestMatch: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
      let bestScore = 0;

      for (const item of results) {
        const score = calculateAlbumScore(albumName, artistName, item);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = item;
        }
      }

      if (bestMatch && bestScore >= 0.55) {
        const rawArt = bestMatch.artworkUrl100 || "";
        const artwork600 = toHighResArtwork(rawArt, 600);
        const artwork1000 = toHighResArtwork(rawArt, 1000);

        const result: ResolvedAlbumMetadata = {
          matched: true,
          score: bestScore,
          albumName: bestMatch.collectionName,
          artistName: bestMatch.artistName,
          artworkUrl: artwork600 || rawArt,
          highResArtworkUrl: artwork1000 || artwork600 || rawArt,
          thumbnailUrl: rawArt,
          releaseDate: bestMatch.releaseDate,
          releaseYear: bestMatch.releaseDate ? new Date(bestMatch.releaseDate).getFullYear() : undefined,
          genre: bestMatch.primaryGenreName,
          trackCount: bestMatch.trackCount,
          copyright: bestMatch.copyright,
          itunesCollectionId: bestMatch.collectionId,
        };

        albumMetadataCache.set(cacheKey, { data: result, timestamp: Date.now() });
        cleanCache(albumMetadataCache);
        return result;
      }

      albumMetadataCache.set(cacheKey, { data: null, timestamp: Date.now() });
      cleanCache(albumMetadataCache);
      return null;
    } catch (err) {
      console.warn("iTunes album search error:", err);
      return null;
    } finally {
      pendingAlbumRequests.delete(cacheKey);
    }
  })();

  pendingAlbumRequests.set(cacheKey, promise);
  return promise;
}
