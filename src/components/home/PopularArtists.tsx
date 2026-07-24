"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";

type ArtistItem = {
  name: string;
  genre: string;
  image: string;
};

const INITIAL_ARTISTS = [
  { name: "Arijit Singh", genre: "Bollywood" },
  { name: "Atif Aslam", genre: "Romantic" },
  { name: "KK", genre: "Indie Pop" },
  { name: "Shreya Ghoshal", genre: "Classical" },
  { name: "Sonu Nigam", genre: "Playback" },
  { name: "Armaan Malik", genre: "Pop" },
  { name: "Neha Kakkar", genre: "Bollywood" },
  { name: "Yo Yo Honey Singh", genre: "Hip-Hop" },
];

export default function PopularArtists() {
  const router = useRouter();
  const [artistList, setArtistList] = useState<ArtistItem[]>(
    INITIAL_ARTISTS.map((a) => ({ ...a, image: "" }))
  );

  useEffect(() => {
    let isMounted = true;
    async function loadArtistImages() {
      const updated = await Promise.all(
        INITIAL_ARTISTS.map(async (artist) => {
          try {
            const res = await fetch(`/api/artist-image?artist=${encodeURIComponent(artist.name)}`);
            const data = await res.json();
            return {
              ...artist,
              image: data.image || "",
            };
          } catch {
            return { ...artist, image: "" };
          }
        })
      );
      if (isMounted) {
        setArtistList(updated);
      }
    }
    loadArtistImages();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="px-4 md:px-10 pt-10 pb-4 text-left relative overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
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
      <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
        {artistList.map((artist, idx) => (
          <motion.button
            key={artist.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
            className="flex flex-col items-center gap-3 shrink-0 group focus:outline-none cursor-pointer"
          >
            {/* Avatar Frame with border and shadow */}
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-zinc-900 border border-white/[0.06] group-hover:border-purple-500/40 transition-colors duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
              <SafeImage
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                fallbackType="artist"
              />
              {/* Inner overlay */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            </div>

            {/* Meta */}
            <div className="text-center">
              <p className="text-[13px] font-bold text-zinc-300 group-hover:text-white transition-colors duration-200 leading-tight">
                {artist.name}
              </p>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{artist.genre}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}