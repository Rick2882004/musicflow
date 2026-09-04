/**
 * Canonical Music Catalog & Identity System
 * 
 * Provides:
 * 1. Canonical Artist Identity using Apple/iTunes Music Catalog
 * 2. Real Artist Discography: Albums, Singles, EPs, Compilations, and Top Songs with real durations and artwork
 * 3. Verified Playback Bridge: Dynamically scores and resolves iTunes catalog tracks to playable YouTube Music videoIds
 * 4. High-Resolution Imagery & Genuine Related Artists via Deezer API
 * 5. Universal Unicode and punctuation support across global regions
 * 6. Server-side caching (24h TTL) and request deduplication
 */

import {
  normalizeString,
  cleanTrackTitle,
  cleanArtistName,
  toHighResArtwork,
} from "@/lib/itunes";
import {
  searchSongs,
  searchArtists as ytSearchArtists,
  getArtistDetails as ytGetArtistDetails,
  getAlbumDetails as ytGetAlbumDetails,
} from "@/lib/ytmusic";
import { Track, Artist, Album } from "@/types/music";

export interface CanonicalArtistSummary {
  artistId: string;
  browseId?: string;
  name: string;
  genre?: string;
  image: string;
  source: "itunes" | "ytmusic";
}

// ── In-Memory Caches & Deduplication ──
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const VIDEO_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const artistSummarySearchCache = new Map<string, CacheEntry<CanonicalArtistSummary[]>>();
const artistDetailCache = new Map<string, CacheEntry<Artist | null>>();
const albumDetailCache = new Map<string, CacheEntry<Album | null>>();
const videoIdCache = new Map<string, CacheEntry<string>>();

const pendingArtistSearches = new Map<string, Promise<CanonicalArtistSummary[]>>();
const pendingArtistLookups = new Map<string, Promise<Artist | null>>();
const pendingAlbumLookups = new Map<string, Promise<Album | null>>();
const pendingVideoResolutions = new Map<string, Promise<string>>();

