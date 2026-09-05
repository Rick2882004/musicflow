/**
 * Audio Anchor for Mobile Background Playback & MediaSession Binding.
 * Supports:
 * 1. "silent": default /silence.wav
 * 2. "audible": controlled diagnostic experiment with low-frequency (40Hz) sub-bass looping signal
 * Attaches to DOM and reports complete connection, audibility, and event state.
 */

import { logBgDiag } from "./bg-diagnostics";

let audioAnchor: HTMLAudioElement | null = null;
let listenersAttached = false;
let currentAnchorMode: "silent" | "audible" = "silent";
let audibleDataUriCache: string | null = null;

export interface AudioAnchorState {
  exists: boolean;
  isConnected?: boolean;
  mode?: "silent" | "audible";
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

function generateLowToneWavDataUri(freq = 40, durationSec = 1, sampleRate = 8000, amplitude = 12): string {
  if (audibleDataUriCache) return audibleDataUriCache;
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + numSamples, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true); // 8-bit

  // data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, numSamples, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.round(128 + amplitude * Math.sin(2 * Math.PI * freq * t));
    view.setUint8(44 + i, Math.max(0, Math.min(255, sample)));
  }

  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  audibleDataUriCache = "data:audio/wav;base64," + btoa(binary);
  return audibleDataUriCache;
}

export function getAudioAnchorMode(): "silent" | "audible" {
  return currentAnchorMode;
}

export function setAudioAnchorMode(mode: "silent" | "audible") {
  currentAnchorMode = mode;
  if (audioAnchor) {
    const wasPlaying = !audioAnchor.paused;
    const newSrc = mode === "audible" ? generateLowToneWavDataUri() : "/silence.wav";
    audioAnchor.src = newSrc;
    audioAnchor.volume = mode === "audible" ? 0.15 : 0.01;
    if (wasPlaying) {
      playAudioAnchor();
    }
    logBgDiag("audio-anchor-mode-changed", {
      mode,
      srcLength: newSrc.length,
      volume: audioAnchor.volume,
      wasPlaying,
    });
  }
}

export function getAudioAnchorState(): AudioAnchorState {
  if (!audioAnchor) {
    return { exists: false, mode: currentAnchorMode };
  }
  return {
    exists: true,
    isConnected: audioAnchor.isConnected,
    mode: currentAnchorMode,
    paused: audioAnchor.paused,
    ended: audioAnchor.ended,
    readyState: audioAnchor.readyState,
    currentTime: Math.round(audioAnchor.currentTime * 100) / 100,
    duration: audioAnchor.duration || 0,
    volume: audioAnchor.volume,
    muted: audioAnchor.muted,
    src: audioAnchor.src ? (audioAnchor.src.startsWith("data:") ? "data:audio/wav;base64,[synthesized-40hz-tone]" : audioAnchor.src) : "",
    currentSrc: audioAnchor.currentSrc ? (audioAnchor.currentSrc.startsWith("data:") ? "data:audio/wav;base64,[synthesized-40hz-tone]" : audioAnchor.currentSrc) : "",
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

function ensureDomAttached(audio: HTMLAudioElement) {
  if (typeof document === "undefined") return;
  if (!audio.isConnected && document.body) {
    audio.id = "musicflow-audio-anchor";
    audio.setAttribute("aria-hidden", "true");
    audio.style.position = "fixed";
    audio.style.bottom = "0px";
    audio.style.left = "0px";
    audio.style.width = "1px";
    audio.style.height = "1px";
    audio.style.opacity = "0.001";
    audio.style.pointerEvents = "none";
    document.body.appendChild(audio);
    logBgDiag("audio-anchor-dom-attached", { isConnected: audio.isConnected });
  }
}

function getAudioAnchor(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioAnchor) {
    try {
      const src = currentAnchorMode === "audible" ? generateLowToneWavDataUri() : "/silence.wav";
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = currentAnchorMode === "audible" ? 0.15 : 0.01;
      audio.preload = "auto";
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");
      attachAudioListeners(audio);
      ensureDomAttached(audio);
      audioAnchor = audio;
      logBgDiag("audio-anchor-created", { state: getAudioAnchorState() });
    } catch (err) {
      logBgDiag("audio-anchor-create-error", { error: String(err) });
    }
  } else {
    ensureDomAttached(audioAnchor);
  }
  return audioAnchor;
}

export function playAudioAnchor() {
  const audio = getAudioAnchor();
  if (!audio) {
    logBgDiag("audio-anchor-play-skipped", { reason: "audio_not_available" });
    return;
  }

  ensureDomAttached(audio);
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
