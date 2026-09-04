"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/player-store";
import { Track } from "@/types/music";

export function useSmartQueue() {
  const isFetchingRef = useRef(false);
  const lastFetchedVideoIdRef = useRef<string | null>(null);

  const {
    videoId,
    title,
    artist,
    queue,
    currentIndex,
    smartQueueEnabled,
    autoPlaySimilar,
    setQueue,
  } = usePlayerStore();

  useEffect(() => {
    // Only run if Smart Queue or Autoplay is enabled and a track is playing
    if (!smartQueueEnabled || !autoPlaySimilar || !videoId) return;

    // Check if we are at or near the end of the queue
    const isNearEnd = queue.length === 0 || currentIndex >= queue.length - 2;

    if (isNearEnd && !isFetchingRef.current && lastFetchedVideoIdRef.current !== videoId) {
      isFetchingRef.current = true;
      lastFetchedVideoIdRef.current = videoId;

      async function fetchSmartRecommendations() {
        try {
          const query = `${artist} Similar Hit Songs`;
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            const results: Track[] = data.results || [];
            
            // Filter out tracks already in the current queue
            const existingIds = new Set(usePlayerStore.getState().queue.map((t) => t.videoId));
            const newTracks = results.filter((t) => !existingIds.has(t.videoId)).slice(0, 6);

            if (newTracks.length > 0) {
              const currentQueue = usePlayerStore.getState().queue;
              usePlayerStore.getState().setQueue([...currentQueue, ...newTracks]);
            }
          }
        } catch (err) {
          console.error("Smart Queue auto-continuation error:", err);
        } finally {
          isFetchingRef.current = false;
        }
      }

      fetchSmartRecommendations();
    }
  }, [videoId, title, artist, queue.length, currentIndex, smartQueueEnabled, autoPlaySimilar, setQueue]);
}
