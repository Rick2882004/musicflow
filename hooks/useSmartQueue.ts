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
          const state = usePlayerStore.getState();
          const currentTrack: Track = {
            videoId,
            title,
            artist,
            thumbnail: state.thumbnail,
          };

          // Primary: Call AI Smart Queue Engine
          const res = await fetch("/api/ai/smart-queue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentTrack,
              queue: state.queue,
              recentVideoIds: (state.history || []).slice(0, 20).map((h) => h.track.videoId),
              skips: state.skips || [],
              likedSongs: state.likedSongs || [],
              recentSongs: state.recentSongs || [],
              history: state.history || [],
              limit: 6,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const rankedTracks: Track[] = data.nextTracks || [];
            if (rankedTracks.length > 0) {
              const currentQ = usePlayerStore.getState().queue;
              const existingIds = new Set(currentQ.map((t) => t.videoId));
              const deduplicated = rankedTracks.filter((t) => !existingIds.has(t.videoId));
              if (deduplicated.length > 0) {
                const baseQueue = currentQ.length === 0 ? [currentTrack] : currentQ;
                usePlayerStore.getState().setQueue([...baseQueue, ...deduplicated]);
                return;
              }
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
