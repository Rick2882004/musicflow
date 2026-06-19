"use client";

import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const {
  setTrack,
  setQueue,
} = usePlayerStore();

  async function handleSearch() {
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );

      const data = await res.json();

console.log(data);

setResults(data);

setQueue(data);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 pb-32">
      <h1 className="text-4xl font-bold mb-8">
        Search Music
      </h1>

      <div className="flex gap-4 mb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs..."
          className="bg-zinc-900 px-4 py-3 rounded-lg flex-1"
        />

        <button
          onClick={handleSearch}
          className="bg-green-500 text-black px-6 rounded-lg"
        >
          Search
        </button>
      </div>

     <div className="space-y-4">
  {results.map((song: any, index) => (
    <div
      key={index}
      onClick={() => {
  console.log(song);

setTrack(
  song.videoId,
  song.title,
  song.artist,
  song.thumbnail,
  index
);
}}
      className="bg-zinc-900 p-4 rounded-lg cursor-pointer hover:bg-zinc-800 flex gap-4"
    >
      {song.thumbnail && (
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-20 h-20 rounded-lg object-cover"
        />
      )}

      <div>
        <h3 className="font-semibold">
          {song.title}
        </h3>

        <p className="text-zinc-400">
          {song.artist}
        </p>
      </div>
    </div>
  ))}
</div>

    </main>
  );
}