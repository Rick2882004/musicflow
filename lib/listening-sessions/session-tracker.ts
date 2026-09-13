import { Track } from "@/types/music";
import { useSessionStore, ListeningSession } from "@/store/session-store";
import { usePlayerStore } from "@/store/player-store";

const INACTIVITY_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes inactivity ends session

let lastActivityTimestamp = 0;
let currentTrackStartTime = 0;

export function inferTrackGenre(track: Track): string {
  const text = `${track.title || ""} ${track.artist || ""}`.toLowerCase();
  if (
    text.includes("arijit") ||
    text.includes("atif") ||
    text.includes("shreya") ||
    text.includes("kk") ||
    text.includes("bollywood") ||
    text.includes("pritam")
  ) {
    return "Bollywood";
  }
  if (
    text.includes("dhillon") ||
    text.includes("diljit") ||
    text.includes("aujla") ||
    text.includes("punjabi") ||
    text.includes("sidhu")
  ) {
    return "Punjabi";
  }
  if (text.includes("lofi") || text.includes("chill") || text.includes("beats") || text.includes("ambient")) {
    return "Lo-Fi & Chill";
  }
  if (text.includes("rock") || text.includes("queen") || text.includes("guitar")) {
    return "Rock";
  }
  if (text.includes("piano") || text.includes("classical") || text.includes("orchestra")) {
    return "Classical & Instrumental";
  }
  if (
    text.includes("taylor") ||
    text.includes("sheeran") ||
    text.includes("weeknd") ||
    text.includes("pop") ||
    text.includes("billie")
  ) {
    return "Pop";
  }
  return "Indie & Pop";
}

export function inferSessionVibe(hour: number, dominantGenre: string): string {
  if (hour >= 22 || hour < 5) {
    return dominantGenre.includes("Lo-Fi") || dominantGenre.includes("Classical")
      ? "Midnight Ambient Flow"
      : "Late Night / Chill";
  }
  if (hour >= 5 && hour < 11) {
    return "Morning Energy & Focus";
  }
  if (hour >= 11 && hour < 17) {
    return "Daytime Focus & Flow";
  }
  return "Evening Wind Down";
}

export class SessionTracker {
  /**
   * Called when a track begins playing
   */
  static onTrackStart(track: Track, userUid?: string): void {
    const now = Date.now();
    const sessionStore = useSessionStore.getState();

    // Check inactivity threshold
    if (lastActivityTimestamp > 0 && now - lastActivityTimestamp > INACTIVITY_THRESHOLD_MS) {
      // Inactivity exceeded -> finalize previous session
      sessionStore.finalizeActiveSession();
    }

    lastActivityTimestamp = now;
    currentTrackStartTime = now;

    // Ensure session is running
    if (!sessionStore.activeSession) {
      sessionStore.startSession(track, userUid);
    }
  }

  /**
   * Called when a track transitions, pauses, skips, or finishes
   */
  static onTrackEnd(
    track: Track,
    playedDurationSeconds: number,
    totalDurationSeconds: number,
    isSkip: boolean
  ): void {
    if (!track) return;
    const now = Date.now();
    lastActivityTimestamp = now;

    const sessionStore = useSessionStore.getState();
    const playerStore = usePlayerStore.getState();

    const duration = Math.max(
      0,
      playedDurationSeconds > 0
        ? playedDurationSeconds
        : currentTrackStartTime > 0
        ? (now - currentTrackStartTime) / 1000
        : 0
    );

    const isCompleted =
      !isSkip &&
      (duration >= 120 ||
        (totalDurationSeconds > 0 && duration >= totalDurationSeconds * 0.75));

    // Determine discovery vs familiarity
    const isLiked = (playerStore.likedSongs || []).some((s) => s.videoId === track.videoId);
    const pastReplays = (playerStore.history || []).filter(
      (h) => h.track.videoId === track.videoId
    ).length;
    const isReplay = pastReplays >= 2 || isLiked;
    const isDiscovery = !isLiked && pastReplays <= 1;

    const genre = inferTrackGenre(track);

    sessionStore.recordTrackPlay(
      track,
      duration,
      isCompleted,
      isSkip,
      isDiscovery,
      isReplay,
      genre
    );

    currentTrackStartTime = 0;
  }

  /**
   * Called when app enters background or explicit finalize requested
   */
  static finalizeSession(): ListeningSession | null {
    return useSessionStore.getState().finalizeActiveSession();
  }
}
