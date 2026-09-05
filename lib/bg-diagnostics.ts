/**
 * Background Playback Diagnostic Logger for Chrome Android / Mobile Browsers.
 * Exposes window.__musicflowBgDiag to trace the exact sequence of lifecycle,
 * visibility, YouTube player, and MediaSession state changes.
 */

import {
  getAudioAnchorState,
  AudioAnchorState,
  setAudioAnchorMode,
  getAudioAnchorMode,
  playAudioAnchor,
} from "./audio-anchor";

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
  userActivation?: { isActive: boolean; hasBeenActive: boolean };
  iframe?: {
    exists: boolean;
    offsetWidth?: number;
    offsetHeight?: number;
    rect?: { top: number; left: number; width: number; height: number };
  };
  extra?: Record<string, unknown>;
}

const MAX_LOGS = 600;
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
    userActivation:
      typeof navigator !== "undefined" && "userActivation" in navigator
        ? {
            isActive: (navigator as unknown as { userActivation?: { isActive: boolean; hasBeenActive: boolean } }).userActivation?.isActive ?? false,
            hasBeenActive: (navigator as unknown as { userActivation?: { isActive: boolean; hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? false,
          }
        : undefined,
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
        logBgDiag("bg-check-100ms", {
          visibilityState: document.visibilityState,
          ytPlayer: getYTPlayerInfo(),
          audioAnchor: getAudioAnchorState(),
          iframe: getIframeInfo(),
        });
      }, 100);

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

  // Heartbeat Stagnation & Audio Cutout Detector (checks every 1000ms)
  let prevPlayerTime: number | undefined;
  let stagnantCount = 0;

  setInterval(() => {
    try {
      const yt = getYTPlayerInfo();
      let isPlaying = false;
      try {
        const store = (window as unknown as { __musicflowStore?: { getState: () => { isPlaying: boolean } } }).__musicflowStore?.getState?.();
        isPlaying = store?.isPlaying ?? false;
      } catch { /* ignore */ }

      if (isPlaying && yt.connected) {
        const curTime = yt.currentTime;
        if (curTime !== undefined && prevPlayerTime !== undefined) {
          if (Math.abs(curTime - prevPlayerTime) < 0.05 && yt.state === 1) {
            stagnantCount++;
            if (stagnantCount === 2) {
              logBgDiag("audio-stagnation-cutout", {
                frozenAtTime: curTime,
                ytState: yt.state,
                ytStateName: yt.stateName,
                audioAnchor: getAudioAnchorState(),
                visibilityState: document.visibilityState,
                hasFocus: document.hasFocus(),
              });
            }
          } else {
            stagnantCount = 0;
          }
        }
        prevPlayerTime = curTime;
      } else {
        stagnantCount = 0;
        prevPlayerTime = yt.currentTime;
      }
    } catch { /* ignore */ }
  }, 1000);

  function runCutoutAnalysis() {
    if (logBuffer.length === 0) {
      return {
        detected: false,
        summary: "No logs recorded yet.",
        category: "NONE",
        firstEvent: null,
      };
    }

    let cutoutIdx = -1;
    for (let i = 0; i < logBuffer.length; i++) {
      const ev = logBuffer[i];
      if (
        ev.type === "audio-stagnation-cutout" ||
        ev.type === "yt-error" ||
        (ev.type === "yt-state-change" && (ev.ytState === 2 || ev.ytState === 3)) ||
        (ev.type === "store-setIsPlaying" && ev.extra?.playing === false) ||
        ev.type === "audio-anchor-pause-called" ||
        ev.type === "call-pauseVideo" ||
        (ev.type === "mediasession-playbackstate-synced" && ev.extra?.playbackState === "paused") ||
        ev.type === "freeze"
      ) {
        cutoutIdx = i;
        break;
      }
    }

    if (cutoutIdx === -1) {
      return {
        detected: false,
        summary: "No playback cutout detected in recorded logs so far.",
        category: "NONE",
        firstEvent: null,
      };
    }

    const firstEvent = logBuffer[cutoutIdx];
    const secondEvent = cutoutIdx + 1 < logBuffer.length ? logBuffer[cutoutIdx + 1] : null;

    let category: "A" | "B" | "C" | "D" | "E" | "F" | "G" = "G";
    let categoryDescription = "";

    if (firstEvent.type === "yt-state-change" && (firstEvent.ytState === 2 || firstEvent.ytState === 3)) {
      category = "A";
      categoryDescription = `A: YouTube changed to ${firstEvent.ytStateName} (${firstEvent.ytState})`;
    } else if (firstEvent.type === "store-setIsPlaying" && firstEvent.extra?.playing === false) {
      category = "B";
      categoryDescription = `B: MusicFlow changed isPlaying to false (source: ${firstEvent.extra?.callerStack || "unknown"})`;
    } else if (firstEvent.type === "call-pauseVideo") {
      category = "B";
      categoryDescription = `B: MusicFlow called pauseVideo() (source: ${firstEvent.extra?.source || "unknown"})`;
    } else if (firstEvent.type === "audio-anchor-pause-called") {
      category = "C";
      categoryDescription = `C: MusicFlow paused the audio anchor (caller: ${firstEvent.extra?.callerStack || "unknown"})`;
    } else if (firstEvent.type === "mediasession-playbackstate-synced" && firstEvent.extra?.playbackState === "paused") {
      category = "D";
      categoryDescription = "D: MediaSession changed to paused";
    } else if (firstEvent.type === "blur" || firstEvent.type === "visibilitychange" || firstEvent.type === "freeze" || firstEvent.type === "pagehide") {
      category = "E";
      categoryDescription = `E: Browser lifecycle event occurred (${firstEvent.type})`;
    } else if (firstEvent.type === "yt-error") {
      category = "F";
      categoryDescription = `F: YouTube emitted error code ${firstEvent.extra?.error}`;
    } else if (firstEvent.type === "audio-stagnation-cutout") {
      category = "G";
      categoryDescription = `G: None of the above — audio simply became silent (currentTime frozen at ${firstEvent.extra?.frozenAtTime}s while state was PLAYING)`;
    }

    const secondDesc = secondEvent ? `"${secondEvent.type}" at ${secondEvent.time}` : "no subsequent event";
    const summary = `At timestamp ${firstEvent.time}, event "${firstEvent.type}" (${categoryDescription}) happened first, followed by ${secondDesc}.`;

    return {
      detected: true,
      category,
      categoryDescription,
      firstEvent,
      secondEvent,
      summary,
      timeline: logBuffer.slice(Math.max(0, cutoutIdx - 2), Math.min(logBuffer.length, cutoutIdx + 6)),
    };
  }

  (window as unknown as { __musicflowBgDiag: unknown }).__musicflowBgDiag = {
    getLogs: () => [...logBuffer],
    analyzeCutout: () => {
      const res = runCutoutAnalysis();
      console.log(`[BgDiag Cutout Analysis] ${res.summary}`);
      return res;
    },
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
          extra: l.extra ? JSON.stringify(l.extra) : "",
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
    setAnchorMode: (mode: "silent" | "audible") => {
      setAudioAnchorMode(mode);
      return `Anchor mode set to: ${mode}`;
    },
    get anchorMode() {
      return getAudioAnchorMode();
    },
    testAudibleAnchor: () => {
      setAudioAnchorMode("audible");
      playAudioAnchor();
      return "Testing audible anchor (40Hz sub-bass PCM wave)... check window.__musicflowBgDiag.status";
    },
    testSilentAnchor: () => {
      setAudioAnchorMode("silent");
      playAudioAnchor();
      return "Testing silent anchor (/silence.wav)... check window.__musicflowBgDiag.status";
    },
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
        cutoutAnalysis: runCutoutAnalysis().summary,
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
