import { supabase } from "./supabase";
import { auth } from "../src/lib/firebase";

export async function savePlaylist(
  name: string
) {
  try {
    const { data, error } =
      await supabase
        .from("playlists")
        .insert([
          {
            user_uid: auth.currentUser?.uid,
            name,
          }
        ])
        .select()
        .single();

    if (error) {
      return { id: Date.now(), name };
    }

    return data || { id: Date.now(), name };
  } catch {
    return { id: Date.now(), name };
  }
}

export async function deletePlaylistDB(
  playlistId: number
) {
  try {
    await supabase
      .from("playlists")
      .delete()
      .eq("id", playlistId)
      .eq("user_uid", auth.currentUser?.uid);
  } catch {
    // Graceful offline/network fallback
  }
}

export async function updatePlaylistDetailsDB(
  playlistId: number,
  details: {
    name?: string;
    description?: string;
    is_collaborative?: boolean;
    cover_image?: string;
  }
) {
  try {
    await supabase
      .from("playlists")
      .update(details)
      .eq("id", playlistId)
      .eq("user_uid", auth.currentUser?.uid);
  } catch {
    // Graceful offline/network fallback
  }
}