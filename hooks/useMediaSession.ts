"use client";

/**
 * useMediaSession — Single canonical MediaSession integration for MusicFlow.
 *
 * ARCHITECTURE:
 * 1. Action handlers are registered on mount AND re-asserted whenever the
 *    YouTube iframe triggers a playing state change (the iframe's own MediaSession
 *    can overwrite our handlers — we reclaim them immediately).
 * 2. Handlers always read live state via usePlayerStore.getState() — no stale closures.
 * 3. Metadata updates whenever track/artwork changes.
 * 4. playbackState is synced via YouTube onStateChange (primary) + store subscription.
 * 5. prevTrack: if position > 3s, restart current track. Otherwise go to previous.
 * 6. Artwork MIME type: auto-detected from URL (iTunes = jpeg, icons = png).
 *
 * IMPORTANT — Chrome Android iframe conflict:
 * YouTube's embedded iframe registers its own MediaSession with only play/pause.
 * Our main-page MediaSession must be re-asserted after any YouTube state event.
 * Additionally, PlayerEngine must NOT use display:none (use off-screen CSS instead)
 * so Chrome treats the iframe as rendered and surfaces all our registered actions.
 */

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { logBgDiag, recordMediaActionRegistration } from "@/lib/bg-diagnostics";
import { playAudioAnchor, pauseAudioAnchor } from "@/lib/audio-anchor";
import { markIntentionalUserPause, clearIntentionalUserPause } from "@/lib/playback-intent";

const IS_DEV = process.env.NODE_ENV === "development";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getArtworkMimeType(url: string): string {
  if (!url) return "image/jpeg";
  const lower = url.toLowerCase();
  if (lower.includes(".png") || lower.includes("icon-")) return "image/png";
  if (lower.includes("mzstatic.com")) return "image/jpeg"; // iTunes — always JPEG
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
  playbackRate: number = 1
) {
  if (
    typeof navigator === "undefined" ||
    !("mediaSession" in navigator) ||
    typeof navigator.mediaSession.setPositionState !== "function"
  ) return;

  // Strict validation per W3C specification:
  // - duration must be a finite positive number > 0
  // - position must be a finite non-negative number >= 0 and < duration
  // - playbackRate must be a finite positive number > 0
  if (
    typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0 ||
    typeof position !== "number" || !Number.isFinite(position) || position < 0 ||
    typeof playbackRate !== "number" || !Number.isFinite(playbackRate) || playbackRate <= 0
  ) {
    return;
  }

  // Ensure position is strictly less than duration
  const safePos = Math.min(position, Math.max(duration - 0.1, 0));

  try {
    navigator.mediaSession.setPositionState({
      duration,
      position: safePos,
      playbackRate,
    });
  } catch {
    // Silently ignore browser-specific setPositionState exceptions
  }
}

// Log registration result and record to diagnostics
function tryRegisterAction(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null
): boolean {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
    recordMediaActionRegistration(action, true);
    logBgDiag("mediasession-handler-registered", { action, success: true });
    if (IS_DEV) console.debug(`[MediaSession] ✓ Registered: ${action}`);
    return true;
  } catch (err) {
    recordMediaActionRegistration(action, false);
    logBgDiag("mediasession-handler-failed", { action, error: String(err) });
    console.warn(`[MediaSession] ✗ Registration failed: ${action}`, err);
    return false;
  }
}

