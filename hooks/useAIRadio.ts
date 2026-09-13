"use client";

import { useEffect, useRef } from "react";
import { useRadioStore } from "@/store/radio-store";
import { usePlayerStore } from "@/store/player-store";
import { Track } from "@/types/music";

const REFILL_COOLDOWN_MS = 12000; // 12-second minimum cooldown between refills

export function useAIRadio() {
  const isFetchingRef = useRef(false);
  const lastRefillTimestampRef = useRef(0);
  const lastRefilledSessionIdRef = useRef<string | null>(null);

  const {
    radioActive,
    radioSeedTrack,
    radioSessionId,
    generationInFlight,
    tracksAppendedCount,
    seenSessionTrackIds,
    consecutiveSkips,
    setGenerationInFlight,
    recordAppendedTracks,
  } = useRadioStore();

  const {
    videoId,
    title,
    artist,
    thumbnail,
    queue,
    currentIndex,
    history,
    skips,
    likedSongs,
    recentSongs,
    setQueue,
  } = usePlayerStore();

  useEffect(() => {
    // 1. Must be active with a playable track
    if (!radioActive || !radioSessionId) return;
    if (!videoId || videoId.startsWith("itunes-")) return;

    // 2. Safe Trigger Threshold: remaining upcoming tracks <= 2
    // If queue is empty or single track (currentIndex = 0, length = 1), remaining is 0 <= 2 (triggers immediately)
    const remaining = queue.length > 0 ? queue.length - 1 - currentIndex : 0;
    const needsRefill = remaining <= 2;

    if (!needsRefill) return;

    // 3. Single-flight lock: prevent parallel requests
    if (isFetchingRef.current || generationInFlight) return;

    // 4. Session cooldown protection
    const now = Date.now();
    const isNewSession = lastRefilledSessionIdRef.current !== radioSessionId;
    if (!isNewSession && now - lastRefillTimestampRef.current < REFILL_COOLDOWN_MS) {
      return;
    }

    isFetchingRef.current = true;
    setGenerationInFlight(true);
    lastRefillTimestampRef.current = now;
    lastRefilledSessionIdRef.current = radioSessionId;

    const sessionToken = radioSessionId;
    const currentTrack: Track = {
      videoId,
      title,
      artist,
      thumbnail,
    };

    async function fetchRadioContinuation() {
      try {
        const res = await fetch("/api/ai/radio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seedTrack: radioSeedTrack || currentTrack,
            currentTrack,
            queue,
            recentVideoIds: (history || []).slice(0, 20).map((h) => h.track.videoId),
            seenSessionTrackIds,
            skips: skips || [],
            consecutiveSkips,
            tracksAppendedCount,
            likedSongs: likedSongs || [],
            recentSongs: recentSongs || [],
            history: history || [],
            radioSessionId: sessionToken,
            limit: 6,
          }),
        });

        // 5. Stale request protection: verify session hasn't changed or stopped
        const currentRadio = useRadioStore.getState();
        if (!currentRadio.radioActive || currentRadio.radioSessionId !== sessionToken) {
          return;
        }

        if (res.ok) {
          const data = await res.json();
          const nextTracks: Track[] = data.nextTracks || [];

          if (nextTracks.length > 0) {
            const currentQ = usePlayerStore.getState().queue;
            const existingIds = new Set(currentQ.map((t) => t.videoId));
            const seenIds = new Set(currentRadio.seenSessionTrackIds);

            // Deduplicate against active queue and session history
            const deduplicated = nextTracks.filter(
              (t) => !existingIds.has(t.videoId) && !seenIds.has(t.videoId)
            );

            if (deduplicated.length > 0) {
              const baseQueue = currentQ.length === 0 ? [currentTrack] : currentQ;
              // Safe append: append AFTER all current queue tracks, preserving manual queue items
              usePlayerStore.getState().setQueue([...baseQueue, ...deduplicated]);
              currentRadio.recordAppendedTracks(deduplicated.map((t) => t.videoId));
            }
          }
        }
      } catch (err) {
        console.error("[AIRadio] Refill error:", err);
      } finally {
        isFetchingRef.current = false;
        useRadioStore.getState().setGenerationInFlight(false);
      }
    }

    void fetchRadioContinuation();
  }, [
    radioActive,
    radioSessionId,
    radioSeedTrack,
    generationInFlight,
    tracksAppendedCount,
    seenSessionTrackIds,
    consecutiveSkips,
    videoId,
    title,
    artist,
    thumbnail,
    queue,
    currentIndex,
    history,
    skips,
    likedSongs,
    recentSongs,
    setQueue,
    setGenerationInFlight,
    recordAppendedTracks,
  ]);
}
