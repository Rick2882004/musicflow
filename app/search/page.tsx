"use client";

import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";

const categories = [
  {
    title: "Music",
    color: "from-pink-500 to-fuchsia-600",
  },
  {
    title: "Podcasts",
    color: "from-cyan-500 to-blue-600",
  },
  {
    title: "Made For You",
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "New Releases",
    color: "from-green-400 to-lime-500",
  },
  {
    title: "Hindi",
    color: "from-pink-500 to-purple-600",
  },
  {
    title: "Tamil",
    color: "from-orange-500 to-red-500",
  },
  {
    title: "Pop",
    color: "from-sky-500 to-cyan-500",
  },
  {
    title: "LoFi",
    color: "from-purple-500 to-indigo-500",
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchSongs = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      console.log("SEARCH RESPONSE:", data);

      setResults(data.results || []);
    } catch (error) {
      console.error(error);
      setResults([]);
    }

    setLoading(false);
  };

  return (
    <main className="p-8 text-white bg-black min-h-screen">
      <h1 className="text-5xl font-bold mb-8">
        Search
      </h1>

      <div
        className="
          bg-zinc-900
          rounded-full
          h-16
          flex
          items-center
          px-6
          mb-10
        "
      >
        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              searchSongs();
            }
          }}
          placeholder="What do you want to play?"
          className="
            bg-transparent
            outline-none
            w-full
            text-lg
          "
        />

        <button
          onClick={searchSongs}
          className="
            bg-purple-600
            hover:bg-purple-700
            px-5
            py-2
            rounded-full
            ml-3
          "
        >
          Search
        </button>
      </div>

      {loading && (
        <p className="text-zinc-400 mb-6">
          Searching...
        </p>
      )}

      {results.length > 0 && (
        <>
          <h2 className="text-3xl font-bold mb-6">
            Results
          </h2>

          <div className="space-y-3 mb-12">
            {results.map((song) => (
              <div
                key={song.videoId}
                onClick={() => {
                  usePlayerStore
                    .getState()
                    .setTrack(
                      song.videoId,
                      song.title,
                      song.artist,
                      song.thumbnail
                    );
                }}
                className="
                  bg-zinc-900
                  rounded-xl
                  p-4
                  flex
                  items-center
                  justify-between
                  hover:bg-zinc-800
                  transition
                  cursor-pointer
                "
              >
                <div className="flex items-center gap-4">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="
                      w-16
                      h-16
                      rounded-lg
                      object-cover
                    "
                  />

                  <div>
                    <h3 className="font-semibold">
                      {song.title}
                    </h3>

                    <p className="text-zinc-400">
                      {song.artist}
                    </p>
                  </div>
                </div>

                <div className="text-zinc-400 text-sm">
                  {song.duration
                    ? `${Math.floor(
                        song.duration / 60
                      )}:${String(
                        song.duration % 60
                      ).padStart(2, "0")}`
                    : "--:--"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-3xl font-bold mb-6">
        Browse All
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {categories.map((item) => (
          <div
            key={item.title}
            className={`
              bg-gradient-to-br
              ${item.color}
              rounded-2xl
              h-40
              p-5
              font-bold
              text-2xl
              cursor-pointer
              hover:scale-105
              transition
            `}
          >
            {item.title}
          </div>
        ))}
      </div>
    </main>
  );
}