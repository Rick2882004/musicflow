import { supabase } from "./supabase";
import { auth } from "../src/lib/firebase";
import { Track } from "@/types/music";

export async function saveLikedSong(song: Track) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    const { data: existing } = await supabase
      .from("liked_songs")
      .select("id")
      .eq("user_uid", uid)
      .eq("video_id", song.videoId)
      .single();

    if (existing) return;

    await supabase
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
  } catch {
    // Graceful offline fallback
  }
}

export async function removeLikedSong(videoId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    await supabase
      .from("liked_songs")
      .delete()
      .eq("user_uid", uid)
      .eq("video_id", videoId);
  } catch {
    // Graceful offline fallback
  }
}