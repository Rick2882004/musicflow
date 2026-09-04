"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";

type ArtistItem = {
  name: string;
  genre: string;
  image: string;
};

const INITIAL_ARTISTS: ArtistItem[] = [
  {
    name: "Arijit Singh",
    genre: "Bollywood",
    image: "https://cdn-images.dzcdn.net/images/artist/ac5350cff290edd5b69fa584b8b1bd4f/500x500-000000-80-0-0.jpg",
  },
  {
    name: "Atif Aslam",
    genre: "Romantic",
    image: "https://cdn-images.dzcdn.net/images/artist/0ea90444148fff9c11d77f06a344724e/500x500-000000-80-0-0.jpg",
  },
  {
    name: "Shreya Ghoshal",
    genre: "Classical",
    image: "https://cdn-images.dzcdn.net/images/artist/3bb832d37d10ff2affcfa9afdc7c68a0/500x500-000000-80-0-0.jpg",
  },
  {
    name: "KK",
    genre: "Indie Pop",
    image: "https://cdn-images.dzcdn.net/images/artist/15b11225390ff41cbc862cbbd9190ee1/500x500-000000-80-0-0.jpg",
  },
  {
    name: "Sonu Nigam",
    genre: "Playback",
    image: "https://cdn-images.dzcdn.net/images/artist/812220125c4f0db57050438b65afcf78/500x500-000000-80-0-0.jpg",
  },
  {
    name: "Armaan Malik",
    genre: "Pop",
    image: "https://cdn-images.dzcdn.net/images/artist/3aacd4e00a34aefb6041d30e0cc5bc5e/500x500-000000-80-0-0.jpg",
  },
  {
    name: "Neha Kakkar",
    genre: "Bollywood",
    image: "https://cdn-images.dzcdn.net/images/artist/3a0f7ba65d6d8c1081b461ee49cb59e8/500x500-000000-80-0-0.jpg",
  },
  {
    name: "Yo Yo Honey Singh",
    genre: "Hip-Hop",
    image: "https://cdn-images.dzcdn.net/images/artist/7859b461c10352f02a11368905f0903f/500x500-000000-80-0-0.jpg",
  },
];

export default function PopularArtists() {
  const [artistList, setArtistList] = useState<ArtistItem[]>(INITIAL_ARTISTS);

  useEffect(() => {
    let isMounted = true;
    async function loadArtistImages() {
      // If any artist has an empty image, fetch it
      const missing = artistList.filter((a) => !a.image);
      if (missing.length === 0) return;

      const updated = await Promise.all(
        artistList.map(async (artist) => {
          if (artist.image) return artist;
          try {
            const res = await fetch(`/api/artist-image?artist=${encodeURIComponent(artist.name)}`);
            const data = await res.json();
            return {
              ...artist,
              image: data.image || "",
            };
          } catch {
            return artist;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <section className="mf-section px-4 md:px-8 select-none text-left">
      <div className="mf-section-header">
        <div>
          <p
            className="text-[9px] font-black uppercase mb-1"
            style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
          >
            Discover
          </p>
          <h2 className="mf-section-title">Popular Artists</h2>
        </div>
        <Link href="/explore" className="mf-see-all">
          See All
        </Link>
      </div>

      <div className="mf-rail -mx-4 md:-mx-8 px-4 md:px-8">
        {artistList.map((artist) => (
          <Link
            key={artist.name}
            href={`/artist/${encodeURIComponent(artist.name)}`}
            className="group flex flex-col items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.03] transition-all duration-150 cursor-pointer select-none text-center w-[110px] md:w-[124px] shrink-0"
          >
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-zinc-900 border border-white/[0.08] shadow-md transition-transform duration-200 group-hover:scale-105">
              <SafeImage
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover"
                fallbackType="artist"
              />
            </div>
            <div className="w-full px-1">
              <p className="text-[12px] font-bold text-zinc-200 group-hover:text-white truncate transition-colors leading-tight">
                {artist.name}
              </p>
              <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                {artist.genre || "Artist"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}