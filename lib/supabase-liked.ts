import { supabase } from "./supabase";
import { auth } from "../src/lib/firebase";
import { Track } from "@/types/music";

export async function saveLikedSong(song: Track) {
  const uid = auth.currentUser?.uid;

  if (!uid) return;

  const { data: existing } = await supabase
    .from("liked_songs")
    .select("id")
    .eq("user_uid", uid)
    .eq("video_id", song.videoId)
    .single();

  if (existing) return;

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