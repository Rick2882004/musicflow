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
      // If user is not logged in, clear local store states
      if (!user) {
        setLikedSongs([]);
        setRecentSongs([]);
        setPlaylists([]);
        return;
      }

      try {
        const likes = await loadLikedSongs();
        const recents = await loadRecentSongs();
        const playlists = await loadPlaylists();

        setLikedSongs(likes);
        setRecentSongs(recents);
        setPlaylists(playlists);
      } catch (err) {
        console.error("Error loading user cloud sync database:", err);
      }
    }

    loadData();
  }, [user, setLikedSongs, setRecentSongs, setPlaylists]);

  return null;
}
