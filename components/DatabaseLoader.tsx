"use client";

import { useEffect } from "react";

import {
  loadLikedSongs,
  loadRecentSongs,
  loadPlaylists,
} from "@/lib/supabase-load";

import { usePlayerStore }
from "@/store/player-store";

export default function DatabaseLoader() {
  const {
    setLikedSongs,
    setRecentSongs,
    setPlaylists,
  } = usePlayerStore();

  useEffect(() => {
    async function loadData() {
      const likes =
        await loadLikedSongs();

      const recents =
        await loadRecentSongs();

      const playlists =
        await loadPlaylists();

      setLikedSongs(
        likes.map(
          (song: any) => ({
            videoId:
              song.video_id,
            title:
              song.title,
            artist:
              song.artist,
            thumbnail:
              song.thumbnail,
          })
        )
      );

      setRecentSongs(
        recents.map(
          (song: any) => ({
            videoId:
              song.video_id,
            title:
              song.title,
            artist:
              song.artist,
            thumbnail:
              song.thumbnail,
          })
        )
      );

     setPlaylists(playlists);
    }

    loadData();
  }, []);

  return null;
}