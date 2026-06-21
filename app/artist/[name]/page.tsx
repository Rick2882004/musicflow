"use client";
import { ARTISTS } from "@/lib/artists";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SongCard } from "@/components/ui/SongCard";
import { usePlayerStore } from "@/store/player-store";
import { getArtistPhoto } from "@/lib/wiki";

export default function ArtistPage() {
  const params = useParams();

  const artistName = decodeURIComponent(
    params.name as string
  );

  const [songs, setSongs] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] =
    useState(false);

  const {
    setQueue,
    setTrack,
  } = usePlayerStore();

  useEffect(() => {
    loadSongs();

    const followed =
      localStorage.getItem(
        `artist-${artistName}`
      );

    setIsFollowing(
      followed === "true"
    );
  }, []);

async function loadSongs() {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(
        artistName
      )}`
    );

    const data = await res.json();

    setSongs(data.results || []);
  } catch (error) {
    console.error(error);
    setSongs([]);
  }
}


const artistData =
  ARTISTS[artistName as keyof typeof ARTISTS];

const artistImage =
  artistData?.image ||
  songs?.[0]?.thumbnail;

const artistBanner =
  artistData?.banner ||
  artistImage;

const monthlyListeners =
  artistData?.monthlyListeners ||
  (
    songs.length * 127345
  ).toLocaleString();

const albums = Array.isArray(songs)
  ? songs.slice(0, 6)
  : [];
const relatedArtists = [
  {
    name: "Armaan Malik",
    image:
      "https://i.scdn.co/image/ab6761610000e5ebc6f5c1f57d5db1f2d6a1b6a4",
  },
  {
    name: "Atif Aslam",
    image:
      "https://i.scdn.co/image/ab6761610000e5eb0d8d1ec2e0c7a0d6f4b7c4f9",
  },
  {
    name: "Jubin Nautiyal",
    image:
      "https://i.scdn.co/image/ab6761610000e5eb6d5df0b4c9df0f87e0c6cb95",
  },
  {
    name: "Sonu Nigam",
    image:
      "https://i.scdn.co/image/ab6761610000e5eb58f5b7c4d68c4e42f51a3c24",
  },
  {
    name: "Shreya Ghoshal",
    image:
      "https://i.scdn.co/image/ab6761610000e5eb4cb5f0e7f22db91f6a52aca5",
  },
];

  return (
    <main className="min-h-screen bg-black text-white p-8 pb-32">

      {/* HERO */}

      <div className="relative overflow-hidden rounded-3xl mb-10">

        <div
          className="absolute inset-0 bg-cover bg-center blur-sm scale-110 opacity-30"
          style={{
          backgroundImage: `url(${artistBanner})`,
          }}
        />

        <div className="relative bg-gradient-to-r from-purple-600/90 via-fuchsia-500/90 to-blue-500/90 p-10">

          <div className="flex items-center gap-8">

            <img
              src={artistImage}
              alt={artistName}
              className="w-44 h-44 rounded-full object-cover border-4 border-white/20 shadow-2xl"
            />

            <div>

              <p className="uppercase text-sm flex items-center gap-2">
                ✔ Verified Artist
              </p>

              <h1 className="text-7xl font-bold mt-2">
                {artistName}
              </h1>

              <div className="flex gap-4 mt-4 text-white/90">

                <span>
                  {songs.length} songs
                </span>

                <span>
                  •
                </span>

                <span>
                  {monthlyListeners}
                  {" "}
                  monthly listeners
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* CONTROLS */}

      <div className="flex flex-wrap gap-4 mb-12">

        <button
          onClick={() => {
            if (!songs.length)
              return;

            setQueue(songs);

            const first =
              songs[0];

            setTrack(
              first.videoId,
              first.title,
              first.artist,
              first.thumbnail,
              0
            );
          }}
          className="bg-green-500 hover:bg-green-400 text-black px-8 py-4 rounded-full font-bold"
        >
          ▶ Play All
        </button>

        <button
          onClick={() => {
            if (!songs.length)
              return;

            const shuffled =
              [...songs].sort(
                () =>
                  Math.random() -
                  0.5
              );

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
          className="bg-zinc-800 hover:bg-zinc-700 px-8 py-4 rounded-full"
        >
          🔀 Shuffle
        </button>

        <button
          onClick={() => {
            const value =
              !isFollowing;

            setIsFollowing(
              value
            );

            localStorage.setItem(
              `artist-${artistName}`,
              String(value)
            );
          }}
          className={`px-8 py-4 rounded-full font-semibold ${
            isFollowing
              ? "bg-pink-500"
              : "bg-zinc-800"
          }`}
        >
          {isFollowing
            ? "❤️ Following"
            : "🤍 Follow"}
        </button>

      </div>

      {/* TOP TRACKS */}

      <h2 className="text-3xl font-bold mb-6">
        Top Tracks
      </h2>

      <div className="space-y-3 mb-16">

        {songs
          .slice(0, 5)
          .map(
            (
              song: any,
              index: number
            ) => (
              <div
                key={index}
                onClick={() => {
                  setQueue(
                    songs
                  );

                  setTrack(
                    song.videoId,
                    song.title,
                    song.artist,
                    song.thumbnail,
                    index
                  );
                }}
                className="bg-zinc-900 hover:bg-zinc-800 cursor-pointer rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-8 text-zinc-400">
                  {index + 1}
                </div>

                <img
                  src={
                    song.thumbnail
                  }
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover"
                />

                <div className="flex-1">

                  <p className="font-semibold">
                    {song.title}
                  </p>

                  <p className="text-zinc-400 text-sm">
                    {song.artist}
                  </p>

                </div>

                <div className="text-zinc-500 text-sm">
                  {Math.floor(
                    Math.random() *
                      10 +
                      1
                  )}
                  M
                </div>

              </div>
            )
          )}

      </div>

      {/* SONG GRID */}

      <h2 className="text-3xl font-bold mb-6">
        Popular Songs
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-16">

        {songs.map(
          (
            song: any,
            index: number
          ) => (
            <div
              key={index}
              onClick={() => {
                setQueue(
                  songs
                );

                setTrack(
                  song.videoId,
                  song.title,
                  song.artist,
                  song.thumbnail,
                  index
                );
              }}
            >
              <SongCard
                song={{
                  id: song.videoId,
                  title:
                    song.title,
                  artist:
                    song.artist,
                  thumbnail:
                    song.thumbnail,
                  duration:
                    song.duration ||
                    0,
                }}
              />
            </div>
          )
        )}
</div>

{/* ALBUMS */}

<h2 className="text-3xl font-bold mb-6">
  Albums
</h2>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-16">

  {albums.map(
    (album: any, index: number) => (
      <a
  key={index}
  href={`/album/${album.videoId}`}
  className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl p-4 transition block"
>

        <img
          src={album.thumbnail}
          alt=""
          className="w-full aspect-square object-cover rounded-xl mb-4"
        />

        <h3 className="font-semibold truncate">
          {album.title}
        </h3>

        <p className="text-zinc-400 text-sm mt-1">
          Album
        </p>

        <p className="text-zinc-500 text-xs">
          {2018 + (index % 6)}
        </p>

      </a>
    )
  )}
      </div>

      {/* RELATED ARTISTS */}

     <h2 className="text-3xl font-bold mb-6">
  Fans Also Like
</h2>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">

  {relatedArtists.map(
    (artist, index) => (
      <a
        key={index}
        href={`/artist/${encodeURIComponent(
          artist.name
        )}`}
        className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl p-4 transition"
      >

        <img
          src={artist.image}
          alt={artist.name}
          className="w-full aspect-square rounded-full object-cover mb-4"
        />

        <h3 className="font-semibold text-center">
          {artist.name}
        </h3>

        <p className="text-zinc-500 text-sm text-center mt-1">
          Artist
        </p>

      </a>
    )
  )}
      </div>
{/* ABOUT */}

<h2 className="text-3xl font-bold mt-16 mb-6">
  About
</h2>

<div className="bg-zinc-900 rounded-3xl p-8">

  <div className="flex items-center gap-6 mb-6">

    <img
      src={artistImage}
      alt=""
      className="w-28 h-28 rounded-full object-cover"
    />

    <div>

      <h3 className="text-2xl font-bold">
        {artistName}
      </h3>

      <p className="text-zinc-400 mt-2">
        {monthlyListeners} monthly listeners
      </p>

    </div>

  </div>

  <p className="text-zinc-300 leading-8">
    {artistName} is one of the most popular
    artists on MusicFlow. Discover hit songs,
    playlists, albums and fan favorites.
    Listen to the latest releases and enjoy
    an endless collection of music.
  </p>

</div>
    </main>
  );
}