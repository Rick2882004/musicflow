"use client";
import Link from "next/link";
import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";

export default function PlaylistsPage() {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const {
    playlists,
    addPlaylist,
  } = usePlayerStore();

  return (
  <ProtectedRoute>
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mb-10 rounded-3xl p-8 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-500">
  <h1 className="text-5xl font-bold mb-3">
    Your Music Library
  </h1>

  <p className="text-lg text-white/90">
    {playlists.length} playlists •{" "}
    {playlists.reduce(
      (total, playlist) =>
        total + playlist.songs.length,
      0
    )} songs saved
  </p>
</div>

      <div className="bg-zinc-900 rounded-2xl p-5 mb-10">
        <h2 className="text-xl font-semibold mb-4">
  Create Playlist
</h2>

<div className="flex gap-4"></div>
        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="Playlist name"
          className="bg-zinc-900 px-4 py-3 rounded-lg flex-1"
        />

        <button
          onClick={() => {
            if (!name.trim()) return;

            addPlaylist(name);

            setName("");
          }}
          className="bg-green-500 hover:bg-green-400 transition text-black font-semibold px-6 rounded-xl"
        >
          Create
        </button>
      </div>
<input
  value={search}
  onChange={(e) =>
    setSearch(e.target.value)
  }
  placeholder="Search playlists..."
  className="w-full bg-zinc-900 p-4 rounded-2xl mb-8"
/>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists
  .filter((playlist: any) =>
    playlist.name
      .toLowerCase()
      .includes(
        search.toLowerCase()
      )
  )
  .map((playlist: any) => (
  <Link
    key={playlist.id}
    href={`/playlists/${playlist.id}`}
  >
<div className="
group
bg-zinc-900
hover:bg-zinc-800
hover:scale-105
transition-all
duration-300
rounded-2xl
overflow-hidden
border
border-zinc-800
">

  <div className="relative h-44 bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">

    {playlist.songs[0] ? (
      <img
        src={playlist.songs[0].thumbnail}
        alt=""
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-6xl">
        🎵
      </span>
    )}
<div
  className="
  absolute
  bottom-3
  right-3
  bg-green-500
  w-12
  h-12
  rounded-full
  flex
  items-center
  justify-center
  opacity-0
  group-hover:opacity-100
  transition
  "
>
  ▶
</div>
  </div>

  <div className="p-5">

    <h2 className="font-bold text-xl">
      {playlist.name}
    </h2>

    <p className="text-zinc-400 mt-2">
      {playlist.songs.length} songs
    </p>

  </div>

</div>
  </Link>
))}
      </div>
        </main>
  </ProtectedRoute>
  );
}