"use client";

/**
 * useMediaSession — Single canonical MediaSession integration for MusicFlow.
 *
 * KEY DESIGN DECISIONS:
 * 1. Action handlers are registered ONCE on mount and never re-registered.
 *    They always read live state from usePlayerStore.getState() — no stale closures.
 * 2. Metadata (title/artist/artwork) is updated reactively whenever the track changes.
 * 3. playbackState is driven by YoutubePlayer onStateChange (source of truth).
 *    This hook also sets it on play/pause actions from the OS.
 * 4. prevTrack: if position > 3s, restart current track. Otherwise go to previous.
 * 5. Artwork MIME type: detect jpeg vs png from URL to satisfy strict Android validators.
 */

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getArtworkMimeType(url: string): string {
  if (!url) return "image/jpeg";
  const lower = url.toLowerCase();
  if (lower.includes(".png") || lower.includes("icon-")) return "image/png";
  // iTunes mzstatic.com URLs are always JPEG even without extension
  if (lower.includes("mzstatic.com")) return "image/jpeg";
  if (lower.includes(".webp")) return "image/webp";
  return "image/jpeg";
}

function buildArtworkList(thumbnail: string): MediaImage[] {
  if (!thumbnail) {
    return [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ];
  }
  const mime = getArtworkMimeType(thumbnail);
  return [
    { src: thumbnail, sizes: "512x512", type: mime },
    { src: thumbnail, sizes: "192x192", type: mime },
  ];
}

export function safeSetPositionState(
  duration: number,
  position: number,
  playbackRate: number
) {
  if (
    typeof navigator === "undefined" ||
    !("mediaSession" in navigator) ||
    typeof navigator.mediaSession.setPositionState !== "function"
  ) return;
  if (duration <= 0 || position < 0 || playbackRate <= 0) return;
  const safePos = Math.min(Math.max(position, 0), duration - 0.001);
  try {
    navigator.mediaSession.setPositionState({
      duration,
      position: safePos,
      playbackRate,
    });
  } catch {
    // setPositionState not supported or invalid values — swallow silently
  }
}

function tryRegisterAction(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null
) {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // Action not supported by this browser/OS — ignore safely
  }
}

// ── The Hook ─────────────────────────────────────────────────────────────────

export function useMediaSession() {
  const handlersRegistered = useRef(false);

  // Reactive values that drive metadata updates only
  const { videoId, title, artist, thumbnail } = usePlayerStore(
    useShallow((s) => ({
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
    }))
  );

  // ── Register all action handlers ONCE on mount ─────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    if (handlersRegistered.current) return;
    handlersRegistered.current = true;

    // PLAY
    tryRegisterAction("play", () => {
      const { player } = usePlayerStore.getState();
      if (player) { try { player.playVideo(); } catch { /* ignore */ } }
      usePlayerStore.getState().setIsPlaying(true);
      navigator.mediaSession.playbackState = "playing";
    });

    // PAUSE
    tryRegisterAction("pause", () => {
      const { player } = usePlayerStore.getState();
      if (player) { try { player.pauseVideo(); } catch { /* ignore */ } }
      usePlayerStore.getState().setIsPlaying(false);
      navigator.mediaSession.playbackState = "paused";
    });

    // NEXT TRACK
    tryRegisterAction("nexttrack", () => {
      usePlayerStore.getState().nextTrack();
    });

    // PREVIOUS TRACK — restart if > 3s in, else go to prev queue item
    tryRegisterAction("previoustrack", () => {
      const store = usePlayerStore.getState();
      const { player, currentTime, prevTrack, duration, playbackSpeed } = store;

      if (currentTime > 3 && player) {
        try {
          player.seekTo(0, true);
          store.setCurrentTime(0);
          safeSetPositionState(duration, 0, playbackSpeed);
          navigator.mediaSession.playbackState = "playing";
        } catch { /* ignore */ }
        return;
      }

      prevTrack();
    });

    // SEEK BACKWARD (default 10s)
    tryRegisterAction("seekbackward", (details) => {
      const store = usePlayerStore.getState();
      const { player, currentTime, duration, playbackSpeed } = store;
      if (!player) return;
      const skipTime = details?.seekOffset ?? 10;
      const target = Math.max(currentTime - skipTime, 0);
      try {
        player.seekTo(target, true);
        store.setCurrentTime(target);
        safeSetPositionState(duration, target, playbackSpeed);
      } catch { /* ignore */ }
    });

    // SEEK FORWARD (default 10s)
    tryRegisterAction("seekforward", (details) => {
      const store = usePlayerStore.getState();
      const { player, currentTime, duration, playbackSpeed } = store;
      if (!player) return;
      const skipTime = details?.seekOffset ?? 10;
      const target = Math.min(currentTime + skipTime, duration);
      try {
        player.seekTo(target, true);
        store.setCurrentTime(target);
        safeSetPositionState(duration, target, playbackSpeed);
      } catch { /* ignore */ }
    });

    // SEEK TO (OS lock-screen drag seek bar)
    tryRegisterAction("seekto", (details) => {
      const store = usePlayerStore.getState();
      const { player, duration, playbackSpeed } = store;
      if (!player || details?.seekTime == null) return;
      const target = Math.min(Math.max(details.seekTime, 0), duration);
      try {
        player.seekTo(target, true);
        store.setCurrentTime(target);
        safeSetPositionState(duration, target, playbackSpeed);
      } catch { /* ignore */ }
    });

    // STOP (Android sometimes shows this button)
    tryRegisterAction("stop", () => {
      const { player } = usePlayerStore.getState();
      if (player) { try { player.pauseVideo(); } catch { /* ignore */ } }
      usePlayerStore.getState().setIsPlaying(false);
      navigator.mediaSession.playbackState = "paused";
    });

  }, []); // Empty deps: intentional — handlers read live state via getState(), not closures

  // ── Update Metadata whenever track/artwork changes ─────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    if (!videoId || !title) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: artist || "MusicFlow",
      album: "MusicFlow",
      artwork: buildArtworkList(thumbnail),
    });

    // Reset position state for new track (duration unknown yet, will update from poll)
    const { duration, playbackSpeed } = usePlayerStore.getState();
    if (duration > 0) {
      safeSetPositionState(duration, 0, playbackSpeed);
    }

  }, [videoId, title, artist, thumbnail]);

  // ── Sync playbackState via store subscription ──────────────────────────────
  // YoutubePlayer.onStateChange is primary. This is a safety net for edge cases.
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    const unsub = usePlayerStore.subscribe((state, prev) => {
      if (state.isPlaying !== prev.isPlaying) {
        navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
      }
    });
    return unsub;
  }, []); // Empty deps: intentional — uses store.subscribe() not React state

}