// ── Playback Bridge: Resolve YouTube Music videoId with Candidate Scoring ──
export async function resolvePlayableYouTubeId(
  trackTitle: string,
  artistName: string,
  expectedDurationSec?: number,
  albumName?: string
): Promise<string> {
  const cleanT = cleanTrackTitle(trackTitle);
  const cleanA = cleanArtistName(artistName);
  if (!cleanT) return "";

  const normT = normalizeString(cleanT);
  const normA = normalizeString(cleanA);
  const cacheKey = `video:${normA}:::${normT}${expectedDurationSec ? `:::${expectedDurationSec}` : ""}`;

  const cached = videoIdCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < VIDEO_CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = pendingVideoResolutions.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async (): Promise<string> => {
    try {
      const query = `${cleanT} ${cleanA}`.trim();
      const candidates = await searchSongs(query);
      if (candidates && candidates.length > 0) {
        let bestCandidate: { videoId: string; score: number } | null = null;

        for (const c of candidates) {
          if (!c.videoId) continue;
          const cleanCTitle = cleanTrackTitle(c.title || "");
          const normCTitle = normalizeString(cleanCTitle);
          const normCArtist = normalizeString(c.artist || "");

          let score = 0;

          // 1. Title matching
          if (normCTitle === normT) {
            score += 100;
          } else if (normCTitle.startsWith(normT) || normT.startsWith(normCTitle)) {
            score += 80;
          } else if (normCTitle.includes(normT) || normT.includes(normCTitle)) {
            score += 65;
          } else {
            const qWords = normT.split(" ").filter((w) => w.length > 1);
            const cWords = normCTitle.split(" ").filter((w) => w.length > 1);
            const common = qWords.filter((w) => cWords.includes(w));
            if (common.length > 0) {
              score += Math.round((common.length / Math.max(qWords.length, 1)) * 50);
            }
          }

          // 2. Artist matching
          if (normCArtist.includes(normA) || normA.includes(normCArtist)) {
            score += 30;
          }

          // 2b. Album bonus if available
          if (albumName && c.album) {
            const normCAlbum = normalizeString(c.album);
            const normAlbum = normalizeString(albumName);
            if (normCAlbum === normAlbum || normCAlbum.includes(normAlbum) || normAlbum.includes(normCAlbum)) {
              score += 15;
            }
          }

          // 3. Duration match (within reasonable bounds)
          if (expectedDurationSec && expectedDurationSec > 0 && c.duration && c.duration > 0) {
            const diff = Math.abs(c.duration - expectedDurationSec);
            if (diff <= 5) score += 25;
            else if (diff <= 15) score += 15;
            else if (diff <= 30) score += 5;
            else if (diff > 60) score -= 40;
            if (diff > 120) score -= 80; // Heavy penalty for full albums, loops, or wrong tracks
          }

          // 4. Penalize unwanted keywords if the original title didn't specify them
          const lowCTitle = (c.title || "").toLowerCase();
          const badKeywords = ["cover", "karaoke", "reaction", "remix", "tribute", "parody", "hour loop", "slowed", "reverb"];
          for (const kw of badKeywords) {
            if (lowCTitle.includes(kw) && !cleanT.toLowerCase().includes(kw)) {
              score -= 40;
            }
          }

          if (!bestCandidate || score > bestCandidate.score) {
            bestCandidate = { videoId: c.videoId, score };
          }
        }

        if (bestCandidate && bestCandidate.score >= 45) {
          videoIdCache.set(cacheKey, { data: bestCandidate.videoId, timestamp: Date.now() });
          return bestCandidate.videoId;
        }

        // Fallback: check if the first candidate partially matches title
        if (candidates[0]?.videoId) {
          const firstNorm = normalizeString(cleanTrackTitle(candidates[0].title || ""));
          if (firstNorm.includes(normT) || normT.includes(firstNorm)) {
            videoIdCache.set(cacheKey, { data: candidates[0].videoId, timestamp: Date.now() });
            return candidates[0].videoId;
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to resolve playable videoId for "${trackTitle}" by "${artistName}":`, err);
    }
    return "";
  })();

  pendingVideoResolutions.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    pendingVideoResolutions.delete(cacheKey);
  }
}

// ── Deezer High-Res Portrait & Related Artists (Generic Fallback) ──
async function fetchDeezerArtistInfo(artistName: string): Promise<{ image: string; deezerId?: number; related: { artistId: string; name: string; thumbnails: { url: string }[] }[] }> {
  const cleanA = cleanArtistName(artistName);
  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(cleanA)}&limit=1`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return { image: "", related: [] };
    const data = await res.json();
    const match = data.data?.[0];
    if (!match) return { image: "", related: [] };

    const image = match.picture_big || match.picture_medium || match.picture || "";
    const deezerId = match.id;

    let related: { artistId: string; name: string; thumbnails: { url: string }[] }[] = [];
    if (deezerId) {
      try {
        const relRes = await fetch(`https://api.deezer.com/artist/${deezerId}/related`, {
          next: { revalidate: 86400 },
        });
        if (relRes.ok) {
          const relData = await relRes.json();
          const list = relData.data || [];
          const normA = normalizeString(cleanA);
          related = list
            .filter((r: { name: string }) => normalizeString(r.name) !== normA)
            .slice(0, 8)
            .map((r: { id: number; name: string; picture_medium?: string; picture?: string }) => ({
              artistId: String(r.id),
              name: r.name,
              thumbnails: [{ url: r.picture_medium || r.picture || "" }],
            }));
        }
      } catch {
        // continue without related
      }
    }

    return { image, deezerId, related };
  } catch {
    return { image: "", related: [] };
  }
}

// ── Canonical Artist Search (Generic Worldwide) ──
export async function searchCanonicalArtists(query: string): Promise<CanonicalArtistSummary[]> {
  const cleanQ = cleanArtistName(query);
  if (!cleanQ) return [];

  const cacheKey = `search-artists:${normalizeString(cleanQ)}`;
  const cached = artistSummarySearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = pendingArtistSearches.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async (): Promise<CanonicalArtistSummary[]> => {
    try {
      // 1. Search Apple/iTunes Music Catalog
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQ)}&entity=musicArtist&limit=15`;
      const itunesRes = await fetch(itunesUrl, { next: { revalidate: 86400 } });

      let itunesArtists: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        itunesArtists = itunesData.results || [];
      }

      // Generic punctuation/symbol variation: if query contains punctuation, also query alphanumeric version
      const altTerm = cleanQ.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
      if (altTerm && altTerm !== cleanQ && itunesArtists.length < 5) {
        try {
          const altRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(altTerm)}&entity=musicArtist&limit=10`, {
            next: { revalidate: 86400 },
          });
          if (altRes.ok) {
            const altData = await altRes.json();
            itunesArtists = [...itunesArtists, ...(altData.results || [])];
          }
        } catch {
          // continue with initial results
        }
      }

      const normQ = normalizeString(cleanQ);
      const compactNormQ = normQ.replace(/\s+/g, "");

      if (itunesArtists.length > 0) {
        // Score candidates against search query generically
        const scored = itunesArtists.map((a: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const normName = normalizeString(a.artistName || "");
          const compactNormName = normName.replace(/\s+/g, "");
          let score = 0;

          if (normName === normQ) score = 1.0;
          else if (compactNormName && compactNormName === compactNormQ) score = 0.98;
          else if (normName.startsWith(normQ) || normQ.startsWith(normName)) score = 0.90;
          else if (compactNormName && (compactNormName.startsWith(compactNormQ) || compactNormQ.startsWith(compactNormName))) score = 0.88;
          else if (normName.includes(normQ) || normQ.includes(normName)) score = 0.80;
          else {
            const qWords = normQ.split(" ").filter((w: string) => w.length > 1);
            const aWords = normName.split(" ").filter((w: string) => w.length > 1);
            const common = qWords.filter((w: string) => aWords.includes(w));
            score = common.length / Math.max(1, qWords.length);
          }

          // Canonical artist markers from catalog metadata
          if (a.amgArtistId) score += 0.05;
          if (a.artistType === "Artist") score += 0.03;
          if (a.primaryGenreName) score += 0.02;

          return { item: a, score };
        }).filter((s) => s.score >= 0.35);

        // Sort by match score descending
        scored.sort((a, b) => b.score - a.score);

        // Deduplicate strictly by stable artistId (preserving distinct same-name artists)
        const seenArtistIds = new Set<string>();
        const uniqueScored = scored.filter(({ item }) => {
          const id = String(item.artistId);
          if (seenArtistIds.has(id)) return false;
          seenArtistIds.add(id);
          return true;
        });

        // Resolve images concurrently for top candidates (limit 6)
        const topCandidates = uniqueScored.slice(0, 6);
        const results: CanonicalArtistSummary[] = await Promise.all(
          topCandidates.map(async ({ item }) => {
            const artistId = String(item.artistId);
            const name = item.artistName;
            const genre = item.primaryGenreName;

            const deezerInfo = await fetchDeezerArtistInfo(name);
            let image = deezerInfo.image;

            // Fallback image: lookup 1 album to get high-res album cover
            if (!image) {
              try {
                const albRes = await fetch(`https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=1`, {
                  next: { revalidate: 86400 },
                });
                if (albRes.ok) {
                  const albData = await albRes.json();
                  const firstAlb = albData.results?.[1];
                  if (firstAlb?.artworkUrl100) {
                    image = toHighResArtwork(firstAlb.artworkUrl100, 600);
                  }
                }
              } catch {
                // ignore
              }
            }

            return {
              artistId,
              name,
              genre,
              image: image || "/logo.png",
              source: "itunes" as const,
            };
          })
        );

        if (results.length > 0) {
          artistSummarySearchCache.set(cacheKey, { data: results, timestamp: Date.now() });
          return results;
        }
      }

      // ── 2. Fallback: YouTube Music Artist Search ──
      const ytArtists = await ytSearchArtists(cleanQ);
      const seenYtIds = new Set<string>();
      const results: CanonicalArtistSummary[] = [];

      for (const y of ytArtists) {
        const id = y.artistId;
        if (!id || seenYtIds.has(id)) continue;
        seenYtIds.add(id);

        const cleanName = cleanArtistName(y.name);
        results.push({
          artistId: id,
          browseId: id,
          name: cleanName,
          image: y.thumbnail || "",
          source: "ytmusic" as const,
        });

        if (results.length >= 6) break;
      }

      artistSummarySearchCache.set(cacheKey, { data: results, timestamp: Date.now() });
      return results;
    } catch (err) {
      console.error("Canonical artist search error:", err);
      return [];
    } finally {
      pendingArtistSearches.delete(cacheKey);
    }
  })();

  pendingArtistSearches.set(cacheKey, promise);
  return promise;
}

