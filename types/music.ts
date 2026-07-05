export interface Track {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
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
  name: string;
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
  thumbnail?: string;
  thumbnails?: { url: string; width?: number; height?: number }[];
  songs?: Track[];
}

export interface UserStats {
  totalTracksPlayed: number;
  topArtists: { name: string; playCount: number }[];
  topTracks: { title: string; artist: string; playCount: number }[];
}
