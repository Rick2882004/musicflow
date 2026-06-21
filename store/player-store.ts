import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveRecentSong }
from "@/lib/supabase-recent";
import {
  savePlaylist,
  deletePlaylistDB,
} from "@/lib/supabase-playlists";

import {
  saveSongToPlaylist,
  removeSongFromPlaylistDB,
} from "@/lib/supabase-playlist-songs";
import {
  saveLikedSong,
  removeLikedSong,
} from "@/lib/supabase-liked";
interface PlayerState {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
   isPlaying: boolean;
   isShuffle: boolean;
   isRepeat: boolean;

toggleRepeat: () => void;

toggleShuffle: () => void;
currentTime: number;
duration: number;

addSongToPlaylist: (
  playlistId: number,
  song: any
) => Promise<void>;

removeSongFromPlaylist: (
  playlistId: number,
  videoId: string
) => Promise<void>;

deletePlaylist: (
  playlistId: number
) => Promise<void>;

setCurrentTime: (
  time: number
) => void;

setDuration: (
  duration: number
) => void;
player: any;

setPlayer: (
  player: any
) => void;

setIsPlaying: (
  playing: boolean
) => void;
  queue: any[];
  currentIndex: number;
likedSongs: any[];
recentSongs: any[];
playlists: any[];
isQueueOpen: boolean;

toggleQueue: () => void;
setLikedSongs: (
  songs: any[]
) => void;

setRecentSongs: (
  songs: any[]
) => void;

setPlaylists: (
  playlists: any[]
) => void;

toggleLike: (
  song: any
) => Promise<void>;
addRecentSong: (
  song: any
) => void;
addPlaylist: (
  name: string
) => Promise<void>;
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
  clearQueue: () => void;
  
}

export const usePlayerStore =
  create<PlayerState>()(
    persist(
      (set, get) => ({
    videoId: "",
    title: "",
    artist: "",
    thumbnail: "",
   isPlaying: false,
   isShuffle: false,
   isRepeat: false,
currentTime: 0,
duration: 0,

setCurrentTime: (time) =>
  set({
    currentTime: time,
  }),

setDuration: (duration) =>
  set({
    duration,
  }),
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
  toggleShuffle: () =>
  set((state) => ({
    isShuffle: !state.isShuffle,
  })),
  toggleRepeat: () =>
  set((state) => ({
    isRepeat: !state.isRepeat,
  })),
    queue: [],
    currentIndex: 0,
    likedSongs: [],
    recentSongs: [],
    playlists: [],
    isQueueOpen: false,

toggleQueue: () =>
  set((state) => ({
    isQueueOpen:
      !state.isQueueOpen,
  })),
setLikedSongs: (songs) =>
  set({
    likedSongs: songs,
  }),

setRecentSongs: (songs) =>
  set({
    recentSongs: songs,
  }),

setPlaylists: (playlists) =>
  set({
    playlists,
  }),
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

toggleLike: async (
  song
) => {
  const {
    likedSongs,
  } = get();

  const exists =
    likedSongs.find(
      (s) =>
        s.videoId ===
        song.videoId
    );

  if (exists) {
    await removeLikedSong(
      song.videoId
    );

    set({
      likedSongs:
        likedSongs.filter(
          (s) =>
            s.videoId !==
            song.videoId
        ),
    });
  } else {
    await saveLikedSong(
      song
    );

    set({
      likedSongs: [
        ...likedSongs,
        song,
      ],
    });
  }
},
addRecentSong: async (
  song
) => {
  const { recentSongs } =
    get();

  const filtered =
    recentSongs.filter(
      (s) =>
        s.videoId !==
        song.videoId
    );

  set({
    recentSongs: [
      song,
      ...filtered,
    ].slice(0, 20),
  });

  await saveRecentSong(
    song
  );
},
addPlaylist: async (
  name
) => {
  const { playlists } =
    get();

  const saved =
    await savePlaylist(
      name
    );

  if (!saved) return;

  set({
    playlists: [
      ...playlists,
      {
        id: saved.id,
        name: saved.name,
        songs: [],
      },
    ],
  });
},
addSongToPlaylist: async (
  playlistId,
  song
) => {
  const { playlists } =
    get();

  await saveSongToPlaylist(
    playlistId,
    song
  );

  set({
    playlists:
      playlists.map(
        (playlist) =>
          playlist.id ===
          playlistId
            ? {
                ...playlist,
                songs: [
                  ...playlist.songs,
                  song,
                ],
              }
            : playlist
      ),
  });
},
removeSongFromPlaylist:
  async (
    playlistId,
    videoId
  ) => {
    const {
      playlists,
    } = get();

    await removeSongFromPlaylistDB(
      playlistId,
      videoId
    );

    set({
      playlists:
        playlists.map(
          (playlist) =>
            playlist.id ===
            playlistId
              ? {
                  ...playlist,
                  songs:
                    playlist.songs.filter(
                      (
                        song: any
                      ) =>
                        song.videoId !==
                        videoId
                    ),
                }
              : playlist
        ),
    });
  },
deletePlaylist:
  async (
    playlistId
  ) => {
    const {
      playlists,
    } = get();

    await deletePlaylistDB(
      playlistId
    );

    set({
      playlists:
        playlists.filter(
          (
            playlist
          ) =>
            playlist.id !==
            playlistId
        ),
    });
  },
nextTrack: () => {
  const {
    queue,
    currentIndex,
    isShuffle,
  } = get();

  if (isShuffle && queue.length > 0) {
    const randomIndex = Math.floor(
      Math.random() * queue.length
    );

    const next =
      queue[randomIndex];

set({
  videoId: next.videoId,
  title: next.title,
  artist: next.artist,
  thumbnail: next.thumbnail,
  currentIndex: randomIndex,
  isPlaying: true,
});

    return;
  }

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
  currentIndex: currentIndex + 1,
  isPlaying: true,
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
  currentIndex: currentIndex - 1,
  isPlaying: true,
});

      }
    },clearQueue: () =>
  set({
    queue: [],
    currentIndex: 0,
  }),
    }),
    
      {
        name: "musicflow-player",
       partialize: (state) => ({
  likedSongs: state.likedSongs,
  recentSongs: state.recentSongs,
  playlists: state.playlists,
  isShuffle: state.isShuffle,
isRepeat: state.isRepeat,
}),
      }
    )
  );