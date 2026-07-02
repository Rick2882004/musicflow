import { supabase } from "./supabase";
import { auth } from "../src/lib/firebase";

export async function saveLikedSong(song: any) {
  const uid = auth.currentUser?.uid;

  if (!uid) return;

  const { error } = await supabase
    .from("liked_songs")
    .insert([
      {
        user_uid: uid,
        video_id: song.videoId,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
      },
    ]);

  if (error) console.log(error);
}

export async function removeLikedSong(videoId: string) {
  const uid = auth.currentUser?.uid;

  if (!uid) return;

  const { error } = await supabase
    .from("liked_songs")
    .delete()
    .eq("user_uid", uid)
    .eq("video_id", videoId);

  if (error) console.log(error);
}