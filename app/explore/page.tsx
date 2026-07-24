"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Track } from "@/types/music";
import { motion } from "framer-motion";
import { Search, Play, ArrowRight } from "lucide-react";
import Link from "next/link";
import PopularArtists from "../../src/components/home/PopularArtists";
import { SafeImage } from "@/components/ui/SafeImage";

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
  { id: "pod1", title: "The Huberman Lab", host: "Dr. Andrew Huberman", image: "", desc: "Neuroscience and science-based tools for everyday life." },
  { id: "pod2", title: "Lex Fridman Podcast", host: "Lex Fridman", image: "", desc: "Conversations about science, tech, history, and philosophy." },
  { id: "pod3", title: "The Daily", host: "The New York Times", image: "", desc: "This is what the news should sound like. Twenty minutes a day." },
];

const MOCK_AUDIOBOOKS = [
  { id: "ab1", title: "Atomic Habits", author: "James Clear", image: "", duration: "5h 35m", desc: "An easy and proven way to build good habits and break bad ones." },
  { id: "ab2", title: "The Creative Act", author: "Rick Rubin", image: "", duration: "6h 12m", desc: "A beautiful and inspiring book about creativity and art." },
  { id: "ab3", title: "Greenlights", author: "Matthew McConaughey", image: "", duration: "7h 04m", desc: "An album of Matthew McConaughey's life, lessons, and stories." },
];

const MOCK_RADIO = [
  { id: "rad1", title: "BBC Radio 1", freq: "98.1 FM", image: "", desc: "Hot new UK chart hits and music news." },
  { id: "rad2", title: "Jazz FM", freq: "102.5 FM", image: "", desc: "Smooth jazz and classical instrumentals." },
  { id: "rad3", title: "NPR News Radio", freq: "89.3 FM", image: "", desc: "National Public Radio news and discussions." },
];

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [trendingSongs, setTrendingSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"music" | "podcasts" | "audiobooks" | "radio">("music");

  const { setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  useEffect(() => {
    let isMounted = true;
    async function loadTrending() {
      try {
        const res = await fetch("/api/search?q=Trending Songs");
        const json = await res.json();
        if (isMounted) {
          setTrendingSongs(json.results?.slice(0, 6) || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadTrending();
    return () => {
      isMounted = false;
    };
  }, []);

  const playSong = (song: Track, index: number) => {
    setQueue(trendingSongs);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <main className="min-h-screen text-white select-none pb-36 text-left space-y-10 overflow-hidden">
      {/* 1. Page Header */}
      <section className="relative px-6 md:px-10 pt-6 md:pt-10 pb-2">
        <div className="absolute top-0 left-[-10%] w-[500px] h-[300px] rounded-full bg-purple-900/[0.07] blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Discovery Hub
          </p>
          <h1 className="font-display text-[44px] sm:text-[60px] font-black leading-[0.92] tracking-tighter text-white">
            Explore.
          </h1>
          <p className="text-[12px] text-zinc-550 font-semibold max-w-md">
            Discover trending charts, new album releases, genre radios, podcasts, and curated playlists.
          </p>
        </div>
      </section>

      {/* 2. Interactive Search & Category Bar */}
      <section className="px-6 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4 md:p-6 rounded-[28px] bg-white/[0.015] border border-white/[0.04] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] space-y-4"
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className={`absolute left-4 top-3.5 w-4 h-4 transition-colors ${isFocused ? "text-purple-400" : "text-zinc-650"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search genres, artists, podcasts, radios..."
              className="w-full h-11 pl-11 pr-24 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs font-semibold text-white placeholder:text-zinc-600 outline-none focus:border-purple-550 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 h-8 px-4 rounded-xl bg-white hover:bg-zinc-150 text-black font-black text-[11px] transition active:scale-95 shadow-sm cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Category Selector Pills */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { id: "music", label: "Music & Albums", emoji: "🎵" },
                { id: "podcasts", label: "Podcasts", emoji: "🎙️" },
                { id: "audiobooks", label: "Audiobooks", emoji: "📚" },
                { id: "radio", label: "Live Radio", emoji: "📻" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as "music" | "podcasts" | "audiobooks" | "radio")}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.15)]"
                      : "bg-white/[0.02] text-zinc-400 border-white/[0.05] hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {activeCategory === "music" ? (
        <>
          {/* Popular Genres */}
          <section className="px-6 md:px-10 space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                Quick Categories
              </p>
              <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                Popular Genres
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
              {GENRES.map((genre) => (
                <motion.button
                  key={genre.name}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(genre.name)}`)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full bg-white/[0.025] border border-white/[0.05] text-[12px] font-bold text-zinc-300 hover:text-white transition-all duration-200 cursor-pointer select-none shrink-0 focus:outline-none ${genre.color}`}
                >
                  <span>{genre.emoji}</span>
                  <span>{genre.name}</span>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Trending Albums */}
          <section className="px-6 md:px-10 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                  Releases
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
            <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
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
          <section className="px-6 md:px-10 space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                Curated
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
          <section className="px-6 md:px-10 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                  Fresh Music
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
            <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
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
          <section className="px-6 md:px-10 space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                Atmosphere
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
          <section className="px-6 md:px-10 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                  Curator Selected
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

          {/* Top Charts */}
          <section className="px-6 md:px-10 space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                Live Rankings
              </p>
              <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                Top Charts
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-16 w-full mf-skeleton rounded-2xl bg-white/[0.015] border border-white/[0.05]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {trendingSongs.map((song, index) => (
                  <div
                    key={`${song.videoId}-${index}`}
                    onClick={() => playSong(song, index)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.015] border border-white/[0.05] hover:border-purple-500/20 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-[11px] font-mono text-zinc-600 w-4.5 text-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                        <SafeImage
                          src={song.thumbnail}
                          videoId={song.videoId}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-zinc-550 truncate mt-0.5">{song.artist}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3">
                      <Play size={10} fill="black" className="ml-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        /* Podcasts, Audiobooks, Radio category views */
        <section className="px-6 md:px-10 space-y-6">
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