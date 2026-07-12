"use client";

import { useState, useEffect, memo } from "react";

type SafeImageProps = {
  src?: string;
  videoId?: string;
  alt: string;
  className?: string;
  fallbackType?: "song" | "artist" | "album";
};

const QUALITIES = ["maxresdefault", "sddefault", "hqdefault", "mqdefault", "default"];

export const SafeImage = memo(function SafeImage({
  src,
  videoId,
  alt,
  className,
  fallbackType = "song",
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [resolvedVid, setResolvedVid] = useState<string>("");
  const [fallbackIndex, setFallbackIndex] = useState<number>(-1);
  const [hasFailedAll, setHasFailedAll] = useState<boolean>(false);

  // When src or videoId changes, reset state
  useEffect(() => {
    setHasFailedAll(false);
    setFallbackIndex(-1);
    
    let resolved = videoId || "";
    if (!resolved && src) {
      const ytMatch = src.match(/\/vi\/([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        resolved = ytMatch[1];
      }
    }
    setResolvedVid(resolved);

    if (src) {
      setImgSrc(src);
    } else if (resolved) {
      // Start with highest quality
      setImgSrc(`https://img.youtube.com/vi/${resolved}/maxresdefault.jpg`);
      setFallbackIndex(0);
    } else {
      setImgSrc("");
    }
  }, [src, videoId]);

  const handleError = () => {
    // If we have a videoId and we haven't failed all qualities yet
    if (resolvedVid && !hasFailedAll) {
      const nextIndex = fallbackIndex + 1;
      if (nextIndex < QUALITIES.length) {
        setFallbackIndex(nextIndex);
        setImgSrc(`https://img.youtube.com/vi/${resolvedVid}/${QUALITIES[nextIndex]}.jpg`);
      } else {
        setHasFailedAll(true);
        setImgSrc(""); // triggers placeholder
      }
    } else {
      setHasFailedAll(true);
    }
  };

  // Select default premium placeholder
  let placeholder = "https://placehold.co/500x500/111/fff?text=♪";
  if (fallbackType === "artist") {
    placeholder = "https://placehold.co/500x500/111/fff?text=Artist";
  } else if (fallbackType === "album") {
    placeholder = "https://placehold.co/500x500/111/fff?text=Album";
  }

  const finalSrc = hasFailedAll || !imgSrc ? placeholder : imgSrc;

  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      onError={handleError}
      className={className}
    />
  );
});
SafeImage.displayName = "SafeImage";
