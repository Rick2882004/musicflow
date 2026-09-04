export interface Track {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
  album?: string;
  albumId?: string;
}

export interface Playlist {
  id: number;
  name: string;
  songs: Track[];
  description?: string | null;
  coverImage?: string | null;
  isCollaborative?: boolean;
  user_uid?: string;
}

export interface Artist {
  id?: string;
  artistId?: string;
  browseId?: string;
  name: string;
  genre?: string;
  source?: "itunes" | "ytmusic";
  image?: string | null;
  thumbnails?: { url: string; width?: number; height?: number }[];
  banner?: string | null;
  bio?: string | null;
  description?: string | null;
  popularity?: number;
  monthlyListeners?: string;
  songs?: Track[];
  albums?: Album[];
  singles?: Album[];
  compilations?: Album[];
  similarArtists?: { artistId: string; name: string; thumbnails?: { url: string }[] }[];
}

export interface Album {
  albumId: string;
  name: string;
  playlistId?: string;
  artist: {
    name: string;
    artistId?: string | null;
  };
  year?: number;
  trackCount?: number;
  thumbnail?: string;
  thumbnails?: { url: string; width?: number; height?: number }[];
  genre?: string;
  copyright?: string;
  songs?: Track[];
}

export interface FollowedArtist {
  artistId?: string;
  browseId?: string;
  name: string;
  image?: string | null;
  genre?: string;
  followedAt?: number;
}

export interface SavedAlbum {
  albumId: string;
  browseId?: string;
  name: string;
  artist: string;
  thumbnail?: string;
  year?: number;
  songCount?: number;
  savedAt?: number;
}

export interface UserStats {
  totalTracksPlayed: number;
  topArtists: { name: string; playCount: number }[];
  topTracks: { title: string; artist: string; playCount: number }[];
}

export interface ListeningHistoryEntry {
  id: string;
  track: Track;
  timestamp: number; // Date.now() timestamp
  playbackDuration: number; // seconds listened
  completionPercentage: number; // 0-100
}

export interface ChartTrack extends Track {
  rank: number;
  previousRank?: number;
  peakRank?: number;
  movement?: "up" | "down" | "same" | "new";
  playsCount?: string;
}

export interface ChartArtist {
  rank: number;
  name: string;
  image?: string;
  monthlyListeners?: string;
  movement?: "up" | "down" | "same" | "new";
}

export interface ChartAlbum {
  rank: number;
  albumId: string;
  name: string;
  artist: string;
  thumbnail: string;
  year?: number;
  movement?: "up" | "down" | "same" | "new";
}

export interface GenreDetail {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  color: string;
  gradient: string;
  featuredArtists: string[];
  popularSearchQueries: string[];
}

export type DiscoveryModeType =
  | "surprise"
  | "quick-mix"
  | "deep-focus"
  | "mood"
  | "artist-radio"
  | "song-radio"
  | "genre-radio"
  | "similar";

export interface ShareCardData {
  type: "track" | "album" | "artist" | "playlist" | "profile";
  title: string;
  subtitle?: string;
  image?: string;
  url: string;
}

