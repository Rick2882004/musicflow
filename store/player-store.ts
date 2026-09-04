import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveRecentSong } from "@/lib/supabase-recent";
import { savePlaylist, deletePlaylistDB, updatePlaylistDetailsDB } from "@/lib/supabase-playlists";
import { saveSongToPlaylist, removeSongFromPlaylistDB } from "@/lib/supabase-playlist-songs";
import { saveLikedSong, removeLikedSong } from "@/lib/supabase-liked";
import { Track, Playlist, ListeningHistoryEntry, FollowedArtist, SavedAlbum } from "@/types/music";
import { getCachedArtwork, resolveTrackMetadata } from "@/lib/metadata-resolver";

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
  history: ListeningHistoryEntry[];
  playlists: Playlist[];
  followedArtists: FollowedArtist[];
  savedAlbums: SavedAlbum[];
  isQueueOpen: boolean;
  playbackSpeed: number;
  sleepTimer: number | null; // minutes remaining, or null
  volume: number;
  isMuted: boolean;
  smartQueueEnabled: boolean;
  autoPlaySimilar: boolean;

  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlayer: (player: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  setIsPlaying: (playing: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleQueue: () => void;
  toggleSmartQueue: () => void;
  toggleAutoPlaySimilar: () => void;
  
  setLikedSongs: (songs: Track[]) => void;
  setRecentSongs: (songs: Track[]) => void;
  setHistory: (history: ListeningHistoryEntry[]) => void;
  addHistoryEntry: (track: Track, duration?: number, completion?: number) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setFollowedArtists: (artists: FollowedArtist[]) => void;
  setSavedAlbums: (albums: SavedAlbum[]) => void;

  toggleLike: (song: Track) => Promise<void>;
  addRecentSong: (song: Track) => Promise<void>;
  toggleFollowArtist: (artist: { artistId?: string; browseId?: string; name: string; image?: string | null; genre?: string }) => void;
  toggleSaveAlbum: (album: { albumId: string; name: string; artist: string; thumbnail?: string; year?: number; songCount?: number }) => void;
  
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
  reorderPlaylistSongs: (playlistId: number, startIndex: number, endIndex: number) => Promise<void>;

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
      history: [],
      playlists: [],
      followedArtists: [],
      savedAlbums: [],
      isQueueOpen: false,
      playbackSpeed: 1.0,
      sleepTimer: null,
      volume: 80,
      isMuted: false,
      smartQueueEnabled: true,
      autoPlaySimilar: true,


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
      toggleSmartQueue: () => set((state) => ({ smartQueueEnabled: !state.smartQueueEnabled })),
      toggleAutoPlaySimilar: () => set((state) => ({ autoPlaySimilar: !state.autoPlaySimilar })),

      setLikedSongs: (songs) => set({ likedSongs: songs }),
      setRecentSongs: (songs) => set({ recentSongs: songs }),
      setHistory: (history) => set({ history }),
      addHistoryEntry: (track, duration = 0, completion = 0) => {
        const { history } = get();
        const entry: ListeningHistoryEntry = {
          id: `${track.videoId}-${Date.now()}`,
          track,
          timestamp: Date.now(),
          playbackDuration: duration,
          completionPercentage: completion,
        };
        // Keep last 150 history entries
        const updated = [entry, ...history.filter((h) => h.track.videoId !== track.videoId || Date.now() - h.timestamp > 60000)].slice(0, 150);
        set({ history: updated });
      },
      removeHistoryItem: (id) => {
        const { history } = get();
        set({ history: history.filter((h) => h.id !== id) });
      },
      clearHistory: () => set({ history: [] }),
      setPlaylists: (playlists) => set({ playlists }),
      setFollowedArtists: (artists) => set({ followedArtists: artists }),
      setSavedAlbums: (albums) => set({ savedAlbums: albums }),

      toggleFollowArtist: (artist) => {
        const { followedArtists } = get();
        const matchesArtist = (a: FollowedArtist) => {
          if (artist.artistId && a.artistId && a.artistId === artist.artistId) return true;
          if (artist.browseId && a.browseId && a.browseId === artist.browseId) return true;
          return a.name.toLowerCase() === artist.name.toLowerCase();
        };

        const exists = followedArtists.some(matchesArtist);
        if (exists) {
          set({
            followedArtists: followedArtists.filter((a) => !matchesArtist(a)),
          });
        } else {
          set({
            followedArtists: [
              { ...artist, followedAt: Date.now() },
              ...followedArtists,
            ],
          });
        }
      },

      toggleSaveAlbum: (album) => {
        const { savedAlbums } = get();
        const exists = savedAlbums.some((a) => a.albumId === album.albumId);
        if (exists) {
          set({
            savedAlbums: savedAlbums.filter((a) => a.albumId !== album.albumId),
          });
        } else {
          set({
            savedAlbums: [
              { ...album, savedAt: Date.now() },
              ...savedAlbums,
            ],
          });
        }
      },

      setTrack: (videoId, title, artist, thumbnail, index = 0) => {
        const cachedArt = getCachedArtwork(title, artist, videoId) || thumbnail;
        const track: Track = { videoId, title, artist, thumbnail: cachedArt };
        get().addRecentSong(track);
        get().addHistoryEntry(track, 0, 0);
        set({
          videoId,
          title,
          artist,
          thumbnail: cachedArt,
          currentIndex: index,
          isPlaying: true,
        });

        // Asynchronously resolve official iTunes high-res artwork & metadata
        if (title) {
          void resolveTrackMetadata({ videoId, title, artist, thumbnail }).then((res) => {
            if (res && res.artworkUrl && get().videoId === videoId) {
              set({ thumbnail: res.artworkUrl });
              const currentRecents = get().recentSongs;
              const updatedRecents = currentRecents.map((s) =>
                s.videoId === videoId ? { ...s, thumbnail: res.artworkUrl } : s
              );
              set({ recentSongs: updatedRecents });
            }
          });
        }
      },

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

      addRecentSong: async (song: Track) => {
        const { recentSongs } = get();
        const filtered = recentSongs.filter((s) => s.videoId !== song.videoId);
        const updated = [song, ...filtered].slice(0, 20);

        set({ recentSongs: updated });
        await saveRecentSong(song);
      },

      addPlaylist: async (name) => {
        const { playlists } = get();
        const trimmed = name.trim();
        if (!trimmed) return;

        let savedId = Date.now();
        let savedName = trimmed;
        try {
          const saved = await savePlaylist(trimmed);
          if (saved) {
            savedId = saved.id || savedId;
            savedName = saved.name || savedName;
          }
        } catch {
          // Fallback to local ID
        }

        set({
          playlists: [
            ...playlists,
            {
              id: savedId,
              name: savedName,
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

        try {
          await updatePlaylistDetailsDB(playlistId, dbDetails);
        } catch {
          // Fallback to local store
        }

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
        try {
          await saveSongToPlaylist(playlistId, song);
        } catch {
          // Fallback to local store
        }

        set({
          playlists: playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  songs: [...(playlist.songs || []).filter((s) => s.videoId !== song.videoId), song],
                }
              : playlist
          ),
        });
      },

      removeSongFromPlaylist: async (playlistId, videoId) => {
        const { playlists } = get();
        try {
          await removeSongFromPlaylistDB(playlistId, videoId);
        } catch {
          // Fallback to local store
        }

        set({
          playlists: playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  songs: (playlist.songs || []).filter((song) => song.videoId !== videoId),
                }
              : playlist
          ),
        });
      },

      reorderPlaylistSongs: async (playlistId, startIndex, endIndex) => {
        const { playlists } = get();
        const playlist = playlists.find((p) => p.id === playlistId);
        if (!playlist || !playlist.songs) return;

        const result = Array.from(playlist.songs);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        set({
          playlists: playlists.map((p) =>
            p.id === playlistId ? { ...p, songs: result } : p
          ),
        });
      },

      deletePlaylist: async (playlistId) => {
        const { playlists } = get();
        try {
          await deletePlaylistDB(playlistId);
        } catch {
          // Fallback to local store
        }

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
          get().setTrack(next.videoId, next.title, next.artist, next.thumbnail, randomIndex);
          return;
        }

        if (currentIndex < queue.length - 1) {
          const nextIndex = currentIndex + 1;
          const next = queue[nextIndex];
          get().setTrack(next.videoId, next.title, next.artist, next.thumbnail, nextIndex);
        }
      },

      prevTrack: () => {
        const { queue, currentIndex } = get();
        if (queue.length === 0) return;

        if (currentIndex > 0) {
          const prevIndex = currentIndex - 1;
          const prev = queue[prevIndex];
          get().setTrack(prev.videoId, prev.title, prev.artist, prev.thumbnail, prevIndex);
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
        history: state.history,
        playlists: state.playlists,
        followedArtists: state.followedArtists,
        savedAlbums: state.savedAlbums,
        isShuffle: state.isShuffle,
        isRepeat: state.isRepeat,
        playbackSpeed: state.playbackSpeed,
        videoId: state.videoId,
        title: state.title,
        artist: state.artist,
        thumbnail: state.thumbnail,
        duration: state.duration,
        queue: state.queue,
        currentIndex: state.currentIndex,
        volume: state.volume,
        isMuted: state.isMuted,
        smartQueueEnabled: state.smartQueueEnabled,
        autoPlaySimilar: state.autoPlaySimilar,
      }),
    }
  )
);