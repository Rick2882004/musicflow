"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";
import { TrackRow } from "@/components/ui/TrackRow";
import { Track, ChartAlbum } from "@/types/music";
import { DiscoverySection } from "@/lib/ai/discovery/types";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import Link from "next/link";
import { Play } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import PopularArtists from "./PopularArtists";
import MoodSection from "./MoodSection";
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

// ── Cross-Section Track Deduplication Helper ──
interface DeduplicatedSectionsResult {
  madeForYou?: DiscoverySection;
  becauseYouListen?: DiscoverySection;
  currentVibe?: DiscoverySection;
  dailyMix?: DiscoverySection;
  otherDiscovery: DiscoverySection[];
  topSongs: Track[];
  discoverNew?: DiscoverySection;
  newReleases: Track[];
}

function deduplicateSections(
  initialRecentSongs: Track[],
  discoverySections: DiscoverySection[],
  topSongs: Track[],
  newReleases: Track[]
): DeduplicatedSectionsResult {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  function registerTrack(t: Track) {
    if (t.videoId) seenIds.add(t.videoId);
    const norm = t.title ? t.title.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    if (norm) seenTitles.add(norm);
  }

  function filterTracks(tracks: Track[], minRetain: number = 3): Track[] {
    const kept: Track[] = [];
    for (const t of tracks) {
      if (!t.videoId) continue;
      const norm = t.title ? t.title.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
      const isDuplicate = seenIds.has(t.videoId) || (norm ? seenTitles.has(norm) : false);
      if (!isDuplicate) {
        kept.push(t);
        registerTrack(t);
      }
    }
    // "Do NOT destroy sections just to achieve perfect deduplication if there are too few results."
    if (kept.length < minRetain && tracks.length >= minRetain) {
      for (const t of tracks) registerTrack(t);
      return tracks;
    }
    return kept;
  }

  // 1. Register Continue Listening (Hero picks)
  for (const t of initialRecentSongs.slice(0, 6)) {
    registerTrack(t);
  }

  // 2. Filter Discovery Sections by section priority:
  // Made For You -> Because You Listen -> Current Vibe -> Daily Mix
  const priorityOrder = [
    "home-made-for-you",
    "home-trending-worldwide",
    "home-because-you-listen",
    "home-current-vibe",
    "home-daily-mix",
  ];

  const filteredDiscoveryMap = new Map<string, DiscoverySection>();
  for (const id of priorityOrder) {
    const sec = discoverySections.find((s) => s.sectionId === id);
    if (sec) {
      const filtered = filterTracks(sec.tracks, 3);
      if (filtered.length >= 3) {
        filteredDiscoveryMap.set(id, { ...sec, tracks: filtered });
      }
    }
  }

  // 3. Filter Top Songs Today (Charts)
  const filteredTopSongs = filterTracks(topSongs, 4);

  // 4. Filter Discover Something New
  const discoverNewSec = discoverySections.find((s) => s.sectionId === "home-discover-new");
  let filteredDiscoverNew: DiscoverySection | undefined;
  if (discoverNewSec) {
    const filtered = filterTracks(discoverNewSec.tracks, 3);
    if (filtered.length >= 3) {
      filteredDiscoverNew = { ...discoverNewSec, tracks: filtered };
    }
  }

  // Any other discovery sections
  const otherDiscoverySections: DiscoverySection[] = [];
  for (const sec of discoverySections) {
    if (!priorityOrder.includes(sec.sectionId) && sec.sectionId !== "home-discover-new") {
      const filtered = filterTracks(sec.tracks, 3);
      if (filtered.length >= 3) {
        otherDiscoverySections.push({ ...sec, tracks: filtered });
      }
    }
  }

  // 5. Filter New Releases
  const filteredReleases = filterTracks(newReleases, 3);

  return {
    madeForYou: filteredDiscoveryMap.get("home-made-for-you") || filteredDiscoveryMap.get("home-trending-worldwide"),
    becauseYouListen: filteredDiscoveryMap.get("home-because-you-listen"),
    currentVibe: filteredDiscoveryMap.get("home-current-vibe"),
    dailyMix: filteredDiscoveryMap.get("home-daily-mix"),
    otherDiscovery: otherDiscoverySections,
    topSongs: filteredTopSongs,
    discoverNew: filteredDiscoverNew,
    newReleases: filteredReleases,
  };
}

