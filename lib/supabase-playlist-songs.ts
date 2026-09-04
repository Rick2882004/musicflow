import { supabase } from "./supabase";
import { Track } from "@/types/music";

export async function saveSongToPlaylist(
  playlistId: number,
  song: Track
) {
  try {
    await supabase
      .from("playlist_songs")
      .insert([
        {
          playlist_id: playlistId,
          video_id: song.videoId,
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail,
          duration: song.duration,
        },
      ]);
  } catch {
    // Graceful offline fallback
  }
}

export async function removeSongFromPlaylistDB(
  playlistId: number,
  videoId: string
) {
  try {
    await supabase
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("video_id", videoId);
  } catch {
    // Graceful offline fallback
  }
}