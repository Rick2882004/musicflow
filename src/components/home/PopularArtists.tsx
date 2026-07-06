"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const artists = [
  { name: "Arijit Singh", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80", genre: "Bollywood" },
  { name: "Atif Aslam", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80", genre: "Romantic" },
  { name: "KK", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80", genre: "Indie Pop" },
  { name: "Shreya Ghoshal", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80", genre: "Classical" },
  { name: "Sonu Nigam", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80", genre: "Playback" },
  { name: "Armaan Malik", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80", genre: "Pop" },
  { name: "Neha Kakkar", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80", genre: "Bollywood" },
  { name: "Yo Yo Honey Singh", image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&q=80", genre: "Hip-Hop" },
];

export default function PopularArtists() {
  const router = useRouter();

  return (
    <section className="px-6 md:px-10 pt-10 pb-4 text-left relative overflow-hidden">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
            Featured
          </p>
          <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
            Popular Artists
          </h2>
        </div>
        <Link
          href="/explore"
          className="text-[11px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider transition-colors active:scale-95"
        >
          See all
        </Link>
      </div>

      {/* Horizontal Scroll Layout */}
      <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
        {artists.map((artist, idx) => (
          <motion.button
            key={artist.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
            className="flex flex-col items-center gap-3 shrink-0 group focus:outline-none"
          >
            {/* Avatar Frame with custom border and shadow */}
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-zinc-900 border border-white/[0.06] group-hover:border-purple-500/40 transition-colors duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
              <img
                src={artist.image}
                alt={artist.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    artist.name
                  )}&background=111118&color=fff&size=256`;
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Inner overlay */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            </div>

            {/* Meta */}
            <div className="text-center">
              <p className="text-[13px] font-bold text-zinc-300 group-hover:text-white transition-colors duration-200 leading-tight">
                {artist.name}
              </p>
              <p className="text-[10px] text-zinc-600 font-medium mt-0.5">{artist.genre}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}