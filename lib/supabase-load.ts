import { supabase } from "./supabase";
import { auth } from "../src/lib/firebase";
import { Track, Playlist } from "@/types/music";

interface LikedSongRow {
  video_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
}

interface RecentSongRow {
  video_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
}

interface PlaylistRow {
  id: number;
  name: string;
  description?: string;
  cover_image?: string | null;
  is_collaborative?: boolean;
}

interface PlaylistSongRow {
  playlist_id: number;
  video_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
}

export async function loadLikedSongs(): Promise<Track[]> {
  const uid = auth.currentUser?.uid;

  if (!uid) return [];

  const { data } = await supabase
    .from("liked_songs")
    .select("*")
    .eq("user_uid", uid);

  return (
    (data as LikedSongRow[])?.map((song) => ({
      videoId: song.video_id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration || 0,
    })) || []
  );
}

export async function loadRecentSongs(): Promise<Track[]> {
  const uid = auth.currentUser?.uid;

  if (!uid) return [];

  const { data } = await supabase
    .from("recently_played")
    .select("*")
    .eq("user_uid", uid)
    .order("created_at", {
      ascending: false,
    });

  return (
    (data as RecentSongRow[])?.map((song) => ({
      videoId: song.video_id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration || 0,
    })) || []
  );
}

export async function loadPlaylists(): Promise<Playlist[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const { data: playlists } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_uid", uid);
    
  const { data: playlistSongs } = await supabase
    .from("playlist_songs")
    .select("*");

  const rows = playlists as PlaylistRow[];
  const songRows = playlistSongs as PlaylistSongRow[];

  return (
    rows?.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || "",
      coverImage: playlist.cover_image || null,
      isCollaborative: playlist.is_collaborative || false,
      songs:
        songRows
          ?.filter((song) => song.playlist_id === playlist.id)
          .map((song) => ({
            videoId: song.video_id,
            title: song.title,
            artist: song.artist,
            thumbnail: song.thumbnail,
            duration: song.duration || 0,
          })) || [],
    })) || []
  );
}