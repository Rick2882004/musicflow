import { supabase } from "./supabase";

export async function savePlaylist(
  name: string
) {
  const { data, error } =
    await supabase
      .from("playlists")
      .insert([
        {
          name,
        },
      ])
      .select()
      .single();

  if (error) {
    console.log(
      "PLAYLIST ERROR:"
    );
    console.log(error);
    return null;
  }

  return data;
}

export async function deletePlaylistDB(
  playlistId: number
) {
  const { error } =
    await supabase
      .from("playlists")
      .delete()
      .eq("id", playlistId);

  if (error) {
    console.log(
      "DELETE PLAYLIST ERROR:"
    );
    console.log(error);
  }
}

export async function saveSongToPlaylist(
  playlistId: number,
  song: any
) {
  const { error } =
    await supabase
      .from("playlist_songs")
      .insert([
        {
          playlist_id:
            playlistId,
          video_id:
            song.videoId,
          title:
            song.title,
          artist:
            song.artist,
          thumbnail:
            song.thumbnail,
        },
      ]);

  if (error) {
    console.log(
      "SAVE SONG ERROR:"
    );
    console.log(error);
  }
}

export async function removeSongFromPlaylistDB(
  playlistId: number,
  videoId: string
) {
  const { error } =
    await supabase
      .from("playlist_songs")
      .delete()
      .eq(
        "playlist_id",
        playlistId
      )
      .eq(
        "video_id",
        videoId
      );

  if (error) {
    console.log(
      "REMOVE SONG ERROR:"
    );
    console.log(error);
  }
}