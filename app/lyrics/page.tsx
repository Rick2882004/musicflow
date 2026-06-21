"use client";

import { usePlayerStore } from "@/store/player-store";

export default function LyricsPage() {
  const {
    title,
    artist,
    thumbnail,
  } = usePlayerStore();

  return (
    <main className="min-h-screen bg-black text-white p-8">

      <div className="max-w-4xl mx-auto">

        <div className="flex items-center gap-6 mb-10">

          <img
            src={thumbnail}
            alt=""
            className="w-48 h-48 rounded-2xl"
          />

          <div>

            <h1 className="text-5xl font-bold">
              {title}
            </h1>

            <p className="text-zinc-400 mt-3 text-xl">
              {artist}
            </p>

          </div>

        </div>

        <div className="bg-zinc-900 rounded-3xl p-10">

          <h2 className="text-3xl font-bold mb-8">
            Lyrics
          </h2>

          <div className="space-y-6 text-xl leading-relaxed text-zinc-300">

            <p>
              Lyrics API coming soon...
            </p>

            <p>
              This page will show synced lyrics.
            </p>

            <p>
              Auto scrolling.
            </p>

            <p>
              Karaoke mode.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}