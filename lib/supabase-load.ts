import { supabase } from "./supabase";

export async function loadLikedSongs() {
  const { data } = await supabase
    .from("liked_songs")
    .select("*");

  return data || [];
}

export async function loadRecentSongs() {
  const { data } = await supabase
    .from("recently_played")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  return data || [];
}

export async function loadPlaylists() {
  const { data: playlists } =
    await supabase
      .from("playlists")
      .select("*");

  const { data: playlistSongs } =
    await supabase
      .from("playlist_songs")
      .select("*");

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