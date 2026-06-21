"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";

export default function HomeHero() {
  const router = useRouter();

const [query, setQuery] = useState("");


  const {
    recentSongs,
    likedSongs,
    setTrack,
    setQueue,
  } = usePlayerStore();

  const playNow = () => {
    if (!recentSongs.length) return;

    setQueue(recentSongs);

    const song = recentSongs[0];

    setTrack(
      song.videoId,
      song.title,
      song.artist,
      song.thumbnail,
      0
    );
  };

  const continueSong =
    recentSongs.length > 0
      ? recentSongs[0]
      : null;

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-3xl
        p-8
        md:p-10
        mb-10
        bg-gradient-to-r
        from-violet-700
        via-purple-600
        to-blue-600
      "
    >
      <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 blur-3xl" />

      <div className="relative z-10">

        <p className="text-sm uppercase tracking-widest text-zinc-200">
          Good to see you again 👋
        </p>

        <h1 className="text-4xl md:text-5xl font-bold mt-2">
  Discover Your Music
</h1>

{continueSong && (
  <div
    onClick={playNow}
    className="
      mt-6
      rounded-2xl
      bg-black/20
      backdrop-blur
      p-4
      max-w-xl
      flex
      items-center
      gap-4
      cursor-pointer
      hover:bg-black/30
      transition
    "
  >
    <img
      src={continueSong.thumbnail}
      alt={continueSong.title}
      className="
        w-20
        h-20
        rounded-xl
        object-cover
      "
    />

    <div>
      <p className="text-zinc-300 text-sm">
        Continue Listening
      </p>

      <h3 className="font-bold text-xl mt-1">
        {continueSong.title}
      </h3>

      <p className="text-zinc-300">
        {continueSong.artist}
      </p>
    </div>
  </div>
)}
{/* Search */}
<div className="mt-6 max-w-2xl relative">

  <input
    value={query}
    onChange={(e) =>
      setQuery(e.target.value)
    }
    onKeyDown={(e) => {
      if (
        e.key === "Enter" &&
        query.trim()
      ) {
        router.push(
          `/search?q=${encodeURIComponent(query)}`
        );
      }
    }}
    type="text"
    placeholder="Search songs, artists, albums..."
    className="
      w-full
      h-14
      pl-5
      pr-32
      rounded-full
      bg-black/20
      border
      border-white/10
      backdrop-blur
      outline-none
      placeholder:text-zinc-300
    "
  />

  <button
    onClick={() => {
      if (query.trim()) {
        router.push(
          `/search?q=${encodeURIComponent(query)}`
        );
      }
    }}
    className="
      absolute
      right-2
      top-2
      h-10
      px-5
      rounded-full
      bg-white
      text-black
      font-semibold
      hover:scale-105
      transition
    "
  >
    Search
  </button>

</div>
        <p className="text-zinc-200 max-w-2xl mt-6">
          Discover trending tracks, revisit your favorites,
          and continue listening where you left off.
        </p>

        <div className="flex flex-wrap gap-4 mt-8">

          <button
            onClick={playNow}
            className="
              bg-white
              text-black
              px-6
              py-3
              rounded-full
              font-semibold
              hover:scale-105
              transition
            "
          >
            ▶ Resume Music
          </button>

          <button
  onClick={() => router.push("/search")}
  className="
    border
    border-white/30
    backdrop-blur
    px-6
    py-3
    rounded-full
    hover:bg-white/10
    transition
  "
>
  Explore
</button>

        </div>

        <div className="flex gap-10 mt-10">

          <div>
            <p className="text-3xl font-bold">
              {recentSongs.length}
            </p>

            <p className="text-zinc-200 text-sm">
              Recent Songs
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold">
              {likedSongs.length}
            </p>

            <p className="text-zinc-200 text-sm">
              Liked Songs
            </p>
          </div>

        </div>
      </div>

      <img
  src="https://images.unsplash.com/photo-1511379938547-c1f69419868d"
  alt="Music"
  className="
    absolute
    right-10
    top-10
    w-72
    h-72
    object-cover
    rounded-3xl
    opacity-20
  "
/>
    </div>
  );
}