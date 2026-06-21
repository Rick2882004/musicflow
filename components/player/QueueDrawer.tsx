"use client";

import { usePlayerStore } from "@/store/player-store";

export default function QueueDrawer() {
  const {
    queue,
    currentIndex,
    setTrack,
    toggleQueue,
  } = usePlayerStore();

  return (
    <div className="fixed top-0 right-0 h-screen w-80 bg-zinc-950 border-l border-zinc-800 z-[999] p-4 overflow-y-auto">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          Queue
        </h2>

        <button
          onClick={toggleQueue}
          className="text-zinc-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {queue.length === 0 && (
        <p className="text-zinc-500">
          Queue is empty
        </p>
      )}

      {queue.map(
        (song: any, index) => (
          <div
            key={`${song.videoId}-${index}`}
            onClick={() =>
              setTrack(
                song.videoId,
                song.title,
                song.artist,
                song.thumbnail,
                index
              )
            }
            className={`p-3 rounded-lg mb-2 cursor-pointer ${
              currentIndex === index
                ? "bg-green-500 text-black"
                : "bg-zinc-900 hover:bg-zinc-800"
            }`}
          >
            <p className="font-medium">
              {song.title}
            </p>

            <p className="text-sm opacity-70">
              {song.artist}
            </p>
          </div>
        )
      )}
    </div>
  );
}