// ── Canonical Artist Details Lookup (Generic Worldwide) ──
export async function getCanonicalArtistDetails(params: { artistId?: string; name?: string }): Promise<Artist | null> {
  const cleanN = params.name ? cleanArtistName(params.name) : "";
  const cacheKey = params.artistId
    ? `artist:${params.artistId}`
    : `artist-name:${normalizeString(cleanN)}`;

  const cached = artistDetailCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = pendingArtistLookups.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async (): Promise<Artist | null> => {
    try {
      let canonicalId = params.artistId;
      let artistName = cleanN;
      let primaryGenre: string | undefined;

      // If artistId is not a numeric iTunes ID, resolve canonical artist by name
      const isNumericId = canonicalId && /^\d+$/.test(canonicalId);

      if (!isNumericId) {
        if (!cleanN) return null;
        const candidates = await searchCanonicalArtists(cleanN);
        if (candidates.length > 0) {
          canonicalId = candidates[0].artistId;
          artistName = candidates[0].name;
          primaryGenre = candidates[0].genre;
        }
      }

      // ── 1. If we have a canonical iTunes artistId ──
      if (canonicalId && /^\d+$/.test(canonicalId)) {
        const [albumLookupRes, songLookupRes, deezerInfo] = await Promise.all([
          fetch(`https://itunes.apple.com/lookup?id=${canonicalId}&entity=album&limit=100`, {
            next: { revalidate: 86400 },
          }).then((r) => (r.ok ? r.json() : { results: [] })).catch(() => ({ results: [] })),
          fetch(`https://itunes.apple.com/lookup?id=${canonicalId}&entity=song&limit=50`, {
            next: { revalidate: 86400 },
          }).then((r) => (r.ok ? r.json() : { results: [] })).catch(() => ({ results: [] })),
          fetchDeezerArtistInfo(artistName),
        ]);

        const albumResults: any[] = albumLookupRes.results || []; // eslint-disable-line @typescript-eslint/no-explicit-any
        const songResults: any[] = songLookupRes.results || []; // eslint-disable-line @typescript-eslint/no-explicit-any

        // Extract canonical artist info from result[0]
        const artistMeta = albumResults[0] || songResults[0];
        if (artistMeta?.artistName) {
          artistName = artistMeta.artistName;
        }
        if (artistMeta?.primaryGenreName) {
          primaryGenre = artistMeta.primaryGenreName;
        }

        // ── Process Albums, Singles, and Compilations with Dynamic Classification ──
        const rawAlbums = albumResults.slice(1);
        const seenAlbumIds = new Set<string>();
        const albums: Album[] = [];
        const singles: Album[] = [];
        const compilations: Album[] = [];

        for (const col of rawAlbums) {
          if (!col.collectionId || seenAlbumIds.has(String(col.collectionId))) continue;
          seenAlbumIds.add(String(col.collectionId));

          const colArtist = col.artistName || "";
          const colTitle = col.collectionName || col.collectionCensoredName || "Album";
          const isPrimary = String(col.artistId) === String(canonicalId);
          const normColArtist = normalizeString(colArtist);
          const normMainArtist = normalizeString(artistName);

          // Verify genuine association with artist
          const isAssociated = isPrimary ||
            normColArtist.includes(normMainArtist) ||
            normMainArtist.includes(normColArtist) ||
            colTitle.toLowerCase().includes(artistName.toLowerCase());

          // Filter out unrelated compilations / automated multi-artist DJ mixes
          const isVariousArtists = normColArtist.includes("various artists") || colArtist.split(",").length > 5;
          if (!isAssociated && isVariousArtists) {
            continue;
          }

          const artwork = toHighResArtwork(col.artworkUrl100, 600) || col.artworkUrl100 || "";
          const releaseYear = col.releaseDate ? new Date(col.releaseDate).getFullYear() : undefined;
          const lowTitle = colTitle.toLowerCase();

          const isSingle = col.collectionType === "Single" || (col.trackCount && col.trackCount <= 3) || lowTitle.endsWith(" - single");
          const isEP = (col.trackCount && col.trackCount >= 4 && col.trackCount <= 6) || lowTitle.endsWith(" - ep");
          const isCompilation = isVariousArtists || col.collectionType === "Compilation" || lowTitle.includes("greatest hits") || lowTitle.includes("best of") || lowTitle.includes("the essential") || lowTitle.includes("anthology");

          const item: Album = {
            albumId: String(col.collectionId),
            name: colTitle,
            artist: {
              name: col.artistName || artistName,
              artistId: String(canonicalId),
            },
            year: releaseYear,
            trackCount: col.trackCount,
            thumbnail: artwork,
            thumbnails: artwork ? [{ url: artwork }] : [],
            genre: col.primaryGenreName,
            copyright: col.copyright,
          };

          if (isSingle || isEP) {
            singles.push(item);
          } else if (isCompilation) {
            compilations.push(item);
          } else {
            albums.push(item);
          }
        }

        // ── Process Songs with Ownership & Association Verification ──
        const rawSongs = songResults.slice(1);
        const seenSongTitles = new Set<string>();
        const candidateSongs: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

        for (const s of rawSongs) {
          const cleanT = cleanTrackTitle(s.trackName || "");
          const normT = normalizeString(cleanT);
          if (!cleanT || seenSongTitles.has(normT)) continue;

          const lowT = (s.trackName || "").toLowerCase();
          const lowA = (s.artistName || "").toLowerCase();

          // Reject tribute band covers, karaoke, soundalikes, parody
          if (/tribute|karaoke|made popular by|in the style of|instrumental cover|sound-a-like|tribute band/i.test(lowT) ||
              /tribute|karaoke|tribute band|sound-a-like/i.test(lowA)) {
            continue;
          }

          // Ensure genuine association with artist
          const isPrimary = String(s.artistId) === String(canonicalId);
          const normSongArtist = normalizeString(s.artistName || "");
          const normMainArtist = normalizeString(artistName);
          const nameMatches = normSongArtist.includes(normMainArtist) || normMainArtist.includes(normSongArtist);
          const isFeatured = lowT.includes(artistName.toLowerCase());

          if (!isPrimary && !nameMatches && !isFeatured) continue;

          seenSongTitles.add(normT);
          candidateSongs.push(s);
          if (candidateSongs.length >= 25) break;
        }

        // Concurrently resolve playable YouTube videoIds for top songs with duration matching
        const songs: Track[] = await Promise.all(
          candidateSongs.map(async (s) => {
            const cleanT = cleanTrackTitle(s.trackName || "");
            const songArtist = s.artistName || artistName;
            const artwork = toHighResArtwork(s.artworkUrl100, 600) || s.artworkUrl100 || "";
            const durationSec = s.trackTimeMillis ? Math.round(s.trackTimeMillis / 1000) : undefined;

            const videoId = await resolvePlayableYouTubeId(cleanT, songArtist, durationSec, s.collectionName);

            return {
              videoId: videoId || `itunes-${s.trackId}`,
              title: cleanT,
              artist: songArtist,
              album: s.collectionName,
              albumId: String(s.collectionId),
              duration: durationSec || 0,
              thumbnail: artwork,
            };
          })
        );

        const artistPortrait = deezerInfo.image || albums[0]?.thumbnail || singles[0]?.thumbnail || "";

        const artistRecord: Artist = {
          id: String(canonicalId),
          artistId: String(canonicalId),
          name: artistName,
          genre: primaryGenre || "Artist",
          source: "itunes",
          image: artistPortrait,
          thumbnails: artistPortrait ? [{ url: artistPortrait }] : [],
          songs,
          albums,
          singles,
          compilations: compilations.length > 0 ? compilations : undefined,
          similarArtists: deezerInfo.related,
        };

        artistDetailCache.set(cacheKey, { data: artistRecord, timestamp: Date.now() });
        // Also cache by canonical ID
        artistDetailCache.set(`artist:${canonicalId}`, { data: artistRecord, timestamp: Date.now() });
        if (cleanN) {
          artistDetailCache.set(`artist-name:${normalizeString(cleanN)}`, { data: artistRecord, timestamp: Date.now() });
        }
        return artistRecord;
      }

      // ── 2. Fallback: YouTube Music details ──
      const ytId = canonicalId || params.artistId;
      if (ytId) {
        const ytDetails = await ytGetArtistDetails(ytId);
        if (ytDetails) {
          const deezerInfo = await fetchDeezerArtistInfo(ytDetails.name);
          const artistRecord: Artist = {
            id: ytDetails.artistId,
            artistId: ytDetails.artistId,
            browseId: ytDetails.artistId,
            name: ytDetails.name,
            source: "ytmusic",
            image: deezerInfo.image || ytDetails.thumbnails?.[ytDetails.thumbnails.length - 1]?.url || "",
            thumbnails: ytDetails.thumbnails,
            songs: ytDetails.songs,
            albums: ytDetails.albums,
            singles: ytDetails.singles,
            similarArtists: deezerInfo.related.length > 0 ? deezerInfo.related : ytDetails.similarArtists,
          };
          artistDetailCache.set(cacheKey, { data: artistRecord, timestamp: Date.now() });
          return artistRecord;
        }
      }

      return null;
    } catch (err) {
      console.error("Canonical artist detail error:", err);
      return null;
    } finally {
      pendingArtistLookups.delete(cacheKey);
    }
  })();

  pendingArtistLookups.set(cacheKey, promise);
  return promise;
}

