"use client";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { usePlayerStore } from "@/store/player-store";

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();

  const {
    playlists,
    setTrack,
    setQueue,
    removeSongFromPlaylist,
    deletePlaylist,
  } = usePlayerStore();

  const playlist = playlists.find(
    (p: any) =>
      p.id.toString() === params.id
  );

  if (!playlist) {
    return (
      <main className="p-8 text-white">
        Playlist not found
      </main>
    );
  }
const totalDuration =
  playlist.songs.reduce(
    (total: number, song: any) =>
      total + (song.duration || 0),
    0
  );

const totalMinutes = Math.floor(
  totalDuration / 60
);

const totalSeconds =
  totalDuration % 60;
  return (
    <main className="min-h-screen bg-black text-white p-8 pb-32">

      {/* HERO */}
      <div className="mb-10 rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-500 p-8">

          <div className="flex items-center gap-6">

            <div className="w-40 h-40 bg-black/20 rounded-2xl overflow-hidden">
              {playlist.songs[0] ? (
                <img
                  src={playlist.songs[0].thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🎵
                </div>
              )}
            </div>

            <div>
              <p className="uppercase text-sm tracking-wider">
                Playlist
              </p>

              <h1 className="text-6xl font-bold">
                {playlist.name}
              </h1>

              <p className="mt-4 text-white/80">
                {playlist.songs.length} songs
              </p>

             <p className="text-white/70">
  {totalMinutes}:{String(
    totalSeconds
  ).padStart(2, "0")}
</p>
            </div>

          </div>

        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-4 mb-8">

        <button
          onClick={() => {
            if (
              playlist.songs.length === 0
            )
              return;

            setQueue(
              playlist.songs
            );

            const firstSong =
              playlist.songs[0];

            setTrack(
              firstSong.videoId,
              firstSong.title,
              firstSong.artist,
              firstSong.thumbnail,
              0
            );
          }}
          className="bg-green-500 hover:bg-green-400 text-black px-8 py-4 rounded-full font-bold transition"
        >
          ▶ Play
        </button>

        <button
          onClick={() => {
            const shuffled =
              [...playlist.songs].sort(
                () =>
                  Math.random() - 0.5
              );

            if (
              shuffled.length === 0
            )
              return;

            setQueue(shuffled);

            const first =
              shuffled[0];

            setTrack(
              first.videoId,
              first.title,
              first.artist,
              first.thumbnail,
              0
            );
          }}
          className="bg-zinc-800 hover:bg-zinc-700 px-6 py-4 rounded-full transition"
        >
          🔀 Shuffle
        </button>

        <button
          onClick={() => {
            deletePlaylist(
              playlist.id
            );

            router.push(
              "/playlists"
            );
          }}
          className="bg-red-500 hover:bg-red-400 px-6 py-4 rounded-full transition"
        >
          🗑 Delete
        </button>

      </div>

      {/* SONGS */}
      <div className="space-y-2">

        {playlist.songs.map(
          (
            song: any,
            index: number
          ) => (
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
              className="bg-zinc-900 hover:bg-zinc-800 p-4 rounded-xl flex items-center gap-4 transition-all cursor-pointer"
            >

              <div className="w-8 text-center text-zinc-500">
                {index + 1}
              </div>

              <div className="relative">
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              </div>

              <div className="flex-1">

                <h3 className="font-semibold text-lg">
                  {song.title}
                </h3>

                <Link
  href={`/artist/${encodeURIComponent(
    song.artist
  )}`}
  onClick={(e) =>
    e.stopPropagation()
  }
  className="text-zinc-400 hover:text-white"
>
  {song.artist}
</Link>

              <p className="text-zinc-500 text-sm">
  {song.duration
    ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
    : "0:00"}
</p>

              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();

                  removeSongFromPlaylist(
                    playlist.id,
                    song.videoId
                  );
                }}
                className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg text-sm"
              >
                Remove
              </button>

            </div>
          )
        )}

      </div>

    </main>
  );
}