"use client";

import YoutubePlayer from "./YoutubePlayer";
import { usePlayerStore } from "@/store/player-store";

export default function PlayerEngine() {
  const videoId = usePlayerStore((s) => s.videoId);

  if (!videoId) return null;

  return (
    // IMPORTANT: Do NOT use display:none here.
    // Chrome Android drops Previous/Next/Seek notification controls for iframes
    // that are removed from layout (display:none). Off-screen CSS keeps the iframe
    // "rendered" so Chrome treats it as an active media source and exposes all
    // MediaSession controls in the notification shade and lock screen.
    <div
      style={{
        position: "fixed",
        top: "-2px",
        left: "-2px",
        width: "1px",
        height: "1px",
        opacity: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      <YoutubePlayer videoId={videoId} />
    </div>
  );
}
