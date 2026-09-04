"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Track, ChartTrack, ChartArtist, ChartAlbum } from "@/types/music";
import { motion } from "framer-motion";
import {
  Search,
  Play,
  ArrowRight,
  TrendingUp,
  Flame,
  Heart,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import PopularArtists from "../../src/components/home/PopularArtists";
import { SafeImage } from "@/components/ui/SafeImage";
import { DiscoveryModesBar } from "@/components/discovery/DiscoveryModesBar";

const GENRES = [
  { name: "Bollywood", emoji: "🎬", color: "hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300" },
  { name: "Punjabi", emoji: "🥁", color: "hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-300" },
  { name: "Lo-Fi", emoji: "☁️", color: "hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-indigo-300" },
  { name: "Workout", emoji: "⚡", color: "hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-300" },
  { name: "Chill", emoji: "🌊", color: "hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-teal-300" },
  { name: "Romance", emoji: "💕", color: "hover:border-pink-500/30 hover:bg-pink-500/5 hover:text-pink-300" },
  { name: "Party", emoji: "🎉", color: "hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-300" },
  { name: "Sleep", emoji: "🌙", color: "hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300" },
];

const TRENDING_ALBUMS = [
  { id: "MPREb_HtIOxExZ0cj", title: "Arijit Singh Hits", artist: "Arijit Singh", image: "https://img.youtube.com/vi/T94PHkuyd8c/hqdefault.jpg" },
  { id: "MPREb_FCKWeH9GnWF", title: "Jigra Collection", artist: "Achint", image: "https://yt3.googleusercontent.com/F8s9lSInfQQu6PvEl23by6_KPoazHLcjk4226uEZqcabT7w_QQP4IX8nxutH5pLJOtwAi32VfMhRJPo=w226-h226-l90-rj" },
  { id: "MPREb_aak6B9FGA6U", title: "Bollywood Essentials", artist: "Various Artists", image: "https://yt3.googleusercontent.com/FPXzFBDqz2viDjL-yyPFSVLyzc8dv9uLHBVyJIfSc1hTQiGe6Lie2fbVRhMjpYtMD1NLcNo_l3T9Mg=w226-h226-l90-rj" },
  { id: "MPREb_HtIOxExZ0ck", title: "Lofi Bollywood", artist: "Lofi Fruit", image: "https://img.youtube.com/vi/JgP0vE3D-g8/hqdefault.jpg" },
];

const FEATURED_PLAYLISTS = [
  { id: "chill", title: "Late Night Chill", desc: "Soothing lo-fi beats and soft melodies.", count: 28, image: "https://img.youtube.com/vi/JgP0vE3D-g8/hqdefault.jpg" },
  { id: "morning", title: "Morning Energy", desc: "Upbeat tracks to jumpstart your day.", count: 35, image: "https://img.youtube.com/vi/V0KD0nDkbpM/hqdefault.jpg" },
  { id: "focus", title: "Focus Flow", desc: "Ambient noise and clean instrumentals.", count: 42, image: "https://img.youtube.com/vi/T94PHkuyd8c/hqdefault.jpg" },
];

const NEW_RELEASES = [
  { id: "MPREb_FCKWeH9GnWF", title: "Jigra Collection", artist: "Achint", image: "https://yt3.googleusercontent.com/F8s9lSInfQQu6PvEl23by6_KPoazHLcjk4226uEZqcabT7w_QQP4IX8nxutH5pLJOtwAi32VfMhRJPo=w226-h226-l90-rj" },
  { id: "MPREb_aak6B9FGA6U", title: "Bollywood Essentials", artist: "Various Artists", image: "https://yt3.googleusercontent.com/FPXzFBDqz2viDjL-yyPFSVLyzc8dv9uLHBVyJIfSc1hTQiGe6Lie2fbVRhMjpYtMD1NLcNo_l3T9Mg=w226-h226-l90-rj" },
  { id: "MPREb_HtIOxExZ0ck", title: "Lofi Bollywood", artist: "Lofi Fruit", image: "https://img.youtube.com/vi/JgP0vE3D-g8/hqdefault.jpg" },
];

const MOODS = [
  { name: "Romance", emoji: "💕", bg: "from-pink-500/10 to-transparent", hoverBorder: "group-hover:border-pink-500/30" },
  { name: "Workout", emoji: "⚡", bg: "from-orange-500/10 to-transparent", hoverBorder: "group-hover:border-orange-500/30" },
  { name: "Chill", emoji: "🌊", bg: "from-teal-500/10 to-transparent", hoverBorder: "group-hover:border-teal-500/30" },
  { name: "Focus", emoji: "🎯", bg: "from-blue-500/10 to-transparent", hoverBorder: "group-hover:border-blue-500/30" },
  { name: "Party", emoji: "🎉", bg: "from-purple-500/10 to-transparent", hoverBorder: "group-hover:border-purple-500/30" },
  { name: "Sleep", emoji: "🌙", bg: "from-cyan-500/10 to-transparent", hoverBorder: "group-hover:border-cyan-500/30" },
];

const EDITORS_PICKS = [
  { id: "pick1", title: "Acoustic Sunset", artist: "Various Artists", image: "https://img.youtube.com/vi/V0KD0nDkbpM/hqdefault.jpg" },
  { id: "pick2", title: "Retro Synths", artist: "Synthwave Club", image: "https://img.youtube.com/vi/JgP0vE3D-g8/hqdefault.jpg" },
];

const MOCK_PODCASTS = [
  { id: "pod1", title: "The Huberman Lab", host: "Dr. Andrew Huberman", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&q=80", desc: "Neuroscience and science-based tools for everyday life." },
  { id: "pod2", title: "Lex Fridman Podcast", host: "Lex Fridman", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80", desc: "Conversations about science, tech, history, and philosophy." },
  { id: "pod3", title: "The Daily", host: "The New York Times", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&q=80", desc: "This is what the news should sound like. Twenty minutes a day." },
];

const MOCK_AUDIOBOOKS = [
  { id: "ab1", title: "Atomic Habits", author: "James Clear", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80", duration: "5h 35m", desc: "An easy and proven way to build good habits and break bad ones." },
  { id: "ab2", title: "The Creative Act", author: "Rick Rubin", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80", duration: "6h 12m", desc: "A beautiful and inspiring book about creativity and art." },
  { id: "ab3", title: "Greenlights", author: "Matthew McConaughey", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80", duration: "7h 04m", desc: "An album of Matthew McConaughey's life, lessons, and stories." },
];

const MOCK_RADIO = [
  { id: "rad1", title: "BBC Radio 1", freq: "98.1 FM", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500&q=80", desc: "Hot new UK chart hits and music news." },
  { id: "rad2", title: "Jazz FM", freq: "102.5 FM", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&q=80", desc: "Smooth jazz and classical instrumentals." },
  { id: "rad3", title: "NPR News Radio", freq: "89.3 FM", image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&q=80", desc: "National Public Radio news and discussions." },
];

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"music" | "charts" | "podcasts" | "audiobooks" | "radio">("music");
  
  // Real-time dynamic charts state
  const [chartTracks, setChartTracks] = useState<ChartTrack[]>([]);
  const [chartArtists, setChartArtists] = useState<ChartArtist[]>([]);
  const [chartAlbums, setChartAlbums] = useState<ChartAlbum[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  const { setTrack, setQueue, queue, likedSongs, toggleLike, videoId, isPlaying } = usePlayerStore(
    useShallow((s) => ({
      setTrack: s.setTrack,
      setQueue: s.setQueue,
      queue: s.queue,
      likedSongs: s.likedSongs,
      toggleLike: s.toggleLike,
      videoId: s.videoId,
      isPlaying: s.isPlaying,
    }))
  );

  useEffect(() => {
    let isMounted = true;
    async function loadCharts() {
      try {
        setChartsLoading(true);
        const res = await fetch("/api/charts");
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setChartTracks(json.tracks || []);
            setChartArtists(json.artists || []);
            setChartAlbums(json.albums || []);
          }
        }
      } catch (err) {
        console.error("Charts fetch error:", err);
      } finally {
        if (isMounted) setChartsLoading(false);
      }
    }
    loadCharts();
    return () => {
      isMounted = false;
    };
  }, []);

  const playSong = (song: Track, index: number) => {
    setQueue(chartTracks);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const playNext = (e: React.MouseEvent, song: Track) => {
    e.stopPropagation();
    const newQueue = [...queue];
    const currentIndex = usePlayerStore.getState().currentIndex;
    newQueue.splice(currentIndex + 1, 0, song);
    setQueue(newQueue);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const renderMovementBadge = (move?: "up" | "down" | "same" | "new") => {
    if (move === "up") {
      return (
        <span className="inline-flex items-center text-[10px] font-mono font-bold text-emerald-400">
          <ArrowUp size={10} className="mr-0.5" />
        </span>
      );
    }
    if (move === "down") {
      return (
        <span className="inline-flex items-center text-[10px] font-mono font-bold text-rose-400">
          <ArrowDown size={10} className="mr-0.5" />
        </span>
      );
    }
    if (move === "new") {
      return (
        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
          NEW
        </span>
      );
    }
    return (
      <span className="text-zinc-600 font-mono text-[10px]">
        <Minus size={10} />
      </span>
    );
  };

  return (
    <main className="min-h-screen text-white select-none pb-36 text-left space-y-5 overflow-hidden">
      {/* 1. Page Header */}
      <section className="relative px-4 md:px-8 pt-4 pb-1">


        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight text-white">
            Explore &amp; Browse
          </h1>
          <p className="text-xs text-zinc-400 max-w-md">
            Discover real-time dynamic charts, genres, new releases, and curated collections.
          </p>
        </div>
      </section>

      {/* 2. Interactive Search & Category Selector Bar */}
      <section className="px-4 md:px-8 relative z-10 space-y-3">
        <div
          className="p-3 md:p-4 rounded-xl space-y-3"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--mf-border)",
          }}
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: isFocused ? "var(--mf-accent-light)" : "var(--mf-text-dim)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search songs, charts, genres, albums, podcasts..."
              className="w-full h-11 pl-10 pr-24 rounded-xl text-[12px] font-semibold text-white outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: `1px solid ${isFocused ? "rgba(124,58,237,0.40)" : "var(--mf-border)"}`,
                boxShadow: isFocused ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
              }}
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 h-8 px-4 rounded-lg text-white font-bold text-[11px] transition active:scale-95 shadow-sm cursor-pointer"
              style={{ background: "var(--mf-accent)" }}
            >
              Search
            </button>
          </form>

          {/* Category Selector Pills */}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--mf-border-soft)" }}>
            <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { id: "music", label: "Featured & Moods", emoji: "🎵" },
                { id: "charts", label: "Real-Time Charts", emoji: "📈" },
                { id: "podcasts", label: "Podcasts", emoji: "🎙️" },
                { id: "audiobooks", label: "Audiobooks", emoji: "📚" },
                { id: "radio", label: "Live Radio", emoji: "📻" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as "music" | "charts" | "podcasts" | "audiobooks" | "radio")}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                    activeCategory === cat.id
                      ? "bg-white text-black border-white shadow-sm"
                      : "bg-white/[0.02] text-zinc-400 border-white/[0.05] hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Discovery Modes Bar */}
        <DiscoveryModesBar />
      </section>

      {/* 3. Main Views */}
      {activeCategory === "charts" ? (
        /* Real-Time Dynamic Charts View */
        <section className="px-4 md:px-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-2">
                <TrendingUp size={12} />
                Live Dynamic Metrics
              </div>
              <h2 className="font-display text-[26px] md:text-[34px] font-black text-white tracking-tight leading-none">
                Top Real-Time Charts
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Updated in real time based on streaming volume and popularity velocity.
              </p>
            </div>
            <Link
              href="/genres"
              className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-2"
            >
              <span>Explore Genre Rankings</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Chart Tracks Ranking Table */}
          <div className="p-5 md:p-6 rounded-[28px] bg-white/[0.015] border border-white/[0.04] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] text-[10px] uppercase font-black tracking-wider text-zinc-500">
              <div className="flex items-center gap-6">
                <span className="w-8 text-center">Rank</span>
                <span>Title</span>
              </div>
              <div className="flex items-center gap-8">
                <span className="hidden md:inline">Duration</span>
                <span className="w-16 text-right">Actions</span>
              </div>
            </div>

            {chartsLoading ? (
              <div className="space-y-3 animate-pulse pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-14 bg-white/[0.02] border border-white/[0.04] rounded-2xl w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {chartTracks.map((track, idx) => {
                  const isCurrent = track.videoId === videoId;
                  const isCurrentPlaying = isCurrent && isPlaying;
                  const isLiked = likedSongs.some((s) => s.videoId === track.videoId);

                  return (
                    <div
                      key={`${track.videoId}-${idx}`}
                      onClick={() => playSong(track, idx)}
                      className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.035] hover:border-purple-500/20 transition-all duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Rank + Movement */}
                        <div className="w-8 flex flex-col items-center justify-center shrink-0">
                          <span className={`text-xs font-black font-mono ${idx < 3 ? "text-amber-400 font-bold" : "text-zinc-400"}`}>
                            {track.rank}
                          </span>
                          <span className="mt-0.5">{renderMovementBadge(track.movement)}</span>
                        </div>

                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/5 relative">
                          <SafeImage
                            src={track.thumbnail}
                            videoId={track.videoId}
                            title={track.title}
                            artist={track.artist}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            fallbackType="song"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={10} fill="white" className="text-white ml-0.5" />
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-xs font-bold truncate ${isCurrent ? "text-purple-300 font-black" : "text-zinc-200 group-hover:text-white"}`}>
                              {track.title}
                            </p>
                            {isCurrentPlaying && (
                              <span className="flex items-end gap-0.5 h-3 shrink-0">
                                <span className="w-0.5 h-2 bg-purple-400 animate-pulse" />
                                <span className="w-0.5 h-3 bg-purple-300 animate-pulse delay-75" />
                                <span className="w-0.5 h-1.5 bg-purple-400 animate-pulse delay-150" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="hidden md:inline text-[10px] font-mono text-zinc-500 tabular-nums">
                          {track.duration ? formatDur(track.duration) : "3:30"}
                        </span>
                        <button
                          onClick={(e) => playNext(e, track)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-[10px] font-bold text-zinc-400 hover:text-white border border-white/[0.04] transition opacity-0 group-hover:opacity-100"
                        >
                          Play Next
                        </button>
                        <button
                          onClick={() => toggleLike(track)}
                          className={`p-1.5 rounded-lg transition ${isLiked ? "text-pink-500" : "text-zinc-600 hover:text-white"}`}
                          aria-label="Like song"
                        >
                          <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Charting Artists & Albums Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Charting Artists */}
            <div className="p-6 rounded-[28px] bg-white/[0.015] border border-white/[0.04] space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-black text-white flex items-center gap-2">
                  <Flame size={15} className="text-orange-400" /> Top Charting Artists
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Top 10</span>
              </div>
              <div className="space-y-2">
                {chartArtists.map((artist) => (
                  <div
                    key={artist.name}
                    onClick={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] hover:border-purple-500/20 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-center text-xs font-mono font-bold text-zinc-500">
                        {artist.rank}
                      </span>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-950 border border-white/5 shrink-0">
                        <SafeImage src={artist.image} alt={artist.name} className="w-full h-full object-cover" fallbackType="artist" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                          {artist.name}
                        </p>
                        <p className="text-[9px] text-zinc-500">
                          {artist.monthlyListeners ? `${artist.monthlyListeners} monthly listeners` : "Trending Artist"}
                        </p>
                      </div>
                    </div>
                    {renderMovementBadge(artist.movement)}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Charting Albums */}
            <div className="p-6 rounded-[28px] bg-white/[0.015] border border-white/[0.04] space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-black text-white flex items-center gap-2">
                  <Sparkles size={15} className="text-purple-400" /> Top Charting Albums
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Top 10</span>
              </div>
              <div className="space-y-2">
                {chartAlbums.map((album) => (
                  <div
                    key={album.albumId}
                    onClick={() => router.push(`/album/${album.albumId}`)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] hover:border-purple-500/20 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-center text-xs font-mono font-bold text-zinc-500">
                        {album.rank}
                      </span>
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 border border-white/5 shrink-0">
                        <SafeImage src={album.thumbnail} title={album.name} artist={album.artist} alt={album.name} className="w-full h-full object-cover" fallbackType="album" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                          {album.name}
                        </p>
                        <p className="text-[9px] text-zinc-500 truncate">
                          {album.artist}{album.year ? ` · ${album.year}` : ""}
                        </p>
                      </div>
                    </div>
                    {renderMovementBadge(album.movement)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : activeCategory === "music" ? (
        /* Featured & Moods View */
        <>
          {/* Quick Genres Grid */}
          <section className="px-4 md:px-10 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                  GENRE SELECTION
                </p>
                <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                  Popular Genres
                </h2>
              </div>
              <Link
                href="/genres"
                className="text-[11px] text-zinc-500 hover:text-zinc-350 transition-colors font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <span>Browse all genres</span>
                <ArrowRight size={11} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
              {GENRES.map((genre) => (
                <motion.button
                  key={genre.name}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/genres`)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full bg-white/[0.025] border border-white/[0.05] text-[12px] font-bold text-zinc-300 hover:text-white transition-all duration-200 cursor-pointer select-none shrink-0 focus:outline-none ${genre.color}`}
                >
                  <span>{genre.emoji}</span>
                  <span>{genre.name}</span>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Trending Albums */}
          <section className="px-4 md:px-10 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                  RELEASES
                </p>
                <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                  Trending Albums
                </h2>
              </div>
              <Link
                href="/search?q=album"
                className="text-[11px] text-zinc-500 hover:text-zinc-350 transition-colors font-bold uppercase tracking-wider"
              >
                See all
              </Link>
            </div>
            <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
              {TRENDING_ALBUMS.map((album) => (
                <motion.div
                  key={album.id}
                  onClick={() => router.push(`/album/${album.id}`)}
                  whileHover={{ y: -6 }}
                  className="group shrink-0 w-[160px] md:w-[185px] flex flex-col gap-3 cursor-pointer text-left focus:outline-none"
                >
                  <div className="relative rounded-[22px] overflow-hidden bg-zinc-900 aspect-square border border-white/[0.05] group-hover:border-purple-500/30 transition-all duration-300 shadow-[0_8px_28px_rgba(0,0,0,0.6)]">
                    <SafeImage
                      src={album.image}
                      title={album.title}
                      artist={album.artist}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="album"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
                        <Play size={14} fill="black" className="text-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="px-0.5">
                    <p className="font-display text-[13px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight tracking-tight">
                      {album.title}
                    </p>
                    <p className="text-[11px] text-zinc-550 font-medium truncate mt-0.5">{album.artist}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Featured Playlists */}
          <section className="px-4 md:px-10 space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                CURATED
              </p>
              <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                Featured Playlists
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {FEATURED_PLAYLISTS.map((playlist) => (
                <motion.div
                  key={playlist.id}
                  whileHover={{ y: -6 }}
                  className="group relative p-4 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/25 hover:bg-white/[0.035] transition-all duration-300 overflow-hidden flex gap-4 cursor-pointer"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(playlist.title)}`)}
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-zinc-950 border border-white/5 shadow-md">
                    <SafeImage
                      src={playlist.image}
                      alt={playlist.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="song"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-display text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate tracking-tight">
                      {playlist.title}
                    </h3>
                    <p className="text-[11px] text-zinc-550 line-clamp-2 mt-1 leading-snug font-medium">
                      {playlist.desc}
                    </p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider mt-2">
                      {playlist.count} Songs
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Popular Artists */}
          <PopularArtists />

          {/* New Releases */}
          <section className="px-4 md:px-10 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                  FRESH MUSIC
                </p>
                <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                  New Releases
                </h2>
              </div>
              <Link
                href="/search?q=hits"
                className="text-[11px] text-zinc-500 hover:text-zinc-350 transition-colors font-bold uppercase tracking-wider"
              >
                See all
              </Link>
            </div>
            <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
              {NEW_RELEASES.map((album) => (
                <motion.div
                  key={`new-${album.id}`}
                  whileHover={{ y: -6 }}
                  onClick={() => router.push(`/album/${album.id}`)}
                  className="group shrink-0 w-[140px] md:w-[160px] flex flex-col gap-3 cursor-pointer text-left focus:outline-none"
                >
                  <div className="relative rounded-[20px] overflow-hidden bg-zinc-900 aspect-square border border-white/[0.05] group-hover:border-purple-500/30 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                    <SafeImage
                      src={album.image}
                      title={album.title}
                      artist={album.artist}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="album"
                    />
                  </div>
                  <div className="px-0.5">
                    <p className="font-display text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight tracking-tight">
                      {album.title}
                    </p>
                    <p className="text-[10px] text-zinc-550 font-medium truncate mt-0.5">{album.artist}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Mood Collections */}
          <section className="px-4 md:px-10 space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                ATMOSPHERE
              </p>
              <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                Mood Collections
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
              {MOODS.map((mood) => (
                <motion.div
                  key={mood.name}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(mood.name)}`)}
                  className="group relative h-24 rounded-2xl cursor-pointer p-4 overflow-hidden border border-white/[0.04] bg-gradient-to-br bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-350 tracking-wider transition-colors">Vibe</span>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-display text-[13px] font-bold text-zinc-300 group-hover:text-white transition-colors">{mood.name}</span>
                    <span className="text-lg">{mood.emoji}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Editor's Picks */}
          <section className="px-4 md:px-10 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                  CURATOR SELECTED
                </p>
                <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                  Editor&apos;s Picks
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EDITORS_PICKS.map((pick) => (
                <motion.div
                  key={pick.id}
                  whileHover={{ y: -6 }}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(pick.title)}`)}
                  className="group relative p-4 rounded-3xl bg-white/[0.015] border border-white/[0.04] hover:border-purple-500/20 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer flex gap-4 overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-zinc-900 border border-white/5">
                    <SafeImage
                      src={pick.image}
                      title={pick.title}
                      artist={pick.artist}
                      alt={pick.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="album"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-display text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                      {pick.title}
                    </h3>
                    <p className="text-[11px] text-zinc-550 truncate mt-1 leading-snug">
                      {pick.artist}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center pr-2">
                    <ArrowRight size={13} className="text-zinc-650 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* Podcasts, Audiobooks, Radio category views */
        <section className="px-4 md:px-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(activeCategory === "podcasts"
              ? MOCK_PODCASTS
              : activeCategory === "audiobooks"
              ? MOCK_AUDIOBOOKS
              : MOCK_RADIO
            ).map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -6 }}
                onClick={() => router.push(`/search?q=${encodeURIComponent(item.title)}`)}
                className="p-5 rounded-3xl bg-white/[0.015] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300 cursor-pointer space-y-4"
              >
                <div className="w-full aspect-video rounded-2xl bg-zinc-900 overflow-hidden border border-white/5">
                  <SafeImage src={item.image} alt={item.title} className="w-full h-full object-cover" fallbackType="album" />
                </div>
                <div>
                  <h3 className="font-display text-[14px] font-bold text-zinc-200 leading-snug">{item.title}</h3>
                  <p className="text-[11px] text-zinc-550 mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}