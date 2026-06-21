"use client";

import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";
export default function QueuePage() {
const {
  queue,
  currentIndex,
  setTrack,
  clearQueue,
} = usePlayerStore();

  return (
    <main className="min-h-screen bg-black text-white p-8 pb-32">
      <h1 className="text-5xl font-bold mb-8">
        Queue
      </h1>
<div className="flex items-center justify-between mb-8">

  <p className="text-zinc-400">
    {queue.length} songs in queue
  </p>

  <button
    onClick={clearQueue}
    className="bg-red-500 px-4 py-2 rounded-lg"
  >
    Clear Queue
  </button>

</div>
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
  {queue.map(
    (song: any, index: number) => (
      <div
        key={index}
        onClick={() =>
          setTrack(
            song.videoId,
            song.title,
            song.artist,
            song.thumbnail,
            index
          )
        }
        className={
          index === currentIndex
            ? "ring-2 ring-purple-500 rounded-2xl"
            : ""
        }
      >
        <SongCard
          song={{
            id: song.videoId,
            title: song.title,
            artist: song.artist,
            thumbnail: song.thumbnail,
            duration: 180,
          }}
        />

        {index === currentIndex && (
          <p className="text-purple-400 text-sm mt-2 text-center">
            ▶ Currently Playing
          </p>
        )}
      </div>
    )
  )}
</div>
    </main>
  );
}