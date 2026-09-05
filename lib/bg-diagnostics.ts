/**
 * Background Playback Diagnostic Logger for Chrome Android / Mobile Browsers.
 * Exposes window.__musicflowBgDiag to trace the exact sequence of lifecycle,
 * visibility, YouTube player, and MediaSession state changes.
 */

export interface BgDiagEvent {
  time: string;
  ms: number;
  type: string;
  visibilityState: string;
  ytState?: number;
  ytStateName?: string;
  mediaSessionPlaybackState?: string;
  currentTrack?: { videoId: string; title: string };
  isPlaying: boolean;
  extra?: Record<string, unknown>;
}

const MAX_LOGS = 200;
const logBuffer: BgDiagEvent[] = [];

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
    const names: Record<number, string> = {
      [-1]: "UNSTARTED",
      0: "ENDED",
      1: "PLAYING",
      2: "PAUSED",
      3: "BUFFERING",
      5: "CUED",
    };
    ytStateName = names[ytState] || `UNKNOWN(${ytState})`;
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
    ytState,
    ytStateName,
    mediaSessionPlaybackState,
    currentTrack,
    isPlaying,
    extra,
  };

  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }

  console.log(`[BgDiag ${time}] ${type}:`, entry);
}

export function initBgDiagnostics() {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __musicflowBgDiag?: unknown }).__musicflowBgDiag) return;

  const onVisibilityChange = () => {
    logBgDiag("visibilitychange", { visibilityState: document.visibilityState });
  };
  const onPageHide = (e: PageTransitionEvent) => {
    logBgDiag("pagehide", { persisted: e.persisted });
  };
  const onPageShow = (e: PageTransitionEvent) => {
    logBgDiag("pageshow", { persisted: e.persisted });
  };
  const onFreeze = () => {
    logBgDiag("freeze");
  };
  const onResume = () => {
    logBgDiag("resume");
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
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  (window as unknown as { __musicflowBgDiag: unknown }).__musicflowBgDiag = {
    getLogs: () => [...logBuffer],
    dump: () => console.table(logBuffer),
    clear: () => { logBuffer.length = 0; },
    log: logBgDiag,
    get status() {
      return {
        visibilityState: document.visibilityState,
        mediaSessionPlaybackState:
          "mediaSession" in navigator ? navigator.mediaSession.playbackState : "N/A",
        isStandalone:
          window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone === true,
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
