export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-black text-white p-8 pb-32">

      <h1 className="text-5xl font-bold mb-8">
  Explore
</h1>

<div className="mb-10">
  <input
    type="text"
    placeholder="Search songs, artists, albums..."
    className="
      w-full
      max-w-3xl
      h-14
      px-5
      rounded-xl
      bg-zinc-900
      border border-zinc-800
      outline-none
    "
  />
</div>
<div className="flex flex-wrap gap-3 mb-12">

  {[
    "Charts",
    "New Releases",
    "Bollywood",
    "Punjabi",
    "Bengali",
    "Workout",
    "Chill",
    "Party",
  ].map((item) => (
    <button
      key={item}
      className="
        px-5
        py-3
        rounded-xl
        bg-zinc-900
        hover:bg-zinc-800
      "
    >
      {item}
    </button>
  ))}

</div>
<h2 className="text-3xl font-bold mb-6">
  Popular Artists
</h2>
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">

  {[
    "Arijit Singh",
    "Shreya Ghoshal",
    "Atif Aslam",
    "Jubin Nautiyal",
    "Sonu Nigam",
    "Armaan Malik",
  ].map((artist) => (
    <a
      key={artist}
      href={`/artist/${encodeURIComponent(
        artist
      )}`}
      className="
        bg-zinc-900
        rounded-2xl
        p-5
        hover:bg-zinc-800
      "
    >
      <div
        className="
          w-24
          h-24
          mx-auto
          rounded-full
          bg-gradient-to-r
          from-purple-500
          to-blue-500
          mb-3
        "
      />

      <p className="text-center font-semibold">
        {artist}
      </p>

    </a>
  ))}

</div>
<h2 className="text-3xl font-bold mb-6">
  Trending Albums
</h2>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-16">

  {[1,2,3,4,5].map((album) => (

    <div
      key={album}
      className="
        bg-zinc-900
        rounded-2xl
        p-3
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
          mb-3
        "
      />

      <h3 className="font-semibold">
        Trending Album {album}
      </h3>

      <p className="text-zinc-400 text-sm">
        Various Artists
      </p>

    </div>

  ))}

</div>
<h2 className="text-3xl font-bold mb-6">
  Top Charts
</h2>

<div className="space-y-3 mb-16">

  {[1,2,3,4,5].map((item) => (

    <div
      key={item}
      className="
        bg-zinc-900
        rounded-xl
        p-4
        flex
        items-center
        gap-4
      "
    >

      <div className="text-zinc-500 w-8">
        {item}
      </div>

      <div
        className="
          w-14
          h-14
          rounded-lg
          bg-gradient-to-r
          from-purple-500
          to-blue-500
        "
      />

      <div>

        <p className="font-semibold">
          Top Song {item}
        </p>

        <p className="text-zinc-400 text-sm">
          Popular Artist
        </p>

      </div>

    </div>

  ))}

</div>

    </main>
  );
}