export default function PopularArtists() {
  const artists = [
    "Arijit Singh",
    "Shreya Ghoshal",
    "Atif Aslam",
    "Jubin Nautiyal",
    "Sonu Nigam",
    "Armaan Malik",
  ];

  return (
    <section>
      <h2 className="text-3xl font-bold mb-5">
        Popular Artists
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {artists.map((artist) => (
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
    </section>
  );
}