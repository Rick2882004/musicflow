"use client";

/**
 * Centralized Music Metadata & High-Resolution Artwork Resolver
 * 
 * Features:
 * - Single source of truth for resolved iTunes album artwork and metadata across all pages
 * - In-memory synchronous cache for instantaneous zero-latency lookups
 * - Persistent localStorage cache (with TTL and size cap)
 * - Strict in-flight request deduplication
 * - Pub/Sub subscription bus for instant cross-component updates
 * - Concurrency-limited background batch resolution
 */

export interface ResolvedMusicMetadata {
  matched: boolean;
  score?: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  artworkUrl: string; // 600x600 high resolution
  highResArtworkUrl?: string; // 1000x1000
  thumbnailUrl?: string; // 100x100
  releaseDate?: string;
  releaseYear?: number;
  genre?: string;
  itunesTrackId?: number;
  itunesCollectionId?: number;
  timestamp: number;
}

const STORAGE_KEY = "mf_itunes_artwork_cache_v2";
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_LOCAL_ENTRIES = 500;

// In-memory singletons
const memoryCache = new Map<string, ResolvedMusicMetadata>();
const videoIdIndex = new Map<string, string>(); // videoId -> normalizedKey
const inFlightRequests = new Map<string, Promise<ResolvedMusicMetadata | null>>();

type Listener = (key: string, data: ResolvedMusicMetadata) => void;
const subscribers = new Set<Listener>();

// ── Key Normalization ──
export function normalizeResolverKey(title: string, artist: string): string {
  const normTitle = (title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\[(?:official|audio|video|lyric|lyrical|hd|4k|remastered|visualizer|full song).*?\]/gi, "")
    .replace(/\((?:official|audio|video|lyric|lyrical|hd|4k|remastered|visualizer|full song).*?\)/gi, "")
    .replace(/\s*\|.*$/, "")
    .replace(/\(from\s+["'][^"']+["']\)/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normArtist = (artist || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s*-\s*topic/gi, "")
    .replace(/\s*vevo/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `${normArtist}:::${normTitle}`;
}

// ── Persistent Storage Helpers ──
let hasInitializedStorage = false;

function initStorage() {
  if (hasInitializedStorage || typeof window === "undefined") return;
  hasInitializedStorage = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: Record<string, ResolvedMusicMetadata> = JSON.parse(raw);
      const now = Date.now();
      for (const [key, item] of Object.entries(parsed)) {
        if (now - item.timestamp < STORAGE_TTL_MS) {
          memoryCache.set(key, item);
        }
      }
    }
  } catch (err) {
    console.warn("Could not read local artwork cache:", err);
  }
}

function saveToLocalStorage(key: string, data: ResolvedMusicMetadata) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: Record<string, ResolvedMusicMetadata> = raw ? JSON.parse(raw) : {};
    parsed[key] = data;

    // Prune if over limit
    const keys = Object.keys(parsed);
    if (keys.length > MAX_LOCAL_ENTRIES) {
      const sortedKeys = keys.sort((a, b) => parsed[a].timestamp - parsed[b].timestamp);
      for (let i = 0; i < 50; i++) {
        delete parsed[sortedKeys[i]];
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore quota errors
  }
}

// ── Synchronous Cache Retrieval ──
export function getCachedArtwork(title: string, artist: string, videoId?: string): string | null {
  initStorage();

  if (videoId && videoIdIndex.has(videoId)) {
    const key = videoIdIndex.get(videoId)!;
    const entry = memoryCache.get(key);
    if (entry && entry.artworkUrl) return entry.artworkUrl;
  }

  const key = normalizeResolverKey(title, artist);
  const entry = memoryCache.get(key);
  if (entry && entry.artworkUrl) {
    if (videoId) videoIdIndex.set(videoId, key);
    return entry.artworkUrl;
  }

  return null;
}

export function getCachedMetadata(title: string, artist: string, videoId?: string): ResolvedMusicMetadata | null {
  initStorage();

  if (videoId && videoIdIndex.has(videoId)) {
    const key = videoIdIndex.get(videoId)!;
    return memoryCache.get(key) || null;
  }

  const key = normalizeResolverKey(title, artist);
  const entry = memoryCache.get(key);
  if (entry && videoId) {
    videoIdIndex.set(videoId, key);
  }
  return entry || null;
}

