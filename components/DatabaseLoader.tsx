"use client";

import { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  loadLikedSongs,
  loadRecentSongs,
  loadPlaylists,
} from "@/lib/supabase-load";
import { usePlayerStore } from "@/store/player-store";

export default function DatabaseLoader() {
  const { user } = useAuth();
  
  const setLikedSongs = usePlayerStore((s) => s.setLikedSongs);
  const setRecentSongs = usePlayerStore((s) => s.setRecentSongs);
  const setPlaylists = usePlayerStore((s) => s.setPlaylists);

  useEffect(() => {
    async function loadData() {
      // Do not wipe local store if user is not logged in
      if (!user) return;

      try {
        const [likes, recents, playlists] = await Promise.all([
          loadLikedSongs(),
          loadRecentSongs(),
          loadPlaylists(),
        ]);

        if (likes.length > 0) setLikedSongs(likes);
        if (recents.length > 0) setRecentSongs(recents);
        if (playlists.length > 0) setPlaylists(playlists);
      } catch {
        // Keep local store data intact on cloud error/offline
      }
    }

    loadData();
  }, [user, setLikedSongs, setRecentSongs, setPlaylists]);

  return null;
}
