"use client";

import { useParams } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";

export default function AlbumPage() {
  const params = useParams();

  const { playlists } =
    usePlayerStore();

  const allSongs =
    playlists.flatMap(
      (p: any) => p.songs
    );

  const song =
    allSongs.find(
      (s: any) =>
        s.videoId ===
        params.id
    );

  if (!song)
    return (
      <main className="p-8 text-white">
        Album not found
      </main>
    );

  return (
    <main className="min-h-screen bg-black text-white p-8">

      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-500 rounded-3xl p-10 mb-10">

        <div className="flex gap-8 items-center">

          <img
            src={song.thumbnail}
            alt=""
            className="w-52 h-52 rounded-2xl object-cover"
          />

          <div>

            <p className="uppercase text-sm">
              Album
            </p>

            <h1 className="text-6xl font-bold">
              {song.title}
            </h1>

            <p className="mt-4 text-white/80">
              {song.artist}
            </p>

            <p className="text-white/60">
              2025 • 1 Track
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}