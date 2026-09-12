"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";

export type ArtistItem = {
  name: string;
  genre: string;
  image: string;
};

// In-memory cache for dynamic popular artists
let popularArtistsCache: { artists: ArtistItem[]; isPersonalized: boolean } | null = null;

export default function PopularArtists({ initialArtists }: { initialArtists?: ArtistItem[] }) {
  const { followedArtists, likedSongs, recentSongs, history } = usePlayerStore(
    useShallow((s) => ({
      followedArtists: s.followedArtists,
      likedSongs: s.likedSongs,
      recentSongs: s.recentSongs,
      history: s.history,
    }))
  );

  const [artistList, setArtistList] = useState<ArtistItem[]>(() => initialArtists || popularArtistsCache?.artists || []);
  const [isPersonalized, setIsPersonalized] = useState<boolean>(() => popularArtistsCache?.isPersonalized || false);
  const [loading, setLoading] = useState<boolean>(() => !initialArtists && !popularArtistsCache);

  useEffect(() => {
    let isMounted = true;

    async function resolveArtists() {
      // If props provided, use them
      if (initialArtists && initialArtists.length > 0) {
        setArtistList(initialArtists);
        setLoading(false);
        return;
      }

      // 1. Gather personalized artists from user store
      const candidateMap = new Map<string, { count: number; image?: string; genre?: string }>();

      // Followed artists have highest priority (+10)
      for (const fa of followedArtists) {
        if (fa.name?.trim()) {
          candidateMap.set(fa.name.trim(), {
            count: 10,
            image: fa.image || undefined,
            genre: fa.genre || "Followed",
          });
        }
      }

      // Liked songs (+3 per track)
      for (const s of likedSongs) {
        if (s.artist?.trim()) {
          const name = s.artist.trim();
          const prev = candidateMap.get(name);
          candidateMap.set(name, {
            count: (prev?.count || 0) + 3,
            image: prev?.image,
            genre: prev?.genre || "Liked Artist",
          });
        }
      }

      // Listening history (+2 per completion)
      for (const h of history) {
        if (h.track?.artist?.trim()) {
          const name = h.track.artist.trim();
          const prev = candidateMap.get(name);
          candidateMap.set(name, {
            count: (prev?.count || 0) + 2,
            image: prev?.image,
            genre: prev?.genre,
          });
        }
      }

      // Recent songs (+1)
      for (const s of recentSongs) {
        if (s.artist?.trim()) {
          const name = s.artist.trim();
          const prev = candidateMap.get(name);
          candidateMap.set(name, {
            count: (prev?.count || 0) + 1,
            image: prev?.image,
            genre: prev?.genre,
          });
        }
      }

      const sortedUserArtists = Array.from(candidateMap.entries())
        .filter(([, meta]) => meta.count >= 2)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, meta]) => ({
          name,
          genre: meta.genre || "Artist",
          image: meta.image || "",
        }));

      const finalArtists: ArtistItem[] = sortedUserArtists.slice(0, 8);
      const userHasArtists = finalArtists.length >= 3;

      // 2. Cold-start fallback: If fewer than 3 personalized artists, fetch genuine chart artists
      if (!userHasArtists) {
        try {
          const chartRes = await fetch("/api/charts?type=artists");
          if (chartRes.ok) {
            const chartData = await chartRes.json();
            const rawChartArtists: Array<{ name: string; image?: string }> = chartData.artists || [];
            const validChartArtists: ArtistItem[] = rawChartArtists
              .filter((a) => a.name?.trim())
              .slice(0, 8)
              .map((a) => ({
                name: a.name.trim(),
                genre: "Popular Artist",
                image: a.image || "",
              }));

            // Merge unique
            const seen = new Set(finalArtists.map((a) => a.name.toLowerCase()));
            for (const ca of validChartArtists) {
              if (!seen.has(ca.name.toLowerCase())) {
                seen.add(ca.name.toLowerCase());
                finalArtists.push(ca);
              }
              if (finalArtists.length >= 8) break;
            }
          }
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[PopularArtists] Failed to fetch chart fallback artists:", err);
          }
        }
      }

      if (!isMounted) return;

      // 3. Resolve missing images via /api/artist-image
      const withImages = await Promise.all(
        finalArtists.map(async (artist) => {
          if (artist.image) return artist;
          try {
            const res = await fetch(`/api/artist-image?artist=${encodeURIComponent(artist.name)}`);
            if (res.ok) {
              const data = await res.json();
              return { ...artist, image: data.image || "" };
            }
            return artist;
          } catch {
            return artist;
          }
        })
      );

      if (isMounted) {
        setArtistList(withImages);
        setIsPersonalized(userHasArtists);
        setLoading(false);
        popularArtistsCache = {
          artists: withImages,
          isPersonalized: userHasArtists,
        };
      }
    }

    resolveArtists();

    return () => {
      isMounted = false;
    };
  }, [followedArtists, likedSongs, recentSongs, history, initialArtists]);


  if (!loading && artistList.length === 0) return null;

  return (
    <section className="mf-section px-4 md:px-8 select-none text-left">
      <div className="mf-section-header">
        <div>
          <p
            className="text-[9px] font-black uppercase mb-1"
            style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
          >
            {isPersonalized ? "Curated" : "Discover"}
          </p>
          <h2 className="mf-section-title">
            {isPersonalized ? "Artists You Love" : "Popular Artists"}
          </h2>
        </div>
        <Link href="/explore" className="mf-see-all">
          See All
        </Link>
      </div>

      <div className="mf-rail -mx-4 md:-mx-8 px-4 md:px-8">
        {loading && artistList.length === 0
          ? [0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={`artist-skel-${i}`}
                className="flex flex-col items-center gap-2 p-1.5 w-[110px] md:w-[124px] shrink-0"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mf-skeleton" />
                <div className="w-16 h-3 rounded mf-skeleton mt-1" />
              </div>
            ))
          : artistList.map((artist) => (
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