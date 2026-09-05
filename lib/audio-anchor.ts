/**
 * Silent Audio Anchor for Chrome Android & Mobile Background Playback.
 * Plays a silent audio stream in the main frame to keep media session ownership.
 * Fully instrumented with lifecycle events and state diagnostics.
 */

import { logBgDiag } from "./bg-diagnostics";

let audioAnchor: HTMLAudioElement | null = null;
let listenersAttached = false;

export interface AudioAnchorState {
  exists: boolean;
  paused?: boolean;
  ended?: boolean;
  readyState?: number;
  currentTime?: number;
  duration?: number;
  volume?: number;
  muted?: boolean;
  src?: string;
  currentSrc?: string;
  networkState?: number;
  error?: { code: number; message: string } | null;
}

export function getAudioAnchorState(): AudioAnchorState {
  if (!audioAnchor) {
    return { exists: false };
  }
  return {
    exists: true,
    paused: audioAnchor.paused,
    ended: audioAnchor.ended,
    readyState: audioAnchor.readyState,
    currentTime: Math.round(audioAnchor.currentTime * 100) / 100,
    duration: audioAnchor.duration || 0,
    volume: audioAnchor.volume,
    muted: audioAnchor.muted,
    src: audioAnchor.src,
    currentSrc: audioAnchor.currentSrc,
    networkState: audioAnchor.networkState,
    error: audioAnchor.error
      ? { code: audioAnchor.error.code, message: audioAnchor.error.message }
      : null,
  };
}

function attachAudioListeners(audio: HTMLAudioElement) {
  if (listenersAttached) return;
  listenersAttached = true;

  const events = [
    "play",
    "playing",
    "pause",
    "ended",
    "waiting",
    "stalled",
    "suspend",
    "error",
    "canplay",
    "canplaythrough",
    "loadstart",
    "loadeddata",
    "loadedmetadata",
    "volumechange",
  ];

  events.forEach((eventName) => {
    audio.addEventListener(eventName, (e) => {
      logBgDiag(`audio-anchor-${eventName}`, {
        eventType: e.type,
        state: getAudioAnchorState(),
      });
    });
  });
}

function getAudioAnchor(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioAnchor) {
    try {
      const audio = new Audio("/silence.wav");
      audio.loop = true;
      audio.volume = 0.01;
      audio.preload = "auto";
      attachAudioListeners(audio);
      audioAnchor = audio;
      logBgDiag("audio-anchor-created", { state: getAudioAnchorState() });
    } catch (err) {
      logBgDiag("audio-anchor-create-error", { error: String(err) });
    }
  }
  return audioAnchor;
}

export function playAudioAnchor() {
  const audio = getAudioAnchor();
  if (!audio) {
    logBgDiag("audio-anchor-play-skipped", { reason: "audio_not_available" });
    return;
  }

  logBgDiag("audio-anchor-play-attempted", { state: getAudioAnchorState() });

  try {
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          logBgDiag("audio-anchor-play-resolved", { state: getAudioAnchorState() });
        })
        .catch((err: Error) => {
          logBgDiag("audio-anchor-play-rejected", {
            errorName: err.name,
            errorMessage: err.message,
            state: getAudioAnchorState(),
          });
        });
    }
  } catch (err) {
    logBgDiag("audio-anchor-play-sync-error", { error: String(err) });
  }
}

export function pauseAudioAnchor() {
  const audio = getAudioAnchor();
  if (audio && !audio.paused) {
    logBgDiag("audio-anchor-pause-called", { state: getAudioAnchorState() });
    audio.pause();
  }
}
