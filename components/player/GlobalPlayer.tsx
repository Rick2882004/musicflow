"use client";
import YoutubePlayer from "./YoutubePlayer";

import { usePlayerStore }
from "@/store/player-store";

export default function GlobalPlayer() {
const {
  videoId,
  title,
  artist,
  thumbnail,
  nextTrack,
  prevTrack,
} = usePlayerStore();
if (!title) return null;
  return (
    <div className="
      fixed
      bottom-0
      left-0
      right-0
      bg-zinc-950
      border-t
      border-zinc-800
      px-6
      py-3
      flex
      items-center
      justify-between
      z-50
    ">
      <div className="flex items-center gap-4">
       {thumbnail && (
  <img
    src={thumbnail}
    alt={title}
    className="w-14 h-14 rounded-lg"
  />
)}

        <div>
          <h3 className="text-white font-semibold">
            {title}
          </h3>

          <p className="text-zinc-400 text-sm">
            {artist}
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        <button
          onClick={prevTrack}
          className="text-white text-2xl"
        >
          ⏮
        </button>

        <button
          className="text-white text-3xl"
        >
          ▶
        </button>

        <button
          onClick={nextTrack}
          className="text-white text-2xl"
        >
          ⏭
        </button>
      </div>
      <div style={{ display: "none" }}>
  <YoutubePlayer videoId={videoId} />
</div>
    </div>
  );
}