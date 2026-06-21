"use client";

import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";

export default function RecentlyPlayedPage() {
  const {
    recentSongs,
    setTrack,
  } = usePlayerStore();

  return (
    <main className="min-h-screen bg-black text-white p-8 pb-32">
      <h1 className="text-5xl font-bold mb-8">
        Recently Played
      </h1>

      {recentSongs.length === 0 ? (
        <p className="text-zinc-400">
          No recently played songs
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {recentSongs.map(
            (song: any, index: number) => (
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
              >
                <SongCard
                  song={{
                    id: song.videoId,
                    title: song.title,
                    artist: song.artist,
                    thumbnail:
                      song.thumbnail,
                    duration:
                      song.duration || 0,
                  }}
                />
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}