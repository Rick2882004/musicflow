"use client";

import YouTube from "react-youtube";
import { useRef } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { safeSetPositionState } from "@/hooks/useMediaSession";
import { logBgDiag } from "@/lib/bg-diagnostics";

// YouTube player state codes
const YT_UNSTARTED = -1;
const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;

type Props = {
  videoId: string;
};

export default function YoutubePlayer({ videoId }: Props) {
  const playerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const {
    setPlayer,
    setDuration,
    nextTrack,
    setIsPlaying,
  } = usePlayerStore(useShallow((s) => ({
    setPlayer: s.setPlayer,
    setDuration: s.setDuration,
    nextTrack: s.nextTrack,
    setIsPlaying: s.setIsPlaying,
  })));

  const onReady = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    playerRef.current = event.target;
    setPlayer(event.target);
    const dur = event.target.getDuration();
    if (dur > 0) setDuration(dur);
    logBgDiag("yt-ready", { videoId, duration: dur });

    // Always autoplay on ready — tracks are only loaded when user initiates playback
    event.target.playVideo();
  };

  const onStateChange = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const state = event.data;
    logBgDiag("yt-state-change", { ytState: state, videoId });

    // Sync actual YouTube playback state → Zustand store
    if (state === YT_PLAYING) {
      setIsPlaying(true);
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
        // Set initial position state so the lock-screen seek bar appears immediately
        try {
          const dur = event.target.getDuration();
          const pos = event.target.getCurrentTime();
          const rate = event.target.getPlaybackRate() || 1;
          if (dur > 0) {
            setDuration(dur);
            safeSetPositionState(dur, pos, rate);
          }
        } catch { /* ignore */ }
      }
    } else if (state === YT_PAUSED) {
      const store = usePlayerStore.getState();

      // Chrome Android background pause recovery:
      // When Chrome Android is backgrounded or screen locks, YouTube's iframe receives
      // visibilitychange and pauses itself. If the user did not click pause (store.isPlaying is still true),
      // we immediately re-issue playVideo() to keep audio streaming in the background.
      if (typeof document !== "undefined" && document.visibilityState === "hidden" && store.isPlaying) {
        logBgDiag("chrome-bg-auto-resume", { reason: "visibility_hidden_while_playing" });
        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
        try {
          event.target.playVideo();
        } catch (err) {
          logBgDiag("chrome-bg-resume-error", { error: String(err) });
        }
        return;
      }

      setIsPlaying(false);
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
    } else if (state === YT_ENDED) {
      setIsPlaying(false);
      const { isRepeat } = usePlayerStore.getState();
      if (isRepeat) {
        event.target.playVideo();
      } else {
        nextTrack();
      }
    } else if (state === YT_BUFFERING) {
      // Keep isPlaying true during buffering — do not mark as paused
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    } else if (state === YT_UNSTARTED) {
      // A new video was loaded but hasn't started — attempt to play
      event.target.playVideo();
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : undefined;

  return (
    <YouTube
      videoId={videoId}
      onReady={onReady}
      onStateChange={onStateChange}
      onError={(e) => {
        console.warn("YouTube player notice:", e.data);
        logBgDiag("yt-error", { error: e.data, videoId });
        // On error (e.g., video unavailable), attempt to skip to next
        if (e.data === 100 || e.data === 101 || e.data === 150) {
          nextTrack();
        }
      }}
      opts={{
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          origin,
          enablejsapi: 1,
          widget_referrer: origin,
          playsinline: 1,  // Required for iOS inline audio
        },
      }}
    />
  );
}
