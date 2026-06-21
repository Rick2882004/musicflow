import { supabase } from "./supabase";

export async function saveSongToPlaylist(
  playlistId: number,
  song: any
) {
  const { error } = await supabase
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

  if (error) {
    console.log(
      "PLAYLIST SONG ERROR:"
    );
    console.log(error);
  }
}

export async function removeSongFromPlaylistDB(
  playlistId: number,
  videoId: string
) {
  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("video_id", videoId);

  if (error) {
    console.log(
      "REMOVE SONG ERROR:"
    );

    console.log(error);
  }
}