// ── Canonical Album Details Lookup (Generic Worldwide) ──
export async function getCanonicalAlbumDetails(albumId: string): Promise<Album | null> {
  const cleanId = albumId.replace(/^itunes-/, "").trim();
  const isNumeric = /^\d+$/.test(cleanId);

  const cacheKey = `album:${cleanId}`;
  const cached = albumDetailCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = pendingAlbumLookups.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async (): Promise<Album | null> => {
    try {
      // ── 1. iTunes Canonical Album Lookup ──
      if (isNumeric) {
        const lookupUrl = `https://itunes.apple.com/lookup?id=${cleanId}&entity=song`;
        const res = await fetch(lookupUrl, { next: { revalidate: 86400 } });
        if (!res.ok) throw new Error(`iTunes lookup failed: ${res.status}`);

        const data = await res.json();
        const results: any[] = data.results || []; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (results.length === 0) return null;

        const albumMeta = results[0];
        const rawTracks = results.slice(1);

        const artwork = toHighResArtwork(albumMeta.artworkUrl100, 1000) || albumMeta.artworkUrl100 || "";
        const releaseYear = albumMeta.releaseDate ? new Date(albumMeta.releaseDate).getFullYear() : undefined;

        // Concurrently resolve playable videoIds for album tracks with duration
        const songs: Track[] = await Promise.all(
          rawTracks.map(async (t) => {
            const cleanT = cleanTrackTitle(t.trackName || "");
            const artistName = t.artistName || albumMeta.artistName || "Unknown Artist";
            const durationSec = t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : undefined;
            const trackArt = toHighResArtwork(t.artworkUrl100 || albumMeta.artworkUrl100, 600);

            const videoId = await resolvePlayableYouTubeId(cleanT, artistName, durationSec, albumMeta.collectionName);

            return {
              videoId: videoId || `itunes-${t.trackId}`,
              title: cleanT,
              artist: artistName,
              album: albumMeta.collectionName,
              albumId: String(cleanId),
              duration: durationSec || 0,
              thumbnail: trackArt || artwork,
            };
          })
        );

        const albumRecord: Album = {
          albumId: String(cleanId),
          name: albumMeta.collectionName || "Album",
          artist: {
            name: albumMeta.artistName || "Unknown Artist",
            artistId: albumMeta.artistId ? String(albumMeta.artistId) : null,
          },
          year: releaseYear,
          trackCount: albumMeta.trackCount || songs.length,
          thumbnail: artwork,
          thumbnails: artwork ? [{ url: artwork }] : [],
          songs,
          genre: albumMeta.primaryGenreName,
          copyright: albumMeta.copyright,
        };

        albumDetailCache.set(cacheKey, { data: albumRecord, timestamp: Date.now() });
        return albumRecord;
      }

      // ── 2. Fallback: YouTube Music Album Lookup ──
      const ytAlbum = await ytGetAlbumDetails(cleanId);
      if (ytAlbum) {
        albumDetailCache.set(cacheKey, { data: ytAlbum, timestamp: Date.now() });
        return ytAlbum;
      }

      return null;
    } catch (err) {
      console.error("Canonical album detail error:", err);
      return null;
    } finally {
      pendingAlbumLookups.delete(cacheKey);
    }
  })();

  pendingAlbumLookups.set(cacheKey, promise);
  return promise;
}
