import { supabase } from "./supabase";
import { auth } from "../src/lib/firebase";
import { Track } from "@/types/music";

export async function saveRecentSong(song: Track) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    await supabase
      .from("recently_played")
      .delete()
      .eq("user_uid", uid)
      .eq("video_id", song.videoId);

    await supabase.from("recently_played").insert([
      {
        user_uid: uid,
        video_id: song.videoId,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
      },
    ]);
  } catch {
    // Graceful offline fallback
  }
}