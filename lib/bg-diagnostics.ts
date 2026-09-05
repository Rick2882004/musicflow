/**
 * Background Playback Diagnostic Logger for Chrome Android / Mobile Browsers.
 * Exposes window.__musicflowBgDiag to trace the exact sequence of lifecycle,
 * visibility, YouTube player, and MediaSession state changes.
 */

import { getAudioAnchorState, AudioAnchorState } from "./audio-anchor";

export interface BgDiagEvent {
  time: string;
  ms: number;
  type: string;
  visibilityState: string;
  hasFocus: boolean;
  ytState?: number;
  ytStateName?: string;
  mediaSessionPlaybackState?: string;
  currentTrack?: { videoId: string; title: string };
  isPlaying: boolean;
  audioAnchor?: AudioAnchorState;
  iframe?: {
    exists: boolean;
    offsetWidth?: number;
    offsetHeight?: number;
    rect?: { top: number; left: number; width: number; height: number };
  };
  extra?: Record<string, unknown>;
}

const MAX_LOGS = 300;
const logBuffer: BgDiagEvent[] = [];
const mediaSessionRegistrations: Record<string, boolean> = {};

export function recordMediaActionRegistration(action: string, success: boolean) {
  mediaSessionRegistrations[action] = success;
}

export function getYTStateName(state: number | undefined): string | undefined {
  if (state === undefined) return undefined;
  const names: Record<number, string> = {
    [-1]: "UNSTARTED",
    0: "ENDED",
    1: "PLAYING",
    2: "PAUSED",
    3: "BUFFERING",
    5: "CUED",
  };
  return names[state] || `UNKNOWN(${state})`;
}

export function getIframeInfo() {
  if (typeof document === "undefined") return { exists: false };
  const iframe = document.querySelector('iframe[src*="youtube"], #musicflow-yt-container iframe') as HTMLIFrameElement | null;
  if (!iframe) return { exists: false };
  const r = iframe.getBoundingClientRect();
  return {
    exists: true,
    offsetWidth: iframe.offsetWidth,
    offsetHeight: iframe.offsetHeight,
    rect: {
      top: Math.round(r.top),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
    },
  };
}

export function getYTPlayerInfo() {
  let connected = false;
  let state: number | undefined;
  let stateName: string | undefined;
  let currentTime: number | undefined;
  let duration: number | undefined;
  let playbackRate: number | undefined;

  try {
    const store = (window as unknown as { __musicflowStore?: { getState: () => { player: any } } }).__musicflowStore?.getState?.(); // eslint-disable-line @typescript-eslint/no-explicit-any
    const player = store?.player;
    if (player && typeof player.getPlayerState === "function") {
      connected = true;
      state = player.getPlayerState();
      stateName = getYTStateName(state);
      if (typeof player.getCurrentTime === "function") {
        currentTime = Math.round(player.getCurrentTime() * 100) / 100;
      }
      if (typeof player.getDuration === "function") {
        duration = Math.round(player.getDuration() * 100) / 100;
      }
      if (typeof player.getPlaybackRate === "function") {
        playbackRate = player.getPlaybackRate();
      }
    }
  } catch {
    // Ignore player inspection errors
  }

  return { connected, state, stateName, currentTime, duration, playbackRate };
}

export function logBgDiag(
  type: string,
  extra?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  const now = new Date();
  const time = now.toISOString().slice(11, 23); // HH:mm:ss.sss
  const ms = Math.round(performance.now());

  let ytState: number | undefined;
  let ytStateName: string | undefined;

  if (extra && typeof extra.ytState === "number") {
    ytState = extra.ytState;
    ytStateName = getYTStateName(ytState);
  } else {
    const ytInfo = getYTPlayerInfo();
    if (ytInfo.connected) {
      ytState = ytInfo.state;
      ytStateName = ytInfo.stateName;
    }
  }

  const mediaSessionPlaybackState =
    typeof navigator !== "undefined" && "mediaSession" in navigator
      ? navigator.mediaSession.playbackState
      : undefined;

  let isPlaying = false;
  let currentTrack: { videoId: string; title: string } | undefined;

  try {
    const store = (window as unknown as { __musicflowStore?: { getState: () => { isPlaying: boolean; videoId: string; title: string } } }).__musicflowStore?.getState?.();
    if (store) {
      isPlaying = store.isPlaying;
      currentTrack = { videoId: store.videoId, title: store.title };
    }
  } catch {
    // Ignore store read errors
  }

  const entry: BgDiagEvent = {
    time,
    ms,
    type,
    visibilityState: typeof document !== "undefined" ? document.visibilityState : "unknown",
    hasFocus: typeof document !== "undefined" ? document.hasFocus() : false,
    ytState,
    ytStateName,
    mediaSessionPlaybackState,
    currentTrack,
    isPlaying,
    audioAnchor: getAudioAnchorState(),
    iframe: getIframeInfo(),
    extra,
  };

  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }

  // Persist recent logs to sessionStorage so they survive mobile tab suspensions or reloads
  try {
    sessionStorage.setItem("__musicflow_bg_logs", JSON.stringify(logBuffer.slice(-80)));
  } catch {
    // Ignore storage quota errors
  }

  console.log(`[BgDiag ${time}] ${type}:`, entry);
}

