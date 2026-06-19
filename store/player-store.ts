import { create } from "zustand";

interface PlayerState {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
   isPlaying: boolean;

player: any;

setPlayer: (
  player: any
) => void;

setIsPlaying: (
  playing: boolean
) => void;
  queue: any[];
  currentIndex: number;

  setTrack: (
    videoId: string,
    title: string,
    artist: string,
    thumbnail: string,
    index?: number
  ) => void;

  setQueue: (tracks: any[]) => void;

  nextTrack: () => void;

  prevTrack: () => void;
  
}

export const usePlayerStore =
  create<PlayerState>((set, get) => ({
    videoId: "",
    title: "",
    artist: "",
    thumbnail: "",
   isPlaying: false,

player: null,

setPlayer: (
  player
) =>
  set({
    player,
  }),

setIsPlaying: (
  playing
) =>
  set({
    isPlaying: playing,
  }),
    queue: [],
    currentIndex: 0,

    setTrack: (
  videoId,
  title,
  artist,
  thumbnail,
  index = 0
) =>
  set({
    videoId,
    title,
    artist,
    thumbnail,
    currentIndex: index,
    isPlaying: true,
  }),

    setQueue: (tracks) =>
      set({
        queue: tracks,
      }),

    nextTrack: () => {
      const {
        queue,
        currentIndex,
      } = get();

      if (
        currentIndex <
        queue.length - 1
      ) {
        const next =
          queue[currentIndex + 1];

        set({
          videoId: next.videoId,
          title: next.title,
          artist: next.artist,
          thumbnail: next.thumbnail,
          currentIndex:
            currentIndex + 1,
        });
      }
    },

    prevTrack: () => {
      const {
        queue,
        currentIndex,
      } = get();

      if (currentIndex > 0) {
        const prev =
          queue[currentIndex - 1];

        set({
          videoId: prev.videoId,
          title: prev.title,
          artist: prev.artist,
          thumbnail: prev.thumbnail,
          currentIndex:
            currentIndex - 1,
        });
      }
    },
  }));