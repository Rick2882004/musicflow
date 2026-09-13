import { create } from "zustand";
import { Track } from "@/types/music";
import { usePlayerStore } from "./player-store";

export interface RadioState {
  radioActive: boolean;
  radioSeedTrack: Track | null;
  radioSessionId: string | null;
  tracksAppendedCount: number;
  generationInFlight: boolean;
  seenSessionTrackIds: string[];
  consecutiveSkips: number;

  startRadio: (seedTrack: Track) => void;
  stopRadio: () => void;
  toggleRadio: () => void;
  setGenerationInFlight: (inFlight: boolean) => void;
  recordAppendedTracks: (trackIds: string[]) => void;
  recordRadioSkip: () => void;
  resetRadioSkips: () => void;
}

export const useRadioStore = create<RadioState>((set, get) => ({
  radioActive: false,
  radioSeedTrack: null,
  radioSessionId: null,
  tracksAppendedCount: 0,
  generationInFlight: false,
  seenSessionTrackIds: [],
  consecutiveSkips: 0,

  startRadio: (seedTrack: Track) => {
    if (!seedTrack || !seedTrack.title) return;
    const newSessionId = `radio-session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const seedId = seedTrack.videoId || "";

    set({
      radioActive: true,
      radioSeedTrack: seedTrack,
      radioSessionId: newSessionId,
      tracksAppendedCount: 0,
      generationInFlight: false,
      seenSessionTrackIds: seedId ? [seedId] : [],
      consecutiveSkips: 0,
    });

    // If current player isn't already playing this seed track, start playing it
    const playerState = usePlayerStore.getState();
    if (playerState.videoId !== seedTrack.videoId) {
      playerState.setTrack(
        seedTrack.videoId,
        seedTrack.title,
        seedTrack.artist,
        seedTrack.thumbnail,
        0
      );
    }
  },

  stopRadio: () => {
    set({
      radioActive: false,
      radioSessionId: null,
      generationInFlight: false,
      consecutiveSkips: 0,
    });
  },

  toggleRadio: () => {
    const { radioActive, radioSeedTrack } = get();
    if (radioActive) {
      get().stopRadio();
    } else {
      const playerState = usePlayerStore.getState();
      const currentTrack: Track | null = playerState.videoId
        ? {
            videoId: playerState.videoId,
            title: playerState.title,
            artist: playerState.artist,
            thumbnail: playerState.thumbnail,
          }
        : radioSeedTrack;

      if (currentTrack) {
        get().startRadio(currentTrack);
      }
    }
  },

  setGenerationInFlight: (inFlight: boolean) => {
    set({ generationInFlight: inFlight });
  },

  recordAppendedTracks: (trackIds: string[]) => {
    const { seenSessionTrackIds, tracksAppendedCount } = get();
    const updatedSeen = Array.from(new Set([...seenSessionTrackIds, ...trackIds])).slice(-100);
    set({
      seenSessionTrackIds: updatedSeen,
      tracksAppendedCount: tracksAppendedCount + trackIds.length,
      consecutiveSkips: 0, // Fresh tracks appended, reset skip momentum
    });
  },

  recordRadioSkip: () => {
    set((state) => ({ consecutiveSkips: state.consecutiveSkips + 1 }));
  },

  resetRadioSkips: () => {
    set({ consecutiveSkips: 0 });
  },
}));
