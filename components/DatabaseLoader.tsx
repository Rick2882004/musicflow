"use client";

import { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  loadLikedSongs,
  loadRecentSongs,
  loadPlaylists,
} from "@/lib/supabase-load";
import { usePlayerStore } from "@/store/player-store";
import { useSessionStore } from "@/store/session-store";

export default function DatabaseLoader() {
  const { user } = useAuth();
  
  const setLikedSongs = usePlayerStore((s) => s.setLikedSongs);
  const setRecentSongs = usePlayerStore((s) => s.setRecentSongs);
  const setPlaylists = usePlayerStore((s) => s.setPlaylists);

  useEffect(() => {
    if (user?.uid) {
      useSessionStore.getState().rehydrateForUser(user.uid);
    } else {
      useSessionStore.getState().rehydrateForUser("guest");
    }

    async function loadData() {
      // Do not wipe local store if user is not logged in
      if (!user) return;

      try {
        const [likes, recents, playlists] = await Promise.all([
          loadLikedSongs(),
          loadRecentSongs(),
          loadPlaylists(),
        ]);

        setLikedSongs(likes || []);
        setRecentSongs(recents || []);
        setPlaylists(playlists || []);
      } catch {
        // Keep local store data intact on cloud error/offline
      }
    }

    loadData();
  }, [user, setLikedSongs, setRecentSongs, setPlaylists]);

  return null;
}
