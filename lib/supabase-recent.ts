import { supabase } from "./supabase";
import { auth } from "../src/lib/firebase";

export async function saveRecentSong(song: any) {
  const uid = auth.currentUser?.uid;

  if (!uid) return;

  await supabase.from("recently_played").insert([
    {
      user_uid: uid,
      video_id: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
    },
  ]);
}