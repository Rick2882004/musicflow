"use client";

import YoutubePlayer from "./YoutubePlayer";
import { usePlayerStore } from "@/store/player-store";

export default function PlayerEngine() {
  const { videoId } = usePlayerStore();

  if (!videoId) return null;

  return (
    <div style={{ display: "none" }}>
      <YoutubePlayer videoId={videoId} />
    </div>
  );
}