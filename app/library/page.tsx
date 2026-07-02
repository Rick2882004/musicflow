"use client";

import Link from "next/link";
import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";

export default function LibraryPage() {
  const {
    likedSongs,
    playlists,
    recentSongs,
  } = usePlayerStore();

  const uniqueRecentSongs = Array.from(
  new Map(
    recentSongs.map((song) => [
      song.videoId,
      song,
    ])
  ).values()
);

  return (
  <ProtectedRoute>
    <main className="min-h-screen bg-black text-white p-8">

      <div className="flex items-center justify-between mb-10">

  <h1 className="text-5xl font-bold">
    Library
  </h1>

  <button
    className="
      bg-zinc-900
      px-5
      py-3
      rounded-xl
    "
  >
    Recent
  </button>

</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">

  <div className="bg-zinc-900 p-6 rounded-2xl">
    ❤️
    <h3 className="mt-3 font-bold">
      Liked Songs
    </h3>
    <p className="text-zinc-500">
      {likedSongs.length} songs
    </p>
  </div>

  <div className="bg-zinc-900 p-6 rounded-2xl">
    🕒
    <h3 className="mt-3 font-bold">
      Recently Played
    </h3>
    <p className="text-zinc-500">
      {recentSongs.length} songs
    </p>
  </div>

  <div className="bg-zinc-900 p-6 rounded-2xl">
    🎵
    <h3 className="mt-3 font-bold">
      Playlists
    </h3>
    <p className="text-zinc-500">
      {playlists.length} playlists
    </p>
  </div>

  <div className="bg-zinc-900 p-6 rounded-2xl">
    🎤
    <h3 className="mt-3 font-bold">
      Artists
    </h3>
    <p className="text-zinc-500">
      Followed artists
    </p>
  </div>

</div>
      {/* Playlists */}

      <section className="mb-10">
        <h2 className="text-3xl font-bold mb-5">
          Playlists
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">

  {playlists.map((playlist) => (
    <a
      key={playlist.id}
      href={`/playlists/${playlist.id}`}
      className="
        bg-zinc-900
        rounded-2xl
        p-4
        hover:bg-zinc-800
        transition
      "
    >
      <div
        className="
          aspect-square
          rounded-xl
          bg-gradient-to-br
          from-purple-500
          to-blue-500
          mb-4
        "
      />

      <h3 className="font-bold">
        {playlist.name}
      </h3>

      <p className="text-zinc-500 text-sm">
        {playlist.songs.length} songs
      </p>
    </a>
  ))}

</div>
<section className="mt-16">

  <h2 className="text-4xl font-bold mb-6">
    Collections
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

    <a
      href="/liked"
      className="
        bg-gradient-to-br
        from-pink-500
        to-purple-600
        rounded-2xl
        p-6
        h-52
      "
    >
      <h3 className="text-2xl font-bold">
        ❤️ Liked Songs
      </h3>

      <p className="mt-2">
        {likedSongs.length} songs
      </p>
    </a>

    <a
      href="/recent"
      className="
        bg-gradient-to-br
        from-blue-500
        to-cyan-500
        rounded-2xl
        p-6
        h-52
      "
    >
      <h3 className="text-2xl font-bold">
        🕒 Recently Played
      </h3>

      <p className="mt-2">
        {recentSongs.length} songs
      </p>
    </a>

  </div>

</section>
<section className="mt-16">
  <h2 className="text-4xl font-bold mb-6">
    Recent Activity
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">

   {uniqueRecentSongs.slice(0,5).map((song, index) => (
  <SongCard
    key={`${song.videoId}-${index}`}
    song={{
      id: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration || 0,
    }}
  />
))}

  </div>
</section>
<section className="mt-16">
  <h2 className="text-4xl font-bold mb-6">
    Favorite Artists
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-5 gap-5">

    {[
      "Arijit Singh",
      "Atif Aslam",
      "Shreya Ghoshal",
      "Jubin Nautiyal",
      "Sonu Nigam",
    ].map((artist) => (

      <div
        key={artist}
        className="
          bg-zinc-900
          rounded-2xl
          p-6
          text-center
        "
      >
        <div
          className="
            w-24
            h-24
            rounded-full
            bg-gradient-to-r
            from-purple-500
            to-blue-500
            mx-auto
            mb-4
          "
        />

        <h3 className="font-bold">
          {artist}
        </h3>

      </div>

    ))}

  </div>
</section>
      </section>

        </main>
  </ProtectedRoute>
  );
}