"use client";

import { useRouter } from "next/navigation";

const artists = [
  {
    name: "Arijit Singh",
    image:
      "https://i.scdn.co/image/ab6761610000e5ebf6348e5f9f6d47e66e2b51f4",
  },
  {
    name: "Atif Aslam",
    image:
      "https://i.scdn.co/image/ab6761610000e5eb6fc9f8df238dab28c166a463",
  },
  {
    name: "KK",
    image:
      "https://i.scdn.co/image/ab6761610000e5ebf0f0cb6e7c72d4f5d457f417",
  },
  {
    name: "Shreya Ghoshal",
    image:
      "https://i.scdn.co/image/ab6761610000e5eb4e70d9137bac9c0ed912055e",
  },
];

export default function PopularArtists() {
  const router = useRouter();

  return (
    <section className="mt-14">
      <h2 className="text-3xl font-bold mb-6">
        Popular Artists
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {artists.map((artist) => (
          <div
            key={artist.name}
            onClick={() =>
              router.push(
                `/artist/${encodeURIComponent(
                  artist.name
                )}`
              )
            }
            className="
              cursor-pointer
              bg-white/[0.03]
              backdrop-blur-xl
              border
              border-white/10
              rounded-3xl
              p-4
              hover:scale-105
              transition
            "
          >
            <img
              src={artist.image}
              alt={artist.name}
              className="
                w-full
                aspect-square
                object-cover
                rounded-full
              "
            />

            <h3
              className="
                text-center
                mt-4
                font-semibold
              "
            >
              {artist.name}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}