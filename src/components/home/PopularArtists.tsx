"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const artists = [
  {
    name: "Arijit Singh",
    image: "https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg",
    followers: "35M followers",
  },
  {
    name: "Atif Aslam",
    image: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    followers: "18M followers",
  },
  {
    name: "KK",
    image: "https://i.ytimg.com/vi/0NFxcNheoLc/hqdefault.jpg",
    followers: "15M followers",
  },
  {
    name: "Shreya Ghoshal",
    image: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    followers: "22M followers",
  },
  {
    name: "Sonu Nigam",
    image: "https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg",
    followers: "14M followers",
  },
  {
    name: "Armaan Malik",
    image: "https://i.ytimg.com/vi/fLexgOxsZu0/hqdefault.jpg",
    followers: "12M followers",
  },
];

export default function PopularArtists() {
  const router = useRouter();

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Popular Artists
          </h2>

          <p className="text-sm text-zinc-500 mt-1">
            Most listened artists this week
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-6">
        {artists.map((artist, idx) => (
          <motion.div
            key={artist.name}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: idx * 0.05,
              duration: 0.45,
            }}
            whileHover={{
              y: -8,
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.98,
            }}
            onClick={() =>
              router.push(
                `/artist/${encodeURIComponent(artist.name)}`
              )
            }
            className="cursor-pointer rounded-3xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-purple-500/30 backdrop-blur-xl transition-all overflow-hidden"
          >
            <div className="p-6 flex flex-col items-center">

              <img
                src={artist.image}
                alt={artist.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/300x300/18181b/ffffff?text=Music";
                }}
                className="w-28 h-28 rounded-full object-cover border-4 border-white/5 shadow-xl group-hover:scale-105 transition"
              />

              <h3 className="mt-5 font-bold text-white text-center">
                {artist.name}
              </h3>

              <p className="text-zinc-500 text-sm mt-1">
                {artist.followers}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}