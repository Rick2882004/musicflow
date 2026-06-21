"use client";
import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";

export default function LikedSongsPage() {
const {
  likedSongs,
  setTrack,
  setQueue,
  toggleLike,
} = usePlayerStore();

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-4xl font-bold">
      ❤️ Liked Songs
    </h1>

    <p className="text-zinc-400 mt-2">
      {likedSongs.length} songs
    </p>
  </div>

  {likedSongs.length > 0 && (
    <button
      onClick={() => {
        setQueue(likedSongs);

        const firstSong =
          likedSongs[0];

        setTrack(
          firstSong.videoId,
          firstSong.title,
          firstSong.artist,
          firstSong.thumbnail,
          0
        );
      }}
      className="
        bg-green-500
        text-black
        px-6
        py-3
        rounded-full
        font-semibold
        hover:scale-105
        transition
      "
    >
      ▶ Play All
    </button>
  )}
</div>

      {likedSongs.length === 0 ? (
        <p>No liked songs yet.</p>
      ) : (
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
  {likedSongs.map(
    (song: any, index: number) => (
<div
  key={`${song.videoId}-${index}`}
  className="relative"
>
  <div
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
        thumbnail: song.thumbnail,
        duration:
          song.duration || 0,
      }}
    />
  </div>

  <button
    onClick={() =>
      toggleLike(song)
    }
    className="
      absolute
      top-3
      right-3
      z-20
      bg-red-500
      hover:bg-red-600
      px-2
      py-1
      rounded
      text-xs
      font-medium
    "
  >
    Remove
  </button>
</div>
    )
  )}
</div>
      )}
    </div>
  );
}