import { supabase } from "./supabase";
import { auth } from "../src/lib/firebase";

export async function savePlaylist(
  name: string
) {
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
      .eq("id", playlistId)
      .eq("user_uid", auth.currentUser?.uid);

  if (error) {
    console.log(
      "DELETE PLAYLIST ERROR:"
    );
    console.log(error);
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
  const { error } = await supabase
    .from("playlists")
    .update(details)
    .eq("id", playlistId)
    .eq("user_uid", auth.currentUser?.uid);

  if (error) {
    console.log("UPDATE PLAYLIST ERROR:", error);
  }
}