// ── Core Async Track Resolver ──
export async function resolveTrackMetadata({
  title,
  artist,
  album,
  videoId,
  thumbnail,
}: {
  title: string;
  artist: string;
  album?: string;
  videoId?: string;
  thumbnail?: string;
}): Promise<ResolvedMusicMetadata | null> {
  initStorage();

  if (!title) return null;
  const key = normalizeResolverKey(title, artist);
  if (videoId) videoIdIndex.set(videoId, key);

  // 1. Check memory cache
  const cached = memoryCache.get(key);
  if (cached) {
    return cached;
  }

  // 2. Check in-flight request deduplication
  const inFlight = inFlightRequests.get(key);
  if (inFlight) {
    return inFlight;
  }

  // 3. Request from /api/artwork
  const promise = (async (): Promise<ResolvedMusicMetadata | null> => {
    try {
      const params = new URLSearchParams({
        type: "song",
        title,
        artist,
      });
      if (album) params.set("album", album);
      if (videoId) params.set("videoId", videoId);

      const res = await fetch(`/api/artwork?${params.toString()}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (data && data.matched && data.artworkUrl) {
        const metadata: ResolvedMusicMetadata = {
          matched: true,
          score: data.score,
          trackName: data.trackName,
          artistName: data.artistName,
          albumName: data.albumName,
          artworkUrl: data.artworkUrl,
          highResArtworkUrl: data.highResArtworkUrl || data.artworkUrl,
          thumbnailUrl: data.thumbnailUrl || thumbnail,
          releaseDate: data.releaseDate,
          releaseYear: data.releaseYear,
          genre: data.genre,
          itunesTrackId: data.itunesTrackId,
          itunesCollectionId: data.itunesCollectionId,
          timestamp: Date.now(),
        };

        memoryCache.set(key, metadata);
        if (videoId) videoIdIndex.set(videoId, key);
        saveToLocalStorage(key, metadata);

        // Notify all subscribers (other UI components)
        for (const sub of subscribers) {
          try {
            sub(key, metadata);
          } catch {
            // ignore subscriber errors
          }
        }

        return metadata;
      }

      return null;
    } catch (err) {
      console.warn(`Failed to resolve iTunes artwork for "${title}":`, err);
      return null;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

// ── Core Async Album Resolver ──
const albumCache = new Map<string, string>();
const inFlightAlbums = new Map<string, Promise<string | null>>();

export async function resolveAlbumArtwork(albumName: string, artistName?: string): Promise<string | null> {
  if (!albumName) return null;
  const key = `album:::${(artistName || "").toLowerCase().trim()}:::${albumName.toLowerCase().trim()}`;

  if (albumCache.has(key)) {
    return albumCache.get(key) || null;
  }

  const inFlight = inFlightAlbums.get(key);
  if (inFlight) return inFlight;

  const promise = (async (): Promise<string | null> => {
    try {
      const params = new URLSearchParams({
        type: "album",
        title: albumName,
      });
      if (artistName) params.set("artist", artistName);

      const res = await fetch(`/api/artwork?${params.toString()}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (data && data.matched && data.artworkUrl) {
        albumCache.set(key, data.artworkUrl);
        return data.artworkUrl;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightAlbums.delete(key);
    }
  })();

  inFlightAlbums.set(key, promise);
  return promise;
}

// ── Background Batch Resolver ──
const batchQueue: Array<{ title: string; artist: string; videoId?: string }> = [];
let isProcessingBatch = false;

export function queueTrackArtworkResolution(tracks: Array<{ title: string; artist: string; videoId?: string }>) {
  for (const t of tracks) {
    if (!t.title) continue;
    const key = normalizeResolverKey(t.title, t.artist);
    if (!memoryCache.has(key)) {
      batchQueue.push(t);
    }
  }
  processBatchQueue();
}

async function processBatchQueue() {
  if (isProcessingBatch || batchQueue.length === 0) return;
  isProcessingBatch = true;

  try {
    while (batchQueue.length > 0) {
      // Process 3 at a time to prevent any UI or network stutter
      const batch = batchQueue.splice(0, 3);
      await Promise.all(batch.map((item) => resolveTrackMetadata(item)));
      // Small pause between batches
      await new Promise((r) => setTimeout(r, 60));
    }
  } finally {
    isProcessingBatch = false;
  }
}

// ── React Hook for Seamless UI Consumption ──
import { useState, useEffect } from "react";

export function useResolvedArtwork({
  title,
  artist = "",
  album,
  videoId,
  initialSrc,
  fallbackType = "song",
}: {
  title?: string;
  artist?: string;
  album?: string;
  videoId?: string;
  initialSrc?: string;
  fallbackType?: "song" | "artist" | "album";
}) {
  const [artworkUrl, setArtworkUrl] = useState<string>(() => {
    // 1. If initialSrc is already an iTunes mzstatic.com high-res cover or Deezer portrait, use immediately
    if (initialSrc && (initialSrc.includes("mzstatic.com") || initialSrc.includes("dzcdn.net"))) {
      return initialSrc;
    }
    // 2. Check synchronous cache
    if (title && fallbackType === "song") {
      const cached = getCachedArtwork(title, artist, videoId);
      if (cached) return cached;
    }
    return initialSrc || "";
  });

  const [isITunes, setIsITunes] = useState<boolean>(() => {
    return artworkUrl.includes("mzstatic.com");
  });

  const [metadata, setMetadata] = useState<ResolvedMusicMetadata | undefined>(() => {
    if (title && fallbackType === "song") {
      return getCachedMetadata(title, artist, videoId) || undefined;
    }
    return undefined;
  });

  useEffect(() => {
    // Skip if already iTunes artwork
    if (initialSrc && initialSrc.includes("mzstatic.com")) {
      if (artworkUrl !== initialSrc) {
        queueMicrotask(() => {
          setArtworkUrl(initialSrc);
          setIsITunes(true);
        });
      }
      return;
    }

    if (!title) {
      if (artworkUrl !== (initialSrc || "")) {
        queueMicrotask(() => {
          setArtworkUrl(initialSrc || "");
        });
      }
      return;
    }

    const key = fallbackType === "album"
      ? `album:::${artist.toLowerCase()}:::${title.toLowerCase()}`
      : normalizeResolverKey(title, artist);

    // 1. Check if now in cache
    if (fallbackType === "album") {
      const cached = albumCache.get(key);
      if (cached) {
        queueMicrotask(() => {
          setArtworkUrl(cached);
          setIsITunes(true);
        });
        return;
      }
    } else {
      const cached = memoryCache.get(key);
      if (cached && cached.artworkUrl) {
        queueMicrotask(() => {
          setArtworkUrl(cached.artworkUrl!);
          setIsITunes(true);
          setMetadata(cached);
        });
        return;
      }
    }

    // 2. Subscribe to pub/sub updates
    let isSubscribed = true;
    const handleUpdate: Listener = (updatedKey, data) => {
      if (!isSubscribed) return;
      if (updatedKey === key && data.artworkUrl) {
        setArtworkUrl(data.artworkUrl);
        setIsITunes(true);
        setMetadata(data);
      }
    };
    subscribers.add(handleUpdate);

    // 3. Initiate background resolution
    if (fallbackType === "album") {
      resolveAlbumArtwork(title, artist).then((res) => {
        if (isSubscribed && res) {
          setArtworkUrl(res);
          setIsITunes(true);
        }
      });
    } else {
      resolveTrackMetadata({ title, artist, album, videoId, thumbnail: initialSrc }).then((res) => {
        if (isSubscribed && res && res.artworkUrl) {
          setArtworkUrl(res.artworkUrl);
          setIsITunes(true);
          setMetadata(res);
        }
      });
    }

    return () => {
      isSubscribed = false;
      subscribers.delete(handleUpdate);
    };
  }, [title, artist, album, videoId, initialSrc, fallbackType]);

  return { artworkUrl, isITunes, metadata };
}
