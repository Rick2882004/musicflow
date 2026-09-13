import { create } from "zustand";
import { Track } from "@/types/music";

export interface ListeningSession {
  id: string;
  userUid: string;
  startTime: number;
  endTime: number;
  duration: number; // active playback duration in seconds
  tracks: Track[];
  tracksCount: number;
  completedCount: number;
  skipCount: number;
  artists: string[];
  genres: string[];
  topArtist: string;
  topGenre: string;
  topVibe: string;
  discoveryRatio: number; // 0 - 1
  discoveredArtists: string[];
  replayedFavorites: string[];
}

interface SessionStoreState {
  activeSession: ListeningSession | null;
  completedSessions: ListeningSession[];
  currentUserUid: string;

  setCurrentUserUid: (uid: string) => void;
  rehydrateForUser: (uid: string) => void;
  clearUserSessions: () => void;
  
  startSession: (track: Track, userUid?: string) => ListeningSession;
  recordTrackPlay: (
    track: Track,
    durationSeconds: number,
    isCompleted: boolean,
    isSkip: boolean,
    isDiscovery: boolean,
    isReplay: boolean,
    genre?: string
  ) => void;
  finalizeActiveSession: () => ListeningSession | null;
  saveCompletedSession: (session: ListeningSession) => void;
  deleteSession: (id: string) => void;
}

function getStorageKey(uid: string): string {
  return `musicflow_sessions_${uid || "guest"}`;
}

function loadSessionsFromStorage(uid: string): ListeningSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessionsToStorage(uid: string, sessions: ListeningSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(sessions.slice(0, 100)));
  } catch {
    // quota exceeded or private browsing
  }
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  activeSession: null,
  completedSessions: [],
  currentUserUid: "guest",

  setCurrentUserUid: (uid: string) => {
    const cleanUid = uid || "guest";
    if (get().currentUserUid === cleanUid) return;
    const loaded = loadSessionsFromStorage(cleanUid);
    set({
      currentUserUid: cleanUid,
      completedSessions: loaded,
      activeSession: null,
    });
  },

  rehydrateForUser: (uid: string) => {
    const cleanUid = uid || "guest";
    const loaded = loadSessionsFromStorage(cleanUid);
    set({
      currentUserUid: cleanUid,
      completedSessions: loaded,
    });
  },

  clearUserSessions: () => {
    set({
      activeSession: null,
      completedSessions: [],
      currentUserUid: "guest",
    });
  },

  startSession: (track: Track, userUid?: string) => {
    const uid = userUid || get().currentUserUid || "guest";
    const now = Date.now();
    const newSession: ListeningSession = {
      id: `session_${now}_${Math.random().toString(36).slice(2, 7)}`,
      userUid: uid,
      startTime: now,
      endTime: now,
      duration: 0,
      tracks: [track],
      tracksCount: 1,
      completedCount: 0,
      skipCount: 0,
      artists: track.artist ? [track.artist] : [],
      genres: [],
      topArtist: track.artist || "Unknown Artist",
      topGenre: "Diverse Music",
      topVibe: "Deep Music Flow",
      discoveryRatio: 0,
      discoveredArtists: [],
      replayedFavorites: [],
    };

    set({ activeSession: newSession });
    return newSession;
  },

  recordTrackPlay: (
    track: Track,
    durationSeconds: number,
    isCompleted: boolean,
    isSkip: boolean,
    isDiscovery: boolean,
    isReplay: boolean,
    genre?: string
  ) => {
    const { activeSession, currentUserUid } = get();
    const now = Date.now();

    // If no active session, start one
    const session = activeSession || get().startSession(track, currentUserUid);

    const existingTracks = session.tracks || [];
    const isNewInSession = !existingTracks.some((t) => t.videoId === track.videoId);
    const updatedTracks = isNewInSession ? [...existingTracks, track] : existingTracks;

    // Track artist counts
    const artistCounts: Record<string, number> = {};
    for (const t of updatedTracks) {
      if (t.artist) artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
    }
    const topArtist =
      Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || session.topArtist;

    // Updated artists list
    const artistsSet = new Set(session.artists || []);
    if (track.artist) artistsSet.add(track.artist);

    // Updated genres
    const genresSet = new Set(session.genres || []);
    if (genre) genresSet.add(genre);

    const discovered = new Set(session.discoveredArtists || []);
    if (isDiscovery && track.artist) discovered.add(track.artist);

    const replayed = new Set(session.replayedFavorites || []);
    if (isReplay && track.title) replayed.add(track.title);

    const tracksCount = updatedTracks.length;
    const discoveryRatio = tracksCount > 0 ? discovered.size / tracksCount : 0;

    const updatedSession: ListeningSession = {
      ...session,
      endTime: now,
      duration: session.duration + Math.max(0, Math.round(durationSeconds)),
      tracks: updatedTracks,
      tracksCount,
      completedCount: session.completedCount + (isCompleted ? 1 : 0),
      skipCount: session.skipCount + (isSkip ? 1 : 0),
      artists: Array.from(artistsSet),
      genres: Array.from(genresSet),
      topArtist,
      topGenre: Array.from(genresSet)[0] || session.topGenre,
      discoveryRatio: Math.round(discoveryRatio * 100) / 100,
      discoveredArtists: Array.from(discovered),
      replayedFavorites: Array.from(replayed),
    };

    set({ activeSession: updatedSession });
  },

  finalizeActiveSession: () => {
    const { activeSession, completedSessions, currentUserUid } = get();
    if (!activeSession) return null;

    // Only save meaningful sessions (at least 1 track played with duration >= 10s or 1 completed track)
    if (activeSession.duration >= 10 || activeSession.completedCount > 0 || activeSession.tracksCount >= 2) {
      const updated = [activeSession, ...completedSessions.filter((s) => s.id !== activeSession.id)].slice(0, 100);
      set({
        activeSession: null,
        completedSessions: updated,
      });
      saveSessionsToStorage(currentUserUid, updated);
      return activeSession;
    }

    set({ activeSession: null });
    return null;
  },

  saveCompletedSession: (session: ListeningSession) => {
    const { completedSessions, currentUserUid } = get();
    const updated = [session, ...completedSessions.filter((s) => s.id !== session.id)].slice(0, 100);
    set({ completedSessions: updated });
    saveSessionsToStorage(currentUserUid, updated);
  },

  deleteSession: (id: string) => {
    const { completedSessions, currentUserUid } = get();
    const updated = completedSessions.filter((s) => s.id !== id);
    set({ completedSessions: updated });
    saveSessionsToStorage(currentUserUid, updated);
  },
}));
