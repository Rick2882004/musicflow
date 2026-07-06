"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";
import { Track } from "@/types/music";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import Link from "next/link";
import { Play } from "lucide-react";

// ── Skeleton Loader ──
const SectionSkeleton = memo(function SectionSkeleton() {
  return (
    <div className="space-y-4 px-6 md:px-10">
      <div className="flex items-center gap-3">
        <div className="w-28 h-5 mf-skeleton rounded-lg" />
        <div className="w-14 h-3 mf-skeleton rounded-lg opacity-40" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="shrink-0 w-[160px] space-y-3">
            <div className="w-[160px] h-[160px] mf-skeleton rounded-2xl" />
            <div className="w-3/4 h-3.5 mf-skeleton rounded" />
            <div className="w-1/2 h-2.5 mf-skeleton rounded opacity-50" />
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Horizontal Scroll Section ──
const HScrollSection = memo(function HScrollSection({
  title,
  subtitle,
  songs,
  onPlay,
  seeAllHref,
}: {
  title: string;
  subtitle?: string;
  songs: Track[];
  onPlay: (song: Track, idx: number, queue: Track[]) => void;
  seeAllHref?: string;
}) {
  if (songs.length === 0) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-end justify-between px-6 md:px-10 mb-5 text-left">
        <div>
          {subtitle && (
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              {subtitle}
            </p>
          )}
          <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
            {title}
          </h2>
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-[11px] text-zinc-500 hover:text-zinc-350 transition-colors font-bold uppercase tracking-wider active:scale-95"
          >
            See all
          </Link>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
        {songs.map((song, index) => (
          <div
            key={`${song.videoId}-${index}`}
            className="shrink-0 w-[160px] md:w-[180px]"
            onClick={() => onPlay(song, index, songs)}
          >
            <SongCard
              song={{
                id: song.videoId,
                title: song.title,
                artist: song.artist,
                thumbnail: song.thumbnail,
                duration: song.duration || 180,
              }}
            />
          </div>
        ))}
      </div>
    </motion.section>
  );
});

// ── Album Tile ──
const AlbumTile = memo(function AlbumTile({
  id,
  title,
  artist,
  image,
  idx,
}: {
  id: string;
  title: string;
  artist: string;
  image: string;
  idx: number;
}) {
  const handleErr = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "https://placehold.co/500x500/111/fff?text=Album";
  };

  return (
    <Link href={`/album/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -5 }}
        className="group shrink-0 w-[160px] md:w-[180px] flex flex-col gap-3 cursor-pointer text-left focus:outline-none"
      >
        <div className="relative rounded-[22px] overflow-hidden bg-zinc-900 aspect-square border border-white/[0.05] group-hover:border-purple-500/30 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <img
            src={image}
            alt={title}
            loading="lazy"
            onError={handleErr}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={14} fill="white" className="text-white" />
          </div>
        </div>
        <div className="px-0.5">
          <p className="font-display text-[13px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight tracking-tight">
            {title}
          </p>
          <p className="text-[11px] text-zinc-550 font-medium truncate mt-0.5">{artist}</p>
        </div>
      </motion.div>
    </Link>
  );
});

export default function HomeRecommendations() {
  const { recentSongs, likedSongs, setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      recentSongs: s.recentSongs,
      likedSongs: s.likedSongs,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  const [trendingSongs, setTrendingSongs] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<Track[]>([]);
  const [likedFallbackSongs, setLikedFallbackSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrending = useCallback(async () => {
    try {
      const res = await fetch("/api/search?q=Trending Songs");
      const json = await res.json();
      setTrendingSongs(json.results?.slice(0, 10) || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadReleases = useCallback(async () => {
    try {
      const res = await fetch("/api/search?q=Latest Hits");
      const json = await res.json();
      setNewReleases(json.results?.slice(0, 8) || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadRecommended = useCallback(async () => {
    try {
      const query =
        likedSongs.length > 0 ? `${likedSongs[0].artist} radio` : "Chill Lofi Beats";
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setRecommendedSongs(json.results?.slice(0, 8) || []);
    } catch (error) {
      console.error(error);
    }
  }, [likedSongs]);

  const loadLikedFallback = useCallback(async () => {
    if (likedSongs.length === 0) return;
    try {
      const randomLiked = likedSongs[Math.floor(Math.random() * likedSongs.length)];
      const res = await fetch(`/api/search?q=${encodeURIComponent(randomLiked.title)}`);
      const json = await res.json();
      const songs = (json.results || []).filter(
        (s: Track) => s.videoId !== randomLiked.videoId
      );
      setLikedFallbackSongs(songs.slice(0, 8));
    } catch (error) {
      console.error(error);
    }
  }, [likedSongs]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        await Promise.all([
          loadTrending(),
          loadReleases(),
          loadRecommended(),
          loadLikedFallback(),
        ]);
      } catch (err) {
        console.error("Error loading home songs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [loadTrending, loadReleases, loadRecommended, loadLikedFallback]);

  const playSong = (song: Track, index: number, songQueue: Track[]) => {
    const uniqueQueue = Array.from(
      new Map(songQueue.map((item) => [item.videoId, item])).values()
    );
    setQueue(uniqueQueue);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const trendingAlbums = [
    {
      id: "MPREb_HtIOxExZ0cj",
      title: "Arijit Singh Hits",
      artist: "Arijit Singh",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
    },
    {
      id: "MPREb_FCKWeH9GnWF",
      title: "Jigra Collection",
      artist: "Achint",
      image:
        "https://yt3.googleusercontent.com/F8s9lSInfQQu6PvEl23by6_KPoazHLcjk4226uEZqcabT7w_QQP4IX8nxutH5pLJOtwAi32VfMhRJPo=w226-h226-l90-rj",
    },
    {
      id: "MPREb_aak6B9FGA6U",
      title: "Bollywood Essentials",
      artist: "Various Artists",
      image:
        "https://yt3.googleusercontent.com/FPXzFBDqz2viDjL-yyPFSVLyzc8dv9uLHBVyJIfSc1hTQiGe6Lie2fbVRhMjpYtMD1NLcNo_l3T9Mg=w226-h226-l90-rj",
    },
    {
      id: "MPREb_HtIOxExZ0cj",
      title: "Kabir Singh",
      artist: "Sachet Tandon",
      image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80",
    },
    {
      id: "MPREb_HtIOxExZ0ck",
      title: "Lofi Bollywood",
      artist: "Lofi Fruit",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-12 pt-10 px-0">
        {[1, 2, 3].map((i) => (
          <SectionSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12 pt-6">
      {/* Quick Picks */}
      {recentSongs.length > 0 && (
        <HScrollSection
          title="Quick Picks"
          subtitle="Continue"
          songs={recentSongs.slice(0, 8)}
          onPlay={playSong}
          seeAllHref="/recently-played"
        />
      )}

      {/* Trending Now */}
      <HScrollSection
        title="Trending Now"
        subtitle="Charts"
        songs={trendingSongs}
        onPlay={playSong}
      />

      {/* Recommended Albums */}
      <section>
        <div className="flex items-end justify-between px-6 md:px-10 mb-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              Curated
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Trending Albums
            </h2>
          </div>
          <Link
            href="/explore"
            className="text-[11px] text-zinc-500 hover:text-zinc-350 transition-colors font-bold uppercase tracking-wider"
          >
            See all
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
          {trendingAlbums.map((album, idx) => (
            <AlbumTile key={`${album.id}-${idx}`} {...album} idx={idx} />
          ))}
        </div>
      </section>

      {/* Made For You */}
      <HScrollSection
        title="Made For You"
        subtitle="Personal"
        songs={recommendedSongs}
        onPlay={playSong}
      />

      {/* Because You Liked */}
      {likedSongs.length > 0 && likedFallbackSongs.length > 0 && (
        <HScrollSection
          title="Because You Liked"
          subtitle={likedSongs[0]?.title}
          songs={likedFallbackSongs}
          onPlay={playSong}
          seeAllHref="/liked"
        />
      )}

      {/* New Releases */}
      <HScrollSection
        title="New Releases"
        subtitle="Fresh"
        songs={newReleases}
        onPlay={playSong}
      />
    </div>
  );
}