// Module-level cache to prevent repeated home page fetches on navigation
let homeCache: {
  topSongs: Track[];
  releases: Track[];
  albums: ChartAlbum[];
  discoverySections: DiscoverySection[];
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

  const [topSongs, setTopSongs] = useState<Track[]>(() => homeCache?.topSongs || []);
  const [newReleases, setNewReleases] = useState<Track[]>(() => homeCache?.releases || []);
  const [trendingAlbums, setTrendingAlbums] = useState<ChartAlbum[]>(() => homeCache?.albums || []);
  const [discoverySections, setDiscoverySections] = useState<DiscoverySection[]>(() => homeCache?.discoverySections || []);
  const [loadingCharts, setLoadingCharts] = useState<boolean>(() => !homeCache || Date.now() - homeCache.timestamp > HOME_CACHE_TTL);
  const [loadingDiscovery, setLoadingDiscovery] = useState<boolean>(() => !homeCache || Date.now() - homeCache.timestamp > HOME_CACHE_TTL);

  useEffect(() => {
    let isMounted = true;

    // If cache is fresh, data was already initialized from state initializer
    if (homeCache && Date.now() - homeCache.timestamp < HOME_CACHE_TTL) {
      return;
    }

    // ── 1. Fast Catalog & Charts Loading (Non-blocking) ──
    async function loadCatalog() {
      try {
        const [topRes, releasesRes, chartsRes] = await Promise.all([
          fetch("/api/search?q=Top Songs Today")
            .then((r) => (r.ok ? r.json() : { results: [] }))
            .catch(() => ({ results: [] })),
          fetch("/api/search?q=Latest Hits")
            .then((r) => (r.ok ? r.json() : { results: [] }))
            .catch(() => ({ results: [] })),
          fetch("/api/charts?type=albums")
            .then((r) => (r.ok ? r.json() : { albums: [] }))
            .catch(() => ({ albums: [] })),
        ]);

        const songs: Track[] = (topRes.results || []).filter((t: Track) => t && t.videoId && t.title && t.artist).slice(0, 10);
        const rels: Track[] = (releasesRes.results || []).filter((t: Track) => t && t.videoId && t.title && t.artist).slice(0, 8);
        const rawAlbums: ChartAlbum[] = chartsRes?.albums || [];
        const albums = rawAlbums
          .filter((a) => a.albumId && a.name && !isFakeAlbumId(a.albumId))
          .slice(0, 8);

        if (isMounted) {
          setTopSongs(songs);
          setNewReleases(rels);
          setTrendingAlbums(albums);
          setLoadingCharts(false);

          if (homeCache) {
            homeCache.topSongs = songs;
            homeCache.releases = rels;
            homeCache.albums = albums;
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[HomeRecommendations] Catalog fetch failed:", err);
        }
        if (isMounted) setLoadingCharts(false);
      }
    }

    // ── 2. AI Discovery Loading (With trimmed client signals payload) ──
    async function loadDiscovery() {
      try {
        // Trim transmitted signals to a focused recent window (20–30 entries)
        const trimmedSignals = {
          likedSongs: likedSongs.slice(0, 25),
          recentSongs: recentSongs.slice(0, 15),
          history: history.slice(0, 25),
          followedArtists: followedArtists.slice(0, 15),
          skips: skips.slice(0, 20),
        };

        const res = await fetch("/api/ai/discovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: "home",
            signals: trimmedSignals,
            limit: 12,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const sections: DiscoverySection[] = data.sections || [];
          if (isMounted) {
            setDiscoverySections(sections);
            setLoadingDiscovery(false);

            if (homeCache) {
              homeCache.discoverySections = sections;
            } else {
              homeCache = {
                topSongs: [],
                releases: [],
                albums: [],
                discoverySections: sections,
                timestamp: Date.now(),
              };
            }
          }
        } else {
          if (isMounted) setLoadingDiscovery(false);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[HomeRecommendations] Discovery fetch failed:", err);
        }
        if (isMounted) setLoadingDiscovery(false);
      } finally {
        if (isMounted) {
          homeCache = {
            topSongs: homeCache?.topSongs || [],
            releases: homeCache?.releases || [],
            albums: homeCache?.albums || [],
            discoverySections: homeCache?.discoverySections || [],
            timestamp: Date.now(),
          };
        }
      }
    }

    void loadCatalog();
    void loadDiscovery();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playSong = (song: Track, index: number, songQueue: Track[]) => {
    const uniqueQueue = Array.from(
      new Map(songQueue.map((item) => [item.videoId, item])).values()
    );
    setQueue(uniqueQueue);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  // Cross-section deduplicated content with strict priority order
  const deduped = useMemo(() => {
    return deduplicateSections(recentSongs, discoverySections, topSongs, newReleases);
  }, [recentSongs, discoverySections, topSongs, newReleases]);

  const hasAnyContent =
    deduped.madeForYou ||
    deduped.becauseYouListen ||
    deduped.currentVibe ||
    deduped.dailyMix ||
    deduped.topSongs.length > 0 ||
    trendingAlbums.length > 0;

  if (loadingCharts && loadingDiscovery && !hasAnyContent) {
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
      {/* ── 1. Made For You (or Trending Worldwide for cold start) ── */}
      {deduped.madeForYou && (
        <HScrollSection
          key={deduped.madeForYou.sectionId}
          title={deduped.madeForYou.title}
          subtitle={deduped.madeForYou.subtitle}
          songs={deduped.madeForYou.tracks}
          onPlay={playSong}
          seeAllHref={deduped.madeForYou.seeAllHref}
        />
      )}

      {/* ── 2. Because You Listen To [Top Artist] ── */}
      {deduped.becauseYouListen && (
        <HScrollSection
          key={deduped.becauseYouListen.sectionId}
          title={deduped.becauseYouListen.title}
          subtitle={deduped.becauseYouListen.subtitle}
          songs={deduped.becauseYouListen.tracks}
          onPlay={playSong}
          seeAllHref={deduped.becauseYouListen.seeAllHref}
        />
      )}

      {/* ── 3. Your Current Vibe ── */}
      {deduped.currentVibe && (
        <HScrollSection
          key={deduped.currentVibe.sectionId}
          title={deduped.currentVibe.title}
          subtitle={deduped.currentVibe.subtitle}
          songs={deduped.currentVibe.tracks}
          onPlay={playSong}
        />
      )}

      {/* ── 4. Your [Genre/Language] Mix ── */}
      {deduped.dailyMix && (
        <HScrollSection
          key={deduped.dailyMix.sectionId}
          title={deduped.dailyMix.title}
          subtitle={deduped.dailyMix.subtitle}
          songs={deduped.dailyMix.tracks}
          onPlay={playSong}
        />
      )}

      {/* ── Extra Discovery Sections ── */}
      {deduped.otherDiscovery.map((section) => (
        <HScrollSection
          key={section.sectionId}
          title={section.title}
          subtitle={section.subtitle}
          songs={section.tracks}
          onPlay={playSong}
          seeAllHref={section.seeAllHref}
        />
      ))}

      {/* ── Discovery Loading Skeleton (while catalog is visible) ── */}
      {loadingDiscovery && discoverySections.length === 0 && (
        <SectionSkeleton />
      )}

      {/* ── 5. Top Songs Today (Ranked Song Rows) ── */}
      {deduped.topSongs.length > 0 && (
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
            {deduped.topSongs.slice(0, 8).map((song, idx) => (
              <TrackRow
                key={`top-${song.videoId}-${idx}`}
                song={song}
                index={idx}
                onPlay={(s, i) => playSong(s, i, deduped.topSongs)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── 6. Trending Albums (Real Catalog Only) ── */}
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

      {/* ── 7. Artists You Love / Popular Artists (Dynamic) ── */}
      <PopularArtists />

      {/* ── 8. Discover Something New ── */}
      {deduped.discoverNew && (
        <HScrollSection
          key={deduped.discoverNew.sectionId}
          title={deduped.discoverNew.title}
          subtitle={deduped.discoverNew.subtitle}
          songs={deduped.discoverNew.tracks}
          onPlay={playSong}
        />
      )}

      {/* ── 9. Explore by Vibe ── */}
      <MoodSection />

      {/* ── 10. New Releases ── */}
      {deduped.newReleases.length > 0 && (
        <HScrollSection
          title="New Releases"
          subtitle="Fresh"
          songs={deduped.newReleases}
          onPlay={playSong}
        />
      )}
    </div>
  );
}