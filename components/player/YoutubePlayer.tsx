"use client";

import YouTube from "react-youtube";
import { useRef } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { updateMediaSessionPosition } from "@/hooks/useMediaSession";
import { logBgDiag, getYTStateName } from "@/lib/bg-diagnostics";
import {
  canAttemptBgResume,
  incrementBgResumeAttempts,
  clearIntentionalUserPause,
  isIntentionalUserPause,
} from "@/lib/playback-intent";

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
    const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    logBgDiag("yt-ready", {
      videoId,
      duration: dur,
      isHidden,
      playerState: event.target.getPlayerState?.(),
    });
    clearIntentionalUserPause();

    // Always autoplay on ready — tracks are only loaded when user initiates playback
    logBgDiag("yt-ready-playVideo", { videoId, isHidden });
    try {
      event.target.playVideo();
    } catch (err) {
      logBgDiag("yt-ready-playVideo-error", { error: String(err) });
    }
  };

  const onStateChange = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const state = event.data;
    const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    logBgDiag("yt-state-change", { ytState: state, videoId, isHidden });

    // Sync actual YouTube playback state → Zustand store
    if (state === YT_PLAYING) {
      clearIntentionalUserPause();
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
            updateMediaSessionPosition(pos, dur, rate, true);
          }
        } catch { /* ignore */ }
      }
    } else if (state === YT_PAUSED) {
      const store = usePlayerStore.getState();
      const intentional = isIntentionalUserPause();

      logBgDiag("yt-paused-event", {
        videoId,
        isHidden,
        intentional,
        storePlaying: store.isPlaying,
        resumeAllowed: canAttemptBgResume(),
      });

      // Chrome Android background & app-switching pause recovery:
      // When Chrome Android is backgrounded, screen locks, or user switches to another app (e.g. WhatsApp),
      // YouTube's iframe receives blur / visibilitychange and pauses itself.
      // If the user did NOT click pause (store.isPlaying is still true and !intentional),
      // we immediately re-issue playVideo() to keep audio streaming.
      if (!intentional && store.isPlaying) {
        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }

        if (canAttemptBgResume()) {
          const attempt = incrementBgResumeAttempts();
          logBgDiag("chrome-bg-auto-resume", { attempt, videoId, isHidden });
          try {
            const ret = event.target.playVideo();
            logBgDiag("chrome-bg-auto-resume-called", { attempt, videoId, retType: typeof ret });
            setTimeout(() => {
              try {
                const postState = event.target.getPlayerState?.();
                logBgDiag("chrome-bg-auto-resume-check", {
                  attempt,
                  videoId,
                  postState,
                  postStateName: getYTStateName(postState),
                  isHidden: typeof document !== "undefined" && document.visibilityState === "hidden",
                });
              } catch (err) {
                logBgDiag("chrome-bg-auto-resume-check-error", { error: String(err) });
              }
            }, 250);
          } catch (err) {
            logBgDiag("chrome-bg-resume-error", { error: String(err) });
          }
        } else {
          // Throttled: schedule a delayed retry so if pause occurred during app switch transition, it catches up
          setTimeout(() => {
            const s = usePlayerStore.getState();
            if (!isIntentionalUserPause() && s.isPlaying && event.target) {
              try {
                const curState = event.target.getPlayerState?.();
                if (curState === YT_PAUSED) {
                  event.target.playVideo();
                  logBgDiag("chrome-bg-delayed-resume-called", { videoId });
                }
              } catch { /* ignore */ }
            }
          }, 350);
        }

        // CRITICAL: Return here! Do NOT call setIsPlaying(false) and do NOT pause audio anchor.
        // The user never clicked pause; the audio session must stay active.
        return;
      }

      // Only reached if intentionalUserPause is true (user explicitly paused)
      logBgDiag("yt-paused-finalized", {
        videoId,
        isHidden,
        reason: "user_intentional",
      });

      setIsPlaying(false);
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
    } else if (state === YT_ENDED) {
      logBgDiag("yt-ended-step1", { videoId, isHidden });
      const { isRepeat, queue, currentIndex } = usePlayerStore.getState();
      if (isRepeat) {
        logBgDiag("yt-ended-repeat", { videoId });
        event.target.playVideo();
      } else if (queue.length > 0 && currentIndex < queue.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextTrackItem = queue[nextIndex];
        logBgDiag("yt-ended-step2-calling-nextTrack", {
          currentIndex,
          nextIndex,
          nextVideoId: nextTrackItem?.videoId,
          nextTitle: nextTrackItem?.title,
          isHidden,
        });
        clearIntentionalUserPause();
        nextTrack();
        logBgDiag("yt-ended-step3-nextTrack-called", {
          newVideoId: usePlayerStore.getState().videoId,
          isPlaying: usePlayerStore.getState().isPlaying,
          isHidden,
        });
      } else {
        logBgDiag("yt-ended-queue-exhausted", { queueLength: queue.length, currentIndex, isHidden });
        setIsPlaying(false);
        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "paused";
        }
      }
    } else if (state === YT_BUFFERING) {
      // Keep isPlaying true during buffering — do not mark as paused
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    } else if (state === YT_UNSTARTED) {
      // A new video was loaded but hasn't started — attempt to play
      logBgDiag("yt-unstarted-calling-playVideo", { videoId, isHidden });
      try {
        event.target.playVideo();
      } catch (err) {
        logBgDiag("yt-unstarted-playVideo-error", { error: String(err) });
      }
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
        logBgDiag("yt-error", {
          error: e.data,
          videoId,
          isHidden: typeof document !== "undefined" && document.visibilityState === "hidden",
        });
        // On error (e.g., video unavailable), attempt to skip to next
        if (e.data === 100 || e.data === 101 || e.data === 150) {
          logBgDiag("yt-error-skipping-nextTrack", { error: e.data });
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
