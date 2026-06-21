import { supabase } from "./supabase";

export async function saveRecentSong(
  song: any
) {
  const { error } =
    await supabase
      .from("recently_played")
      .insert([
        {
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
      "RECENT ERROR:"
    );
    console.log(error);
  }
}