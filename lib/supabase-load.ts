import { supabase } from "./supabase";
import { auth } from "../src/lib/firebase";

export async function loadLikedSongs() {
  const uid = auth.currentUser?.uid;

  if (!uid) return [];

  const { data } = await supabase
    .from("liked_songs")
    .select("*")
    .eq("user_uid", uid);

  return (
    data?.map((song: any) => ({
      videoId: song.video_id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
    })) || []
  );
}

export async function loadRecentSongs() {
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
    data?.map((song: any) => ({
      videoId: song.video_id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
    })) || []
  );
}

export async function loadPlaylists() {
  const { data: playlists } =
    await supabase
      .from("playlists")
      .select("*")
.eq("user_uid", auth.currentUser?.uid)
  const { data: playlistSongs } =
    await supabase
      .from("playlist_songs")
      .select("*")
.eq("user_uid", auth.currentUser?.uid)

  return (
    playlists?.map(
      (playlist: any) => ({
        id: playlist.id,
        name: playlist.name,

        songs:
          playlistSongs
            ?.filter(
              (song: any) =>
                song.playlist_id ===
                playlist.id
            )
            .map(
  (song: any) => ({
    videoId: song.video_id,
    title: song.title,
    artist: song.artist,
    thumbnail: song.thumbnail,
    duration: song.duration,
  })
) || [],
      })
    ) || []
  );
}