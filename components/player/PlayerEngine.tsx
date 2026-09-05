"use client";

import { useEffect } from "react";
import YoutubePlayer from "./YoutubePlayer";
import { usePlayerStore } from "@/store/player-store";
import { initBgDiagnostics } from "@/lib/bg-diagnostics";

export default function PlayerEngine() {
  const videoId = usePlayerStore((s) => s.videoId);

  useEffect(() => {
    initBgDiagnostics();
  }, []);

  if (!videoId) return null;

  return (
    // IMPORTANT: Do NOT use display:none or off-screen 1x1 coords here.
    // Chrome Android suspends/freezes cross-origin iframes and throttles media
    // for subframes that are off-screen (top: -2px) or zero-sized (1px x 1px, opacity: 0).
    // Placing the iframe inside the viewport bounds (bottom: 0, right: 0, 200px x 200px)
    // with near-zero opacity (0.001) and zIndex -9999 ensures Chromium considers it an
    // active, in-viewport composited layer and maintains the media pipeline in the background.
    <div
      id="musicflow-yt-container"
      style={{
        position: "fixed",
        bottom: "0px",
        right: "0px",
        width: "200px",
        height: "200px",
        opacity: 0.001,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: -9999,
      }}
      aria-hidden="true"
    >
      <YoutubePlayer videoId={videoId} />
    </div>
  );
}
