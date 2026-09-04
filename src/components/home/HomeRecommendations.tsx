"use client";

import { useEffect, useState, memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";
import { TrackRow } from "@/components/ui/TrackRow";
import { Track } from "@/types/music";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import Link from "next/link";
import { Play } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import PopularArtists from "./PopularArtists";

// ── Skeleton Loader ──
const SectionSkeleton = memo(function SectionSkeleton() {
  return (
    <div className="space-y-4 px-4 md:px-10">
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
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mf-section px-4 md:px-8 text-left"
    >
      <div className="mf-section-header">
        <div>
          {subtitle && (
            <p
              className="text-[9px] font-black uppercase mb-1"
              style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
            >
              {subtitle}
            </p>
          )}
          <h2 className="mf-section-title">{title}</h2>
        </div>
        {seeAllHref && (
          <Link href={seeAllHref} className="mf-see-all">
            See All
          </Link>
        )}
      </div>

      <div className="mf-rail -mx-4 md:-mx-8 px-4 md:px-8">
        {songs.map((song, index) => (
          <div
            key={`${song.videoId}-${index}`}
            className="shrink-0 w-[150px] md:w-[170px] text-left cursor-pointer"
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
            {/* Dynamic AI Scoring Explanation Badge */}
            {(song as { recommendationReason?: string }).recommendationReason && (
              <span
                className="text-[9px] font-bold uppercase tracking-wider block mt-1.5 px-0.5 truncate select-none"
                style={{ color: "var(--mf-accent-light)" }}
              >
                ✨ {(song as { recommendationReason?: string }).recommendationReason}
              </span>
            )}
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
  return (
    <Link href={`/album/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="group shrink-0 w-[150px] md:w-[170px] flex flex-col gap-2.5 cursor-pointer text-left focus:outline-none"
      >
        <div
          className="relative rounded-[16px] overflow-hidden aspect-square transition-all duration-300"
          style={{
            background: "var(--mf-bg-card)",
            border: "1px solid var(--mf-border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <SafeImage
            src={image}
            title={title}
            artist={artist}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            fallbackType="album"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "var(--mf-accent)", color: "#fff" }}
            >
              <Play size={14} fill="currentColor" className="ml-0.5" />
            </div>
          </div>
        </div>
        <div className="px-0.5">
          <p
            className="text-[12px] font-bold leading-tight truncate transition-colors duration-150"
            style={{ color: "var(--mf-text-primary)" }}
          >
            {title}
          </p>
          <p
            className="text-[10px] font-medium truncate mt-0.5"
            style={{ color: "var(--mf-text-muted)" }}
          >
            {artist}
          </p>
        </div>
      </motion.div>
    </Link>
  );
});


// Module-level cache to prevent repeated home page fetches on navigation
let homeCache: {
  trending: Track[];
  releases: Track[];
  recommended: Track[];
  likedFallback: Track[];
  timestamp: number;
} | null = null;
const HOME_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function HomeRecommendations() {
  const { likedSongs, setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      likedSongs: s.likedSongs,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  const [trendingSongs, setTrendingSongs] = useState<Track[]>(() => homeCache?.trending || []);
  const [newReleases, setNewReleases] = useState<Track[]>(() => homeCache?.releases || []);
  const [recommendedSongs, setRecommendedSongs] = useState<Track[]>(() => homeCache?.recommended || []);
  const [likedFallbackSongs, setLikedFallbackSongs] = useState<Track[]>(() => homeCache?.likedFallback || []);
  const [loading, setLoading] = useState<boolean>(() => !homeCache || Date.now() - homeCache.timestamp > HOME_CACHE_TTL);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeContent() {
      // Use cache if fresh
      if (homeCache && Date.now() - homeCache.timestamp < HOME_CACHE_TTL) {
        setTrendingSongs(homeCache.trending);
        setNewReleases(homeCache.releases);
        setRecommendedSongs(homeCache.recommended);
        setLikedFallbackSongs(homeCache.likedFallback);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [trendingRes, releasesRes, recRes] = await Promise.all([
          fetch("/api/search?q=Trending Songs").then((r) => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] })),
          fetch("/api/search?q=Latest Hits").then((r) => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] })),
          fetch(`/api/search?q=${encodeURIComponent(likedSongs.length > 0 ? `${likedSongs[0].artist} radio` : "Chill Lofi Beats")}`)
            .then((r) => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] })),
        ]);

        const trending = trendingRes.results?.slice(0, 10) || [];
        const releases = releasesRes.results?.slice(0, 8) || [];
        const recommended = recRes.results?.slice(0, 8) || [];

        let likedFallback: Track[] = [];
        if (likedSongs.length > 0) {
          const randomLiked = likedSongs[Math.floor(Math.random() * likedSongs.length)];
          const fbRes = await fetch(`/api/search?q=${encodeURIComponent(randomLiked.title)}`)
            .then((r) => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] }));
          likedFallback = (fbRes.results || []).filter((s: Track) => s.videoId !== randomLiked.videoId).slice(0, 8);
        }

        if (isMounted) {
          setTrendingSongs(trending);
          setNewReleases(releases);
          setRecommendedSongs(recommended);
          setLikedFallbackSongs(likedFallback);
          setLoading(false);

          homeCache = {
            trending,
            releases,
            recommended,
            likedFallback,
            timestamp: Date.now(),
          };
        }
      } catch (err) {
        console.error("Error loading home data:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadHomeContent();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

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
      image: "https://img.youtube.com/vi/JFcgOboQZ08/hqdefault.jpg",
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
      id: "MPREb_HtIOxExZ0ck",
      title: "Kabir Singh",
      artist: "Sachet Tandon",
      image: "https://img.youtube.com/vi/V0KD0nDkbpM/hqdefault.jpg",
    },
    {
      id: "MPREb_HtIOxExZ0cl",
      title: "Kesariya & Romantic Hits",
      artist: "Pritam, Arijit Singh",
      image: "https://img.youtube.com/vi/k4yXQkG2s1E/hqdefault.jpg",
    },
    {
      id: "MPREb_HtIOxExZ0cm",
      title: "Global Pop 2026",
      artist: "Top Charts",
      image: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
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
    <div className="space-y-6 md:space-y-7 pt-1">
      {/* ── Top Songs Today (Ranked Song Rows) ── */}
      {trendingSongs.length > 0 && (
        <section className="px-4 md:px-8 text-left">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
                Charts
              </p>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Top Songs Today
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              See all
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
            {trendingSongs.slice(0, 8).map((song, idx) => (
              <TrackRow
                key={`top-${song.videoId}-${idx}`}
                song={song}
                index={idx}
                onPlay={(s, i) => playSong(s, i, trendingSongs)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending Now */}
      <HScrollSection
        title="Trending Now"
        subtitle="Charts"
        songs={trendingSongs}
        onPlay={playSong}
      />

      {/* Recommended Albums */}
      {/* Trending Albums */}
      <section className="mf-section px-4 md:px-8 text-left">
        <div className="mf-section-header">
          <div>
            <p
              className="text-[9px] font-black uppercase mb-1"
              style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
            >
              Curated
            </p>
            <h2 className="mf-section-title">Trending Albums</h2>
          </div>
          <Link href="/explore" className="mf-see-all">
            See All
          </Link>
        </div>
        <div className="mf-rail -mx-4 md:-mx-8 px-4 md:px-8">
          {trendingAlbums.map((album, idx) => (
            <AlbumTile key={`${album.id}-${idx}`} {...album} idx={idx} />
          ))}
        </div>
      </section>

      {/* Popular Artists */}
      <PopularArtists />

      {/* New Releases */}
      <HScrollSection
        title="New Releases"
        subtitle="Fresh"
        songs={newReleases}
        onPlay={playSong}
      />

      {/* Made For You */}
      {recommendedSongs.length > 0 && (
        <HScrollSection
          title="Made For You"
          subtitle="Personal"
          songs={recommendedSongs}
          onPlay={playSong}
        />
      )}

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
    </div>
  );
}