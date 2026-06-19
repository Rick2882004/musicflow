import { Sidebar } from "@/components/layout/Sidebar";
import PlayerBar from "@/components/player/PlayerBar";
import TrackCard from "@/components/music/TrackCard";

async function getTracks() {
  const res = await fetch(
    "http://localhost:3000/api/v1/tracks",
    {
      cache: "no-store",
    }
  );

  return res.json();
}

export default async function HomePage() {
  const tracks = await getTracks();

  return (
    <div className="flex bg-black min-h-screen text-white">

      <main className="flex-1 p-8 pb-32">

  {/* Hero Banner */}
  <div className="rounded-3xl p-10 mb-10 bg-gradient-to-r from-violet-700 via-purple-600 to-blue-600">
    <p className="text-zinc-200 mb-2">
      Good Morning 👋
    </p>

    <h1 className="text-5xl font-bold mb-4">
      Your Daily Mix is Ready
    </h1>

    <p className="text-zinc-200 max-w-xl">
      Discover trending tracks, new releases and your favorite playlists.
    </p>

    <div className="flex gap-4 mt-6">
      <button className="bg-white text-black px-6 py-3 rounded-full font-semibold">
        Play Now
      </button>

      <button className="border border-white/40 px-6 py-3 rounded-full">
        Explore
      </button>
    </div>
  </div>

  {/* Section Title */}
  <h2 className="text-2xl font-bold mb-6">
    Trending Music
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tracks.map((track: any) => (
          <TrackCard
  key={track.id}
  title={track.title}
  artist={track.artist.name}
  audioUrl={track.audioUrl}
  coverImage={track.coverImage}
/>
          ))}
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}