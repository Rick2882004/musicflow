"use client";

import { useState, useEffect, memo } from "react";
import { useResolvedArtwork } from "@/lib/metadata-resolver";

type SafeImageProps = {
  src?: string;
  videoId?: string;
  title?: string;
  artist?: string;
  album?: string;
  alt: string;
  className?: string;
  fallbackType?: "song" | "artist" | "album";
};

const QUALITIES = ["hqdefault", "mqdefault", "default"];

const SVG_FALLBACKS = {
  song: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" fill="%230c0c0e"/><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%237c3aed" stop-opacity="0.3"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient><rect width="500" height="500" fill="url(%23g)"/><path d="M220 170 v120 a35 35 0 1 1 -30 -34.5 v-85.5 l90 -25 v95 a35 35 0 1 1 -30 -34.5 v-65.5 z" fill="%23a855f7"/></svg>`,
  artist: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" fill="%2313111c"/><radialGradient id="g" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="%23ec4899" stop-opacity="0.25"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient><rect width="500" height="500" fill="url(%23g)"/><circle cx="250" cy="200" r="60" fill="%23d8b4fe"/><path d="M150 360 c0 -65 45 -90 100 -90 s100 25 100 90 z" fill="%23d8b4fe"/></svg>`,
  album: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" fill="%2309090b"/><circle cx="250" cy="250" r="180" fill="%2318181b" stroke="%2327272a" stroke-width="6"/><circle cx="250" cy="250" r="130" fill="none" stroke="%2327272a" stroke-width="2"/><circle cx="250" cy="250" r="80" fill="none" stroke="%2327272a" stroke-width="2"/><circle cx="250" cy="250" r="50" fill="%237c3aed"/><circle cx="250" cy="250" r="16" fill="%2309090b"/></svg>`,
};

export const SafeImage = memo(function SafeImage({
  src,
  videoId,
  title,
  artist,
  album,
  alt,
  className = "",
  fallbackType = "song",
}: SafeImageProps) {
  // Centralized iTunes metadata & high-resolution artwork resolver
  const { artworkUrl: resolvedSrc } = useResolvedArtwork({
    title,
    artist,
    album,
    videoId,
    initialSrc: src,
    fallbackType,
  });

  const [imgSrc, setImgSrc] = useState<string>("");
  const [resolvedVid, setResolvedVid] = useState<string>("");
  const [fallbackIndex, setFallbackIndex] = useState<number>(-1);
  const [hasFailedAll, setHasFailedAll] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Reset state on target change
  useEffect(() => {
    setHasFailedAll(false);
    setIsLoaded(false);
    setFallbackIndex(-1);

    const activeSource = resolvedSrc || src;

    let resolved = videoId || "";
    if (!resolved && activeSource) {
      const ytMatch = activeSource.match(/\/vi\/([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        resolved = ytMatch[1];
      }
    }
    setResolvedVid(resolved);

    // Filter out invalid or placeholder domains
    const isInvalid = !activeSource || activeSource === "undefined" || activeSource === "null" || activeSource.includes("placehold.co") || activeSource.includes("via.placeholder.com");

    if (!isInvalid && activeSource) {
      // Normalize YouTube maxresdefault / sddefault to hqdefault (prevents 404s for videos without 720p thumbnails)
      const normalized = activeSource
        .replace(/\/maxresdefault\.jpg(\?.*)?$/i, "/hqdefault.jpg$1")
        .replace(/\/sddefault\.jpg(\?.*)?$/i, "/hqdefault.jpg$1");
      setImgSrc(normalized);
      if (resolved && normalized.includes("hqdefault.jpg")) {
        setFallbackIndex(0);
      }
    } else if (resolved) {
      setImgSrc(`https://img.youtube.com/vi/${resolved}/hqdefault.jpg`);
      setFallbackIndex(0);
    } else {
      setHasFailedAll(true);
      setImgSrc(SVG_FALLBACKS[fallbackType] || SVG_FALLBACKS.song);
    }
  }, [resolvedSrc, src, videoId, fallbackType]);

  const handleError = () => {
    if (resolvedVid && !hasFailedAll) {
      const nextIndex = fallbackIndex + 1;
      if (nextIndex < QUALITIES.length) {
        setFallbackIndex(nextIndex);
        setImgSrc(`https://img.youtube.com/vi/${resolvedVid}/${QUALITIES[nextIndex]}.jpg`);
      } else {
        setHasFailedAll(true);
        setImgSrc(SVG_FALLBACKS[fallbackType] || SVG_FALLBACKS.song);
      }
    } else {
      setHasFailedAll(true);
      setImgSrc(SVG_FALLBACKS[fallbackType] || SVG_FALLBACKS.song);
    }
  };

  const finalSrc = hasFailedAll || !imgSrc ? (SVG_FALLBACKS[fallbackType] || SVG_FALLBACKS.song) : imgSrc;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-80"}`}
      />
      {!isLoaded && !hasFailedAll && (
        <div className="absolute inset-0 bg-zinc-900/60 animate-pulse pointer-events-none" />
      )}
    </div>
  );
});

SafeImage.displayName = "SafeImage";