// Register all MusicFlow MediaSession action handlers on mount
function registerAllHandlers() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

  // PLAY
  tryRegisterAction("play", () => {
    logBgDiag("mediasession-action", { action: "play" });
    clearIntentionalUserPause();
    playAudioAnchor();
    const { player } = usePlayerStore.getState();
    usePlayerStore.getState().setIsPlaying(true);
    navigator.mediaSession.playbackState = "playing";
    if (player) { try { player.playVideo(); } catch { /* ignore */ } }
  });

  // PAUSE
  tryRegisterAction("pause", () => {
    logBgDiag("mediasession-action", { action: "pause" });
    markIntentionalUserPause();
    pauseAudioAnchor();
    const { player } = usePlayerStore.getState();
    usePlayerStore.getState().setIsPlaying(false);
    navigator.mediaSession.playbackState = "paused";
    if (player) { try { player.pauseVideo(); } catch { /* ignore */ } }
  });

  // NEXT TRACK — calls canonical nextTrack() which advances queue & loads new video
  tryRegisterAction("nexttrack", () => {
    logBgDiag("mediasession-action", { action: "nexttrack" });
    if (IS_DEV) console.debug("[MediaSession] nexttrack triggered");
    clearIntentionalUserPause();
    playAudioAnchor();
    usePlayerStore.getState().nextTrack();
  });

  // PREVIOUS TRACK — restart if > 3s in, else go to prev queue item
  tryRegisterAction("previoustrack", () => {
    logBgDiag("mediasession-action", { action: "previoustrack" });
    if (IS_DEV) console.debug("[MediaSession] previoustrack triggered");
    clearIntentionalUserPause();
    playAudioAnchor();
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

  // SEEK TO — OS lock-screen seek bar drag
  tryRegisterAction("seekto", (details) => {
    if (IS_DEV) console.debug("[MediaSession] seekto triggered:", details?.seekTime);
    const store = usePlayerStore.getState();
    const { player, duration, playbackSpeed } = store;
    if (!player || details?.seekTime == null) return;
    const target = Math.min(Math.max(details.seekTime, 0), Math.max(duration - 0.1, 0));
    try {
      player.seekTo(target, true);
      store.setCurrentTime(target);
      safeSetPositionState(duration, target, playbackSpeed);
    } catch { /* ignore */ }
  });

  // STOP — Android sometimes shows this
  tryRegisterAction("stop", () => {
    markIntentionalUserPause();
    pauseAudioAnchor();
    const { player } = usePlayerStore.getState();
    if (player) { try { player.pauseVideo(); } catch { /* ignore */ } }
    usePlayerStore.getState().setIsPlaying(false);
    navigator.mediaSession.playbackState = "paused";
  });
}

// ── Development diagnostic dump ───────────────────────────────────────────────
export function logMediaSessionDiagnostics() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
    console.info("[MediaSession] NOT AVAILABLE in this environment");
    return;
  }
  const store = usePlayerStore.getState();
  console.group("[MediaSession] Diagnostics");
  console.info("Available:", true);
  console.info("playbackState:", navigator.mediaSession.playbackState);
  console.info("metadata title:", navigator.mediaSession.metadata?.title);
  console.info("metadata artist:", navigator.mediaSession.metadata?.artist);
  console.info("metadata artwork count:", navigator.mediaSession.metadata?.artwork?.length);
  console.info("Zustand isPlaying:", store.isPlaying);
  console.info("Zustand duration:", store.duration);
  console.info("Zustand currentTime:", store.currentTime);
  console.info("Zustand playbackSpeed:", store.playbackSpeed);
  console.info("Zustand player:", store.player ? "connected" : "null");
  console.groupEnd();
}

// ── The Hook ─────────────────────────────────────────────────────────────────

export function useMediaSession() {
  const initialRegistrationDone = useRef(false);

  // Reactive values that drive metadata updates only
  const { videoId, title, artist, thumbnail } = usePlayerStore(
    useShallow((s) => ({
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
    }))
  );

  // ── Register all action handlers ONCE on first mount ───────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    if (initialRegistrationDone.current) return;
    initialRegistrationDone.current = true;

    if (IS_DEV) console.debug("[MediaSession] Initial handler registration");
    registerAllHandlers();

    // Expose diagnostic helper on window in dev
    if (IS_DEV) {
      (window as any).__musicflowMediaDiag = logMediaSessionDiagnostics; // eslint-disable-line @typescript-eslint/no-explicit-any
      console.debug("[MediaSession] Run window.__musicflowMediaDiag() to inspect state");
    }
  }, []); // Run once on mount

  // ── Update Metadata whenever track/artwork changes ─────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    if (!videoId || !title) return;

    // 1. Set metadata for the new track
    const artworkList = buildArtworkList(thumbnail);
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: artist || "MusicFlow",
      album: "MusicFlow",
      artwork: artworkList,
    });

    logBgDiag("mediasession-metadata-set", {
      title,
      artist: artist || "MusicFlow",
      artworkCount: artworkList.length,
      videoId,
    });

    // 2. Set initial position state for new track
    const { duration, playbackSpeed } = usePlayerStore.getState();
    if (duration > 0) {
      safeSetPositionState(duration, 0, playbackSpeed);
    }

    if (IS_DEV) {
      console.debug(`[MediaSession] Track changed → "${title}" by "${artist}"`);
      console.debug(`[MediaSession] Artwork: ${thumbnail?.substring(0, 80)}`);
    }
  }, [videoId, title, artist, thumbnail]);

  // ── Sync playbackState + audio anchor on play state change ─────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const unsub = usePlayerStore.subscribe((state, prev) => {
      if (state.isPlaying !== prev.isPlaying) {
        const nextState = state.isPlaying ? "playing" : "paused";
        navigator.mediaSession.playbackState = nextState;
        logBgDiag("mediasession-playbackstate-synced", {
          playbackState: nextState,
          isPlaying: state.isPlaying,
        });

        if (state.isPlaying) {
          playAudioAnchor();
        } else {
          pauseAudioAnchor();
        }
      }
    });
    return unsub;
  }, []); // Run once
}
