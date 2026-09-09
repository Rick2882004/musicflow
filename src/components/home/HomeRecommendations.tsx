"use client";

import { useEffect, useState, memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";
import { TrackRow } from "@/components/ui/TrackRow";
import { Track, ChartAlbum } from "@/types/music";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import Link from "next/link";
import { Play } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import PopularArtists from "./PopularArtists";
import { isFakeAlbumId } from "@/lib/canonical-music";

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

// ── Horizontal Scroll Row Section ──
interface HScrollSectionProps {
  title: string;
  subtitle?: string;
  songs: Track[];
  onPlay?: (song: Track, index: number, songQueue: Track[]) => void;
  seeAllHref?: string;
}

const HScrollSection = memo(function HScrollSection({
  title,
  subtitle = "Section",
  songs,
  seeAllHref = "/explore",
}: HScrollSectionProps) {
  if (songs.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
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
        <Link href={seeAllHref} className="mf-see-all">
          See All
        </Link>
      </div>

      <div className="mf-rail -mx-4 md:-mx-8 px-4 md:px-8">
        {songs.map((song, idx) => (
          <div key={`${song.videoId}-${idx}`} className="shrink-0 w-[148px] md:w-[168px]">
            <SongCard
              song={{
                id: song.videoId,
                title: song.title,
                artist: song.artist,
                thumbnail: song.thumbnail,
                duration: song.duration,
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
            boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
          }}
        >
          <SafeImage
            src={image}
            title={title}
            artist={artist}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackType="album"
          />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.38)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105"
              style={{ background: "#ffffff", color: "#000000" }}
            >
              <Play size={14} fill="black" className="ml-0.5" />
            </div>
          </div>
        </div>
        <div className="px-0.5 space-y-0.5">
          <p
            className="font-display text-[13px] font-bold text-white transition-colors truncate tracking-tight group-hover:text-purple-300"
            title={title}
          >
            {title}
          </p>
          <p
            className="text-[11px] font-medium truncate"
            style={{ color: "var(--mf-text-muted)" }}
            title={artist}
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
  albums: ChartAlbum[];
  discoverySections: import("@/lib/ai/discovery/types").DiscoverySection[];
  timestamp: number;
} | null = null;
const HOME_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export default function HomeRecommendations() {
  const { likedSongs, recentSongs, history, followedArtists, skips, setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      likedSongs: s.likedSongs,
      recentSongs: s.recentSongs,
      history: s.history,
      followedArtists: s.followedArtists,
      skips: s.skips,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  const [trendingSongs, setTrendingSongs] = useState<Track[]>(() => homeCache?.trending || []);
  const [newReleases, setNewReleases] = useState<Track[]>(() => homeCache?.releases || []);
  const [trendingAlbums, setTrendingAlbums] = useState<ChartAlbum[]>(() => homeCache?.albums || []);
  const [discoverySections, setDiscoverySections] = useState<import("@/lib/ai/discovery/types").DiscoverySection[]>(() => homeCache?.discoverySections || []);
  const [loading, setLoading] = useState<boolean>(() => !homeCache || Date.now() - homeCache.timestamp > HOME_CACHE_TTL);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeContent() {
      // Use cache if fresh
      if (homeCache && Date.now() - homeCache.timestamp < HOME_CACHE_TTL) {
        setTrendingSongs(homeCache.trending);
        setNewReleases(homeCache.releases);
        setTrendingAlbums(homeCache.albums);
        setDiscoverySections(homeCache.discoverySections);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [trendingRes, releasesRes, discoveryRes, chartsRes] = await Promise.all([
          fetch("/api/search?q=Trending Songs").then((r) => (r.ok ? r.json() : { results: [] })).catch(() => ({ results: [] })),
          fetch("/api/search?q=Latest Hits").then((r) => (r.ok ? r.json() : { results: [] })).catch(() => ({ results: [] })),
          fetch("/api/ai/discovery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              page: "home",
              signals: {
                likedSongs,
                recentSongs,
                history,
                followedArtists,
                skips,
              },
              limit: 12,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch("/api/charts?type=albums")
            .then((r) => (r.ok ? r.json() : { albums: [] }))
            .catch(() => ({ albums: [] })),
        ]);

        const trending = trendingRes.results?.slice(0, 10) || [];
        const releases = releasesRes.results?.slice(0, 8) || [];
        const sections = discoveryRes?.sections || [];
        const rawAlbums: ChartAlbum[] = chartsRes?.albums || [];
        const validAlbums = rawAlbums
          .filter((a) => a.albumId && a.name && !isFakeAlbumId(a.albumId))
          .slice(0, 8);

        if (isMounted) {
          setTrendingSongs(trending);
          setNewReleases(releases);
          setTrendingAlbums(validAlbums);
          setDiscoverySections(sections);
          setLoading(false);

          homeCache = {
            trending,
            releases,
            albums: validAlbums,
            discoverySections: sections,
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

      {/* Trending Albums (Real Catalog Only) */}
      {trendingAlbums.length > 0 && (
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
              <AlbumTile
                key={`${album.albumId}-${idx}`}
                id={album.albumId}
                title={album.name}
                artist={album.artist || "Various Artists"}
                image={album.thumbnail || ""}
                idx={idx}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular Artists */}
      <PopularArtists />

      {/* Dynamic Central Discovery Engine Sections */}
      {discoverySections.map((section) => (
        <HScrollSection
          key={section.sectionId}
          title={section.title}
          subtitle={section.subtitle}
          songs={section.tracks}
          onPlay={playSong}
          seeAllHref={section.seeAllHref}
        />
      ))}

      {/* New Releases */}
      {newReleases.length > 0 && (
        <HScrollSection
          title="New Releases"
          subtitle="Fresh"
          songs={newReleases}
          onPlay={playSong}
        />
      )}
    </div>
  );
}