import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveRecentSong } from "@/lib/supabase-recent";
import { savePlaylist, deletePlaylistDB, updatePlaylistDetailsDB } from "@/lib/supabase-playlists";
import { saveSongToPlaylist, removeSongFromPlaylistDB } from "@/lib/supabase-playlist-songs";
import { saveLikedSong, removeLikedSong } from "@/lib/supabase-liked";
import { Track, Playlist } from "@/types/music";

interface PlayerState {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  isPlaying: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  currentTime: number;
  duration: number;
  player: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  queue: Track[];
  currentIndex: number;
  likedSongs: Track[];
  recentSongs: Track[];
  playlists: Playlist[];
  isQueueOpen: boolean;
  playbackSpeed: number;
  sleepTimer: number | null; // minutes remaining, or null
  volume: number;
  isMuted: boolean;

  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlayer: (player: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  setIsPlaying: (playing: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleQueue: () => void;
  
  setLikedSongs: (songs: Track[]) => void;
  setRecentSongs: (songs: Track[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;

  toggleLike: (song: Track) => Promise<void>;
  addRecentSong: (song: Track) => Promise<void>;
  
  addPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (playlistId: number) => Promise<void>;
  updatePlaylist: (
    playlistId: number,
    details: {
      name?: string;
      description?: string;
      isCollaborative?: boolean;
      coverImage?: string;
    }
  ) => Promise<void>;
  addSongToPlaylist: (playlistId: number, song: Track) => Promise<void>;
  removeSongFromPlaylist: (playlistId: number, videoId: string) => Promise<void>;

  setTrack: (
    videoId: string,
    title: string,
    artist: string,
    thumbnail: string,
    index?: number
  ) => void;
  setQueue: (tracks: Track[]) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  clearQueue: () => void;
  
  setPlaybackSpeed: (speed: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
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
      player: null,
      queue: [],
      currentIndex: 0,
      likedSongs: [],
      recentSongs: [],
      playlists: [],
      isQueueOpen: false,
      playbackSpeed: 1.0,
      sleepTimer: null,
      volume: 80,
      isMuted: false,

      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setPlayer: (player) => {
        set({ player });
        if (player) {
          if (player.setPlaybackRate) {
            player.setPlaybackRate(get().playbackSpeed);
          }
          if (player.setVolume) {
            player.setVolume(get().volume);
          }
          if (get().isMuted && player.mute) {
            player.mute();
          } else if (!get().isMuted && player.unMute) {
            player.unMute();
          }
        }
      },
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
      toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),
      toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),

      setLikedSongs: (songs) => set({ likedSongs: songs }),
      setRecentSongs: (songs) => set({ recentSongs: songs }),
      setPlaylists: (playlists) => set({ playlists }),

      setTrack: (videoId, title, artist, thumbnail, index = 0) =>
        set({
          videoId,
          title,
          artist,
          thumbnail,
          currentIndex: index,
          isPlaying: true,
        }),

      setQueue: (tracks) => set({ queue: tracks }),

      reorderQueue: (startIndex, endIndex) => {
        const { queue, currentIndex } = get();
        const result = Array.from(queue);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        // Adjust currentIndex if the playing song moved
        let newIndex = currentIndex;
        if (currentIndex === startIndex) {
          newIndex = endIndex;
        } else if (currentIndex > startIndex && currentIndex <= endIndex) {
          newIndex = currentIndex - 1;
        } else if (currentIndex < startIndex && currentIndex >= endIndex) {
          newIndex = currentIndex + 1;
        }

        set({ queue: result, currentIndex: newIndex });
      },

      toggleLike: async (song) => {
        const { likedSongs } = get();
        const exists = likedSongs.some((s) => s.videoId === song.videoId);

        // Instant Optimistic UI Update
        if (exists) {
          const nextLiked = likedSongs.filter((s) => s.videoId !== song.videoId);
          set({ likedSongs: nextLiked });
          try {
            await removeLikedSong(song.videoId);
          } catch (err) {
            console.error("Failed to remove liked song, rolling back:", err);
            set({ likedSongs });
          }
        } else {
          const nextLiked = [...likedSongs, song];
          set({ likedSongs: nextLiked });
          try {
            await saveLikedSong(song);
          } catch (err) {
            console.error("Failed to save liked song, rolling back:", err);
            set({ likedSongs });
          }
        }
      },

      addRecentSong: async (song) => {
        const { recentSongs } = get();
        const filtered = recentSongs.filter((s) => s.videoId !== song.videoId);
        const updated = [song, ...filtered].slice(0, 20);

        set({ recentSongs: updated });
        await saveRecentSong(song);
      },

      addPlaylist: async (name) => {
        const { playlists } = get();
        const saved = await savePlaylist(name);
        if (!saved) return;

        set({
          playlists: [
            ...playlists,
            {
              id: saved.id,
              name: saved.name,
              songs: [],
              description: "",
              coverImage: null,
              isCollaborative: false,
            },
          ],
        });
      },

      updatePlaylist: async (playlistId, details) => {
        const { playlists } = get();
        
        const dbDetails: {
          name?: string;
          description?: string;
          is_collaborative?: boolean;
          cover_image?: string;
        } = {};
        if (details.name !== undefined) dbDetails.name = details.name;
        if (details.description !== undefined) dbDetails.description = details.description;
        if (details.isCollaborative !== undefined) dbDetails.is_collaborative = details.isCollaborative;
        if (details.coverImage !== undefined) dbDetails.cover_image = details.coverImage;

        await updatePlaylistDetailsDB(playlistId, dbDetails);

        set({
          playlists: playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  name: details.name !== undefined ? details.name : p.name,
                  description: details.description !== undefined ? details.description : p.description,
                  isCollaborative: details.isCollaborative !== undefined ? details.isCollaborative : p.isCollaborative,
                  coverImage: details.coverImage !== undefined ? details.coverImage : p.coverImage,
                }
              : p
          ),
        });
      },

      addSongToPlaylist: async (playlistId, song) => {
        const { playlists } = get();
        await saveSongToPlaylist(playlistId, song);

        set({
          playlists: playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  songs: [...playlist.songs, song],
                }
              : playlist
          ),
        });
      },

      removeSongFromPlaylist: async (playlistId, videoId) => {
        const { playlists } = get();
        await removeSongFromPlaylistDB(playlistId, videoId);

        set({
          playlists: playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  songs: playlist.songs.filter((song) => song.videoId !== videoId),
                }
              : playlist
          ),
        });
      },

      deletePlaylist: async (playlistId) => {
        const { playlists } = get();
        await deletePlaylistDB(playlistId);

        set({
          playlists: playlists.filter((playlist) => playlist.id !== playlistId),
        });
      },

      nextTrack: () => {
        const { queue, currentIndex, isShuffle } = get();
        if (queue.length === 0) return;

        if (isShuffle) {
          const randomIndex = Math.floor(Math.random() * queue.length);
          const next = queue[randomIndex];
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

        if (currentIndex < queue.length - 1) {
          const next = queue[currentIndex + 1];
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
        const { queue, currentIndex } = get();
        if (queue.length === 0) return;

        if (currentIndex > 0) {
          const prev = queue[currentIndex - 1];
          set({
            videoId: prev.videoId,
            title: prev.title,
            artist: prev.artist,
            thumbnail: prev.thumbnail,
            currentIndex: currentIndex - 1,
            isPlaying: true,
          });
        }
      },

      clearQueue: () => set({ queue: [], currentIndex: 0 }),

      setPlaybackSpeed: (speed) => {
        set({ playbackSpeed: speed });
        const { player } = get();
        if (player && player.setPlaybackRate) {
          player.setPlaybackRate(speed);
        }
      },

      setSleepTimer: (minutes) => set({ sleepTimer: minutes }),
      setVolume: (volume) => {
        set({ volume });
        const { player } = get();
        if (player && player.setVolume) {
          player.setVolume(volume);
        }
      },
      setIsMuted: (isMuted) => {
        set({ isMuted });
        const { player } = get();
        if (player) {
          if (isMuted && player.mute) {
            player.mute();
          } else if (!isMuted && player.unMute) {
            player.unMute();
          }
        }
      },
    }),
    {
      name: "musicflow-player",
      partialize: (state) => ({
        likedSongs: state.likedSongs,
        recentSongs: state.recentSongs,
        playlists: state.playlists,
        isShuffle: state.isShuffle,
        isRepeat: state.isRepeat,
        playbackSpeed: state.playbackSpeed,
        videoId: state.videoId,
        title: state.title,
        artist: state.artist,
        thumbnail: state.thumbnail,
        currentTime: state.currentTime,
        duration: state.duration,
        queue: state.queue,
        currentIndex: state.currentIndex,
        volume: state.volume,
        isMuted: state.isMuted,
      }),
    }
  )
);