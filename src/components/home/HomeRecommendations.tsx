"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";


export default function HomeRecommendations() {
  const {
    recentSongs,
    likedSongs,
    setTrack,
    setQueue,
  } = usePlayerStore();

  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);

  useEffect(() => {
    loadTrendingSongs();
    loadNewReleases();
  }, []);

  async function loadTrendingSongs() {
    try {
      const res = await fetch(
        "/api/search?q=Trending Hindi Songs"
      );

      const json = await res.json();

      const songs = Array.isArray(json)
        ? json
        : json.results || [];

      const uniqueSongs = Array.from(
        new Map(
          songs.map((song: any) => [
            `${song.title}-${song.artist}`,
            song,
          ])
        ).values()
      );

      setTrendingSongs(uniqueSongs);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadNewReleases() {
    try {
      const res = await fetch(
        "/api/search?q=Latest Bollywood Hits"
      );

      const json = await res.json();

      const songs = Array.isArray(json)
        ? json
        : json.results || [];

      const uniqueSongs = Array.from(
        new Map(
          songs.map((song: any) => [
            `${song.title}-${song.artist}`,
            song,
          ])
        ).values()
      );

      setNewReleases(uniqueSongs);
    } catch (error) {
      console.error(error);
    }
  }

  const playSong = (
    song: any,
    index: number,
    queue: any[]
  ) => {
    const uniqueQueue = Array.from(
      new Map(
        queue.map((item) => [
          item.videoId,
          item,
        ])
      ).values()
    );

    setQueue(uniqueQueue);

    setTrack(
      song.videoId,
      song.title,
      song.artist,
      song.thumbnail,
      index
    );
  };

  const popularArtists = [
    "Arijit Singh",
    "Shreya Ghoshal",
    "Atif Aslam",
    "Jubin Nautiyal",
    "Sonu Nigam",
    "Armaan Malik",
  ];

  const moods = [
    "Romance",
    "Workout",
    "Chill",
    "Focus",
    "Party",
    "Sleep",
    "Travel",
    "Sad",
    "Happy",
    "LoFi",
    "Bollywood",
    "Punjabi",
  ];

  return (
    <div className="space-y-16 mt-10">

      {recentSongs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-3xl font-bold">
              Quick Picks
            </h2>

            <span className="text-zinc-400 text-sm">
              Based on your recent plays
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentSongs
              .slice(0, 6)
              .map((song: any, index: number) => (
                <div
                  key={`${song.videoId}-quick-${index}`}
                  onClick={() =>
                    playSong(
                      song,
                      index,
                      recentSongs
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
              ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-3xl font-bold mb-5">
          Trending Now
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {trendingSongs
            .slice(0, 10)
            .map((song: any, index: number) => (
              <div
                key={`${song.videoId}-trending`}
                onClick={() =>
                  playSong(
                    song,
                    index,
                    trendingSongs
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
            ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-5">
          New Releases
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {newReleases
            .slice(0, 5)
            .map((song: any, index: number) => (
              <div
                key={`${song.videoId}-release`}
                onClick={() =>
                  playSong(
                    song,
                    index,
                    newReleases
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
            ))}
        </div>
      </section>

<section>
  <h2 className="text-3xl font-bold mb-5">
    Popular Artists
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {popularArtists.map((artist) => (
      <a
        key={artist}
        href={`/artist/${encodeURIComponent(
          artist
        )}`}
        className="
          bg-zinc-900
          hover:bg-zinc-800
          rounded-2xl
          p-5
          transition
        "
      >
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
            artist
          )}&size=256`}
          alt={artist}
          className="
            w-24
            h-24
            rounded-full
            object-cover
            mx-auto
            mb-4
          "
        />

        <p className="text-center font-semibold">
          {artist}
        </p>

        <p className="text-center text-zinc-500 text-sm">
          Artist
        </p>
      </a>
    ))}
  </div>
</section>
      <section>
        <h2 className="text-3xl font-bold mb-5">
          Moods & Genres
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {moods.map((mood) => (
            <button
  key={mood}
  onClick={() =>
    window.location.href =
      `/search?q=${encodeURIComponent(mood)}`
  }
  className="
    h-20
    rounded-2xl
    bg-zinc-900
    hover:bg-zinc-800
    transition
    font-semibold
  "
>
  {mood}
</button>
          ))}
        </div>
      </section>

    </div>
  );
}