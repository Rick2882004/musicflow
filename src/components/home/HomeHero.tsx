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

  const greeting =
    new Date().getHours() < 12
      ? "☀️ Good Morning"
      : new Date().getHours() < 18
      ? "🌤 Good Afternoon"
      : "🌙 Good Evening";

  return (
 <section
  className="
    relative
    overflow-hidden
    rounded-[40px]
    p-8
    mb-12

    bg-zinc-900/60
    backdrop-blur-3xl

    border
    border-white/10

    shadow-[0_0_60px_rgba(124,58,237,0.15)]
  "
>
      {/* Animated Glow */}
     {/* Purple Orb */}
<div
  className="
    absolute
    -top-20
    -left-20
    w-[350px]
    h-[350px]
    rounded-full
    bg-fuchsia-500/30
    blur-[120px]
  "
/>

{/* Blue Orb */}
<div
  className="
    absolute
    bottom-0
    right-0
    w-[400px]
    h-[400px]
    rounded-full
    bg-blue-500/20
    blur-[140px]
  "
/>

{/* Pink Orb */}
<div
  className="
    absolute
    top-1/2
    left-1/3
    w-[250px]
    h-[250px]
    rounded-full
    bg-pink-500/20
    blur-[100px]
  "
/>
<div
  className="
    absolute
    inset-0
    opacity-[0.03]
    bg-[url('https://www.transparenttextures.com/patterns/noise.png')]
  "
/>

      <div className="relative z-10 max-w-2xl">
        {/* Greeting */}
        <p
          className="
            text-sm
            uppercase
            tracking-[0.3em]
            text-zinc-200
          "
        >
          {greeting}
        </p>

        {/* Heading */}
        <h1
className="
text-5xl
md:text-7xl
font-black
leading-tight
leading-none
tracking-tight
max-w-xl
"
>
          <span
            className="
              bg-gradient-to-r
              from-white
              via-purple-100
              to-blue-200
              bg-clip-text
              text-transparent
            "
          >
            Discover Your Music
          </span>
        </h1>

        <p
          className="
            text-zinc-200
            text-base
md:text-lg
max-w-lg
text-zinc-300
            mt-4
            max-w-2xl
          "
        >
          Discover trending tracks, revisit your
          favorites, and continue listening where
          you left off.
        </p>
</div>
        {/* Continue Listening */}
        {continueSong && (
          <div
            onClick={playNow}
           className="
mt-6
max-w-xl
p-4
rounded-3xl
bg-black/20
backdrop-blur-3xl
border border-white/10
shadow-xl
"
          >
            <img
              src={continueSong.thumbnail}
              alt={continueSong.title}
              className="
                w-16
                h-16
                rounded-2xl
                object-cover
                shadow-xl
              "
            />

            <div>
              <p className="text-zinc-300 text-sm">
                Continue Listening
              </p>

              <h3
                className="
                  text-lg
                  font-bold
                  mt-1
                "
              >
                {continueSong.title}
              </h3>

              <p className="text-zinc-300">
                {continueSong.artist}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mt-8 max-w-xl relative">
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
                  `/search?q=${encodeURIComponent(
                    query
                  )}`
                );
              }
            }}
            placeholder="Search songs, artists, albums..."
            className="
              w-full
              h-14
              rounded-xl
              bg-white/10
              backdrop-blur-xl
              border
              border-white/10
              px-6
              pr-36
              outline-none
              text-white
              placeholder:text-zinc-300
            "
          />

          <button
            onClick={() => {
              if (query.trim()) {
                router.push(
                  `/search?q=${encodeURIComponent(
                    query
                  )}`
                );
              }
            }}
            className="
              absolute
              right-3
              top-3
              px-6
              h-10
              rounded-xl
              bg-white
              text-black
              font-bold
              hover:scale-105
              transition
            "
          >
            Search
          </button>
        </div>

        {/* Artist Chips */}
        <div className="flex flex-wrap gap-3 mt-5">
          {[
            "Arijit Singh",
            "Atif Aslam",
            "KK",
            "Sonu Nigam",
            "Shreya Ghoshal",
          ].map((artist) => (
            <button
              key={artist}
              onClick={() =>
                router.push(
                  `/search?q=${encodeURIComponent(
                    artist
                  )}`
                )
              }
              className="
                px-3
                py-1.5
                rounded-full
                bg-white/10
                backdrop-blur-xl
                border
                border-white/10
                hover:bg-white/20
                transition
              "
            >
              {artist}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={playNow}
            className="
              px-6
              py-3
              rounded-2xl
              bg-white
              text-black
              font-bold
              hover:scale-105
              transition
            "
          >
            ▶ Resume Music
          </button>

          <button
            onClick={() =>
              router.push("/search")
            }
            className="
              px-6
              py-3
              rounded-2xl
              bg-white/10
              backdrop-blur-xl
              border
              border-white/10
              hover:bg-white/20
              transition
            "
          >
            Explore
          </button>
        </div>

{/* Stats */}
<div className="flex gap-4 mt-8">

  <div
    className="
      px-5
      py-3
      rounded-xl
      bg-black/20
      backdrop-blur-xl
      border
      border-white/20
      hover:bg-black/30
      hover:scale-105
      transition-all
      duration-300
      min-w-[140px]
    "
  >
    <div className="flex items-center gap-2 mb-1">
      <span>🕒</span>
      <span className="text-sm text-zinc-300">
        Recent
      </span>
    </div>

    <p className="text-3xl font-bold">
      {recentSongs.length}
    </p>
  </div>

  <div
    className="
      px-5
      py-3
      rounded-xl
      bg-black/20
      backdrop-blur-xl
      border
      border-white/20
      hover:bg-black/30
      hover:scale-105
      transition-all
      duration-300
      min-w-[140px]
    "
  >
    <div className="flex items-center gap-2 mb-1">
      <span>❤️</span>
      <span className="text-sm text-zinc-300">
        Liked
      </span>
    </div>

    <p className="text-3xl font-bold">
      {likedSongs.length}
    </p>
  </div>

</div>
      {/* Right Hero Image */}
<img
  src="/logo.png"
  alt="MusicFlow"
  className="
    hidden xl:block
    absolute
    right-16
    top-1/2
    -translate-y-1/2
    w-[320px]
    opacity-10
  "
/>
    </section>
  );
}