export function initBgDiagnostics() {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __musicflowBgDiag?: unknown }).__musicflowBgDiag) return;

  const onVisibilityChange = () => {
    const currentVis = document.visibilityState;
    logBgDiag("visibilitychange", {
      visibilityState: currentVis,
      hidden: document.hidden,
      ytPlayer: getYTPlayerInfo(),
    });

    // Schedule timed snapshot checks when backgrounded
    if (currentVis === "hidden") {
      logBgDiag("bg-check-immediate", {
        ytPlayer: getYTPlayerInfo(),
        audioAnchor: getAudioAnchorState(),
        iframe: getIframeInfo(),
      });

      setTimeout(() => {
        logBgDiag("bg-check-1s", {
          visibilityState: document.visibilityState,
          ytPlayer: getYTPlayerInfo(),
          audioAnchor: getAudioAnchorState(),
          iframe: getIframeInfo(),
        });
      }, 1000);

      setTimeout(() => {
        logBgDiag("bg-check-5s", {
          visibilityState: document.visibilityState,
          ytPlayer: getYTPlayerInfo(),
          audioAnchor: getAudioAnchorState(),
          iframe: getIframeInfo(),
        });
      }, 5000);
    }
  };

  const onPageHide = (e: PageTransitionEvent) => {
    logBgDiag("pagehide", { persisted: e.persisted, ytPlayer: getYTPlayerInfo() });
  };
  const onPageShow = (e: PageTransitionEvent) => {
    logBgDiag("pageshow", { persisted: e.persisted, ytPlayer: getYTPlayerInfo() });
  };
  const onFreeze = () => {
    logBgDiag("freeze", { ytPlayer: getYTPlayerInfo() });
  };
  const onResume = () => {
    logBgDiag("resume", { ytPlayer: getYTPlayerInfo() });
  };
  const onFocus = () => {
    logBgDiag("focus", { visibilityState: document.visibilityState });
  };
  const onBlur = () => {
    logBgDiag("blur", { visibilityState: document.visibilityState });
  };
  const onOnline = () => {
    logBgDiag("online");
  };
  const onOffline = () => {
    logBgDiag("offline");
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("freeze", onFreeze);
  document.addEventListener("resume", onResume);
  window.addEventListener("focus", onFocus);
  window.addEventListener("blur", onBlur);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  (window as unknown as { __musicflowBgDiag: unknown }).__musicflowBgDiag = {
    getLogs: () => [...logBuffer],
    dump: () => {
      console.table(
        logBuffer.map((l) => ({
          time: l.time,
          type: l.type,
          vis: l.visibilityState,
          yt: l.ytStateName,
          playState: l.mediaSessionPlaybackState,
          storePlaying: l.isPlaying,
          anchorPaused: l.audioAnchor?.paused,
          track: l.currentTrack?.title?.substring(0, 20),
        }))
      );
      return logBuffer;
    },
    copyLogs: () => {
      const text = JSON.stringify(logBuffer, null, 2);
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
        console.log("[BgDiag] Logs copied to clipboard!");
      } else {
        console.log(text);
      }
      return `${logBuffer.length} logs copied`;
    },
    clear: () => {
      logBuffer.length = 0;
      try { sessionStorage.removeItem("__musicflow_bg_logs"); } catch {}
    },
    log: logBgDiag,
    get status() {
      const yt = getYTPlayerInfo();
      const anchor = getAudioAnchorState();
      const iframe = getIframeInfo();
      return {
        visibilityState: document.visibilityState,
        documentHidden: document.hidden,
        hasFocus: document.hasFocus(),
        isStandalone:
          window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone === true,
        mediaSession: {
          playbackState: "mediaSession" in navigator ? navigator.mediaSession.playbackState : "N/A",
          title: "mediaSession" in navigator ? navigator.mediaSession.metadata?.title : undefined,
          artist: "mediaSession" in navigator ? navigator.mediaSession.metadata?.artist : undefined,
          artworkCount: "mediaSession" in navigator ? navigator.mediaSession.metadata?.artwork?.length : 0,
          registrations: mediaSessionRegistrations,
        },
        youtubePlayer: yt,
        audioAnchor: anchor,
        iframe: iframe,
        userAgent: navigator.userAgent,
        logCount: logBuffer.length,
      };
    },
  };

  logBgDiag("init", {
    userAgent: navigator.userAgent,
    isStandalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true,
  });
}
