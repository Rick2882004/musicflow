import { supabase } from "./supabase";

export async function saveLikedSong(
  song: any
) {
  const { error } =
    await supabase
      .from("liked_songs")
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
      "LIKE ERROR:"
    );
    console.log(error);
  }
}

export async function removeLikedSong(
  videoId: string
) {
  const { error } =
    await supabase
      .from("liked_songs")
      .delete()
      .eq(
        "video_id",
        videoId
      );

  if (error) {
    console.log(
      "UNLIKE ERROR:"
    );
    console.log(error);
  }
}