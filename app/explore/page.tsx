"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Track } from "@/types/music";
import { SongCard } from "@/components/ui/SongCard";
import { motion, Variants } from "framer-motion";
import { Search, Compass, Play, Sparkles, Flame, Plus, ArrowRight, Disc, Music, Smile, Layers } from "lucide-react";
import Link from "next/link";
import PopularArtists from "../../src/components/home/PopularArtists";

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
  { id: "MPREb_HtIOxExZ0cj", title: "Arijit Singh Hits", artist: "Arijit Singh", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80" },
  { id: "MPREb_FCKWeH9GnWF", title: "Jigra Collection", artist: "Achint", image: "https://yt3.googleusercontent.com/F8s9lSInfQQu6PvEl23by6_KPoazHLcjk4226uEZqcabT7w_QQP4IX8nxutH5pLJOtwAi32VfMhRJPo=w226-h226-l90-rj" },
  { id: "MPREb_aak6B9FGA6U", title: "Bollywood Essentials", artist: "Various Artists", image: "https://yt3.googleusercontent.com/FPXzFBDqz2viDjL-yyPFSVLyzc8dv9uLHBVyJIfSc1hTQiGe6Lie2fbVRhMjpYtMD1NLcNo_l3T9Mg=w226-h226-l90-rj" },
  { id: "MPREb_HtIOxExZ0ck", title: "Lofi Bollywood", artist: "Lofi Fruit", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80" },
];

const FEATURED_PLAYLISTS = [
  { id: "chill", title: "Late Night Chill", desc: "Soothing lo-fi beats and soft melodies.", count: 28, image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80" },
  { id: "morning", title: "Morning Energy", desc: "Upbeat tracks to jumpstart your day.", count: 35, image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80" },
  { id: "focus", title: "Focus Flow", desc: "Ambient noise and clean instrumentals.", count: 42, image: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&q=80" },
];

const NEW_RELEASES = [
  { id: "MPREb_FCKWeH9GnWF", title: "Jigra Collection", artist: "Achint", image: "https://yt3.googleusercontent.com/F8s9lSInfQQu6PvEl23by6_KPoazHLcjk4226uEZqcabT7w_QQP4IX8nxutH5pLJOtwAi32VfMhRJPo=w226-h226-l90-rj" },
  { id: "MPREb_aak6B9FGA6U", title: "Bollywood Essentials", artist: "Various Artists", image: "https://yt3.googleusercontent.com/FPXzFBDqz2viDjL-yyPFSVLyzc8dv9uLHBVyJIfSc1hTQiGe6Lie2fbVRhMjpYtMD1NLcNo_l3T9Mg=w226-h226-l90-rj" },
  { id: "MPREb_HtIOxExZ0ck", title: "Lofi Bollywood", artist: "Lofi Fruit", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80" },
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
  { id: "pick1", title: "Acoustic Sunset", artist: "Various Artists", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80" },
  { id: "pick2", title: "Retro Synths", artist: "Synthwave Club", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80" },
];

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [trendingSongs, setTrendingSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const { setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      setTrack: s.setTrack,
      setQueue: s.setQueue,
    }))
  );

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch("/api/search?q=Trending Songs");
      const json = await res.json();
      setTrendingSongs(json.results?.slice(0, 6) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchTrending();
    }, 0);
  }, [fetchTrending]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const playSong = (song: Track, index: number) => {
    setQueue(trendingSongs);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  return (
    <main className="min-h-screen pb-36 text-white text-left space-y-16">
      
      {/* 1. Cinematic Hero Section */}
      <section className="relative px-6 md:px-10 pt-10 pb-6 overflow-hidden">
        {/* Soft Background Orbs */}
        <div className="absolute top-0 left-[-10%] w-[600px] h-[400px] rounded-full bg-purple-950/[0.08] blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[300px] rounded-full bg-pink-950/[0.06] blur-[120px] pointer-events-none" />

        {/* Glass Hero Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 p-6 md:p-10 rounded-[32px] bg-white/[0.015] border border-white/[0.04] backdrop-blur-2xl"
          style={{ boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)" }}
        >
          <div className="space-y-6 max-w-3xl">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
              <Compass size={11} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">
                DISCOVER NEW MUSIC
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-[44px] sm:text-[68px] font-black leading-[0.92] tracking-tighter text-white select-none">
              Explore.
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Without Limits.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm md:text-base text-zinc-500 font-medium leading-relaxed max-w-lg">
              Embark on an audio journey. Discover curated soundscapes, trending charts, and new dimensions of sound.
            </p>

            {/* 2. Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-lg mt-6">
              <div
                className={`relative flex items-center rounded-[22px] bg-white/[0.035] border border-white/[0.06] focus-within:border-purple-500/35 focus-within:bg-white/[0.05] transition-all duration-200 ${
                  isFocused ? "shadow-[0_0_24px_rgba(139,92,246,0.12)]" : ""
                }`}
              >
                <Search className="absolute left-4.5 w-4.5 h-4.5 text-zinc-600 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to play?"
                  className="w-full h-13 pl-12 pr-28 text-sm bg-transparent outline-none text-white placeholder:text-zinc-650 font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-2 h-9 px-5 rounded-[15px] bg-white hover:bg-zinc-150 text-black font-bold text-xs shadow-sm active:scale-95 transition-all duration-150 cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </section>

      {/* 3. Popular Genres (Horizontal Scroll) */}
      <section className="px-6 md:px-10 space-y-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
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

      {/* 4. Trending Albums */}
      <section className="px-6 md:px-10 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
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
          {(() => {
            const uniqueTrendingAlbums = TRENDING_ALBUMS.filter((album, idx, self) =>
              self.findIndex(a => a.id === album.id) === idx
            );
            return uniqueTrendingAlbums.map((album) => (
              <motion.a
                key={album.id}
                href={`/album/${album.id}`}
                whileHover={{ y: -6 }}
                className="group shrink-0 w-[160px] md:w-[185px] flex flex-col gap-3 cursor-pointer text-left focus:outline-none"
              >
                <div className="relative rounded-[22px] overflow-hidden bg-zinc-900 aspect-square border border-white/[0.05] group-hover:border-purple-500/30 transition-all duration-300 shadow-[0_8px_28px_rgba(0,0,0,0.6)]">
                  <img
                    src={album.image}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
              </motion.a>
            ));
          })()}
        </div>
      </section>

      {/* 5. Featured Playlists */}
      <section className="px-6 md:px-10 space-y-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
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
                <img
                  src={playlist.image}
                  alt={playlist.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="font-display text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate tracking-tight">
                  {playlist.title}
                </h3>
                <p className="text-[11px] text-zinc-550 line-clamp-2 mt-1 leading-snug font-medium">
                  {playlist.desc}
                </p>
                <p className="text-[9px] text-zinc-650 font-bold uppercase tracking-wider mt-2">
                  {playlist.count} Songs
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. Popular Artists (Exact home component) */}
      <PopularArtists />

      {/* 7. New Releases (Album carousel) */}
      <section className="px-6 md:px-10 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
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
                <img
                  src={album.image}
                  alt={album.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="px-0.5">
                <p className="font-display text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight tracking-tight">
                  {album.title}
                </p>
                <p className="text-[10px] text-zinc-555 font-medium truncate mt-0.5">{album.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 8. Mood Collections */}
      <section className="px-6 md:px-10 space-y-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
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

      {/* 9. Editor's Picks */}
      <section className="px-6 md:px-10 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
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
                <img
                  src={pick.image}
                  alt={pick.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="font-display text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                  {pick.title}
                </h3>
                <p className="text-[11px] text-zinc-555 truncate mt-1 leading-snug">
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

      {/* 10. Top Charts / Live Rankings */}
      <section className="px-6 md:px-10 space-y-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
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
                  <span className="text-[11px] font-mono text-zinc-650 w-4.5 text-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                      {song.title}
                    </h3>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
                    {song.duration
                      ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
                      : "3:10"}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-black shadow-md transition-opacity">
                    <Play size={10} fill="black" className="text-black ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}