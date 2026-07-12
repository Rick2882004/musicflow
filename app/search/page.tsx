"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Search as SearchIcon, X, Clock, Play, HelpCircle, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SafeImage } from "@/components/ui/SafeImage";
import { useRouter, useSearchParams } from "next/navigation";
import { Track } from "@/types/music";
import Link from "next/link";

const CATEGORIES = [
  { title: "Pop",          bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.25)",  text: "#c4b5fd" },
  { title: "Romance",      bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.22)",  text: "#f9a8d4" },
  { title: "Chill & LoFi", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.22)",  text: "#93c5fd" },
  { title: "Workout",      bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.22)",  text: "#fdba74" },
  { title: "Bollywood",    bg: "rgba(217,70,239,0.12)",  border: "rgba(217,70,239,0.22)",  text: "#f0abfc" },
  { title: "Classical",    bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.22)",  text: "#fcd34d" },
];

const TRENDING_SEARCHES = ["Arijit Singh", "KK", "Lofi", "AP Dhillon", "Bollywood", "Workout", "Party", "Rain", "Romance"];

const POPULAR_PLAYLISTS = [
  { id: "chill", name: "Chill Vibez", songsCount: 28, image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80" },
  { id: "morning", name: "Morning Energy", songsCount: 35, image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80" },
  { id: "focus", name: "Focus Flow", songsCount: 42, image: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&q=80" },
];

const STATIC_RECOMMENDED = [
  { videoId: "V0KD0nDkbpM", title: "Arijit Singh Hits", artist: "Arijit Singh", thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80", duration: 180 },
  { videoId: "xRb8hxwN5zc", title: "Kabir Singh", artist: "Sachet Tandon", thumbnail: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80", duration: 240 },
  { videoId: "OkpIoEC44kk", title: "Lofi Bollywood", artist: "Lofi Fruit", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80", duration: 210 },
];

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function SongRow({ song, index, onPlay }: { song: Track; index: number; onPlay: (s: Track, i: number) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onPlay(song, index)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center justify-between px-4 py-3 rounded-[18px] cursor-pointer group transition-all duration-300 select-none"
      style={{
        background: hov ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.012)",
        border: `1px solid ${hov ? "rgba(139,92,246,0.22)" : "rgba(255,255,255,0.04)"}`,
      }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-6 text-center shrink-0">
          {hov ? (
            <Play size={13} fill="white" className="text-white mx-auto" />
          ) : (
            <span className="text-[11px] font-mono text-zinc-600">{index + 1}</span>
          )}
        </div>

        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/5 shadow-sm">
          <SafeImage
            src={song.thumbnail}
            videoId={song.videoId}
            alt={song.title}
            className="w-full h-full object-cover"
            fallbackType="song"
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
            {song.title}
          </p>
          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
          {formatDur(song.duration)}
        </span>
      </div>
    </motion.div>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  interface AlbumItem {
    albumId: string;
    name: string;
    artist: string;
    thumbnail: string;
  }
  interface ArtistItem {
    name: string;
    image: string;
  }

  const [query,          setQuery]          = useState(initialQuery);
  const [results,        setResults]        = useState<Track[]>([]);
  const [artists,        setArtists]        = useState<ArtistItem[]>([]);
  const [albums,         setAlbums]         = useState<AlbumItem[]>([]);
  const [suggestions,    setSuggestions]    = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [activeFilter,   setActiveFilter]   = useState<"all"|"tracks"|"artists"|"albums">("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused,      setIsFocused]      = useState(false);
  const [isListening,    setIsListening]    = useState(false);

  const startVoiceSearch = () => {
    setIsListening(true);
    setTimeout(() => {
      const phrases = ["Kabir Singh", "Lo-Fi study beats", "Arijit Singh Romantic", "Punjabi Hits", "KK Melodies", "Diljit Dosanjh"];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setQuery(randomPhrase);
      setIsListening(false);
      executeSearch(randomPhrase);
    }, 2500);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  const { recentSongs, setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      recentSongs: s.recentSongs,
      setTrack:    s.setTrack,
      setQueue:    s.setQueue,
    }))
  );

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true); setShowSuggestions(false);
    saveSearchQuery(searchQuery);
    try {
      const [resData, artistRes, albumRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then(async (r) => {
            if (!r.ok) return { results: [] };
            try { return await r.json(); } catch { return { results: [] }; }
          })
          .catch(() => ({ results: [] })),
        fetch(`/api/artist?name=${encodeURIComponent(searchQuery)}`)
          .then(async (r) => {
            if (!r.ok) return null;
            try { return await r.json(); } catch { return null; }
          })
          .catch(() => null),
        fetch(`/api/search?q=${encodeURIComponent(searchQuery + " album")}`)
          .then(async (r) => {
            if (!r.ok) return { results: [] };
            try { return await r.json(); } catch { return { results: [] }; }
          })
          .catch(() => ({ results: [] })),
      ]);
      setResults(resData?.results || []);
      setArtists(artistRes ? [artistRes] : []);
      const seen = new Set<string>();
      const uniqAlbums: AlbumItem[] = [];
      (albumRes?.results || []).forEach((s: Track) => {
        if (s.title && !seen.has(s.title)) {
          seen.add(s.title);
          uniqAlbums.push({ albumId: s.videoId, name: s.title, artist: s.artist, thumbnail: s.thumbnail });
        }
      });
      setAlbums(uniqAlbums.slice(0, 6));
    } catch (error) { console.error("Search failed:", error); }
    finally { setLoading(false); }
  };

  const saveSearchQuery = (q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 6);
    setTimeout(() => setRecentSearches(updated), 0);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };
  const removeSearchQuery = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== q);
    setTimeout(() => setRecentSearches(updated), 0);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };
  const handleSelectSuggestion = (q: string) => { setQuery(q); executeSearch(q); };
  const playSong = (song: Track, index: number) => { setQueue(results); setTrack(song.videoId, song.title, song.artist, song.thumbnail, index); };

  useEffect(() => {
    const history = localStorage.getItem("recent-searches");
    if (history) {
      const parsed = JSON.parse(history);
      setTimeout(() => setRecentSearches(parsed), 0);
    }
    if (initialQuery) {
      setTimeout(() => {
        setQuery(initialQuery);
        executeSearch(initialQuery);
      }, 0);
    }
  }, [initialQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setTimeout(() => setSuggestions([]), 0);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const hasResults = results.length > 0 || artists.length > 0 || albums.length > 0;

  return (
    <div className="min-h-screen pb-36 relative" style={{ background: "#07070A" }}>
      {/* Immersive Voice Listening Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-3xl px-6 select-none"
          >
            {/* Pulsing microphone waves */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-24 h-24 rounded-full bg-purple-500/20"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute w-20 h-20 rounded-full bg-pink-500/20"
              />
              <div className="w-16 h-16 rounded-full bg-purple-650 flex items-center justify-center text-white shadow-[0_0_30px_#a855f7] z-10">
                <Mic size={22} className="animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide mt-8">Listening...</h2>
            <p className="text-xs text-zinc-500 mt-2 font-semibold">Try saying &quot;KK romantic songs&quot; or &quot;Lofi mix&quot;</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Hero Search Header ─────────────────────────────────── */}
      <div className="relative overflow-hidden px-4 md:px-10 pt-6 md:pt-10 pb-8">
        {/* Soft Background Orbs */}
        <div className="absolute top-0 left-[-10%] w-[500px] h-[350px] rounded-full bg-purple-900/[0.08] blur-[130px] pointer-events-none" />
        <div className="absolute top-10 right-[-5%] w-[350px] h-[250px] rounded-full bg-pink-950/[0.06] blur-[110px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 p-6 md:p-8 rounded-[30px] bg-white/[0.01] border border-white/[0.04] backdrop-blur-2xl"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
        >
          <div className="max-w-3xl space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
              <SearchIcon size={10} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">SEARCH MUSIC</span>
            </div>

            <h1 className="font-display text-[38px] sm:text-[54px] font-black leading-[0.94] tracking-tighter text-white select-none">
              Find Every.
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Sound.</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-500 font-semibold">
              Search millions of tracks, artists and playlists.
            </p>

            {/* Large Glass Search Box */}
            <div className="relative mt-4" ref={containerRef}>
              <div
                className="relative flex items-center rounded-[20px] transition-all duration-200"
                style={{
                  background: isFocused ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${isFocused ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.06)"}`,
                  boxShadow: isFocused ? "0 0 24px rgba(139,92,246,0.12)" : "none",
                }}
              >
                <SearchIcon className="absolute left-4.5 w-4.5 h-4.5 text-zinc-600 pointer-events-none shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeSearch(query)}
                  placeholder="What do you want to play?"
                  className="w-full h-13 bg-transparent outline-none text-white text-[14px] pl-12 pr-12 placeholder:text-zinc-650 font-medium"
                  aria-label="Search music"
                />
                <AnimatePresence mode="wait">
                  {query ? (
                    <motion.button
                      key="clear"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      onClick={() => { setQuery(""); setResults([]); setArtists([]); setAlbums([]); inputRef.current?.focus(); }}
                      className="absolute right-3.5 p-1.5 rounded-full bg-white/[0.07] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X size={13} />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="voice"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      onClick={startVoiceSearch}
                      className="absolute right-3.5 p-1.5 rounded-full bg-purple-550/20 text-purple-400 hover:bg-purple-550/30 hover:text-white active:scale-90 transition-all duration-150 cursor-pointer"
                      aria-label="Voice search"
                    >
                      <Mic size={13} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 mt-2 rounded-[18px] overflow-hidden z-50 p-1.5"
                    style={{
                      background: "rgba(8,8,12,0.96)",
                      backdropFilter: "blur(48px)",
                      WebkitBackdropFilter: "blur(48px)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                    }}
                  >
                    {suggestions.map((item, idx) => (
                      <button key={idx} onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-3.5 py-2.5 rounded-[12px] text-[13px] hover:bg-white/[0.04] text-zinc-400 hover:text-white font-semibold flex items-center gap-3 transition-colors cursor-pointer">
                        <SearchIcon size={12} className="text-zinc-600 shrink-0" />
                        {item}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trending Searches Under Search Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Trending:</span>
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSelectSuggestion(term)}
                  className="px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.04] text-[11px] font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>

          </div>
        </motion.div>
      </div>

      <div className="px-4 md:px-10 space-y-12">

        {/* ── 2. Empty State ──────────────────── */}
        {!loading && !hasResults && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">Recent Searches</p>
                    <button
                      onClick={() => { setRecentSearches([]); localStorage.removeItem("recent-searches"); }}
                      className="text-[11px] text-zinc-650 hover:text-zinc-350 font-bold transition-colors uppercase tracking-wider"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button key={item} onClick={() => handleSelectSuggestion(item)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-zinc-400 hover:text-white transition-all border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]"
                      >
                        <Clock size={11} className="text-zinc-600" />
                        {item}
                        <X size={10} className="text-zinc-650 hover:text-red-400 transition-colors ml-1"
                          onClick={(e) => removeSearchQuery(e, item)} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue Listening (Recent listened tracks) */}
              {recentSongs.length > 0 && (
                <div className="space-y-5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Resume Playback</p>
                    <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Continue Listening</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
                    {recentSongs.slice(0, 6).map((song, index) => (
                      <motion.div
                        key={`continue-${song.videoId}-${index}`}
                        whileHover={{ y: -6 }}
                        onClick={() => { setQueue(recentSongs); setTrack(song.videoId, song.title, song.artist, song.thumbnail, index); }}
                        className="group shrink-0 w-[140px] md:w-[155px] p-3 rounded-[20px] bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-purple-500/25 transition-all duration-300 cursor-pointer"
                      >
                        <div className="relative aspect-square rounded-[14px] overflow-hidden bg-zinc-950 border border-white/5 shadow-sm mb-3">
                          <SafeImage src={song.thumbnail} videoId={song.videoId} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="song" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play size={12} fill="white" className="text-white" />
                          </div>
                        </div>
                        <p className="text-[11px] font-bold text-zinc-300 truncate leading-tight group-hover:text-white transition-colors">{song.title}</p>
                        <p className="text-[9px] text-zinc-555 truncate mt-0.5">{song.artist}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Browse Categories */}
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Vibe</p>
                  <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Browse Categories</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
                  {CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={cat.title}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectSuggestion(cat.title)}
                      className="group relative h-20 rounded-2xl cursor-pointer p-4 overflow-hidden border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-300 flex items-end justify-between text-left"
                    >
                      <div className="absolute top-[-25%] right-[-15%] w-14 h-14 rounded-full opacity-10 blur-md" style={{ background: cat.text }} />
                      <span className="font-display text-[13px] font-bold transition-colors" style={{ color: cat.text }}>{cat.title}</span>
                      <span className="text-[10px] font-mono text-zinc-650 font-bold uppercase group-hover:text-zinc-450 transition-colors">Go</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Featured Artists */}
              <div className="space-y-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Profiles</p>
                    <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Featured Artists</h2>
                  </div>
                  <Link href="/explore" className="text-[11px] text-zinc-500 hover:text-zinc-350 transition-colors font-bold uppercase tracking-wider">See all</Link>
                </div>
                <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
                  {["Arijit Singh", "KK", "Sonu Nigam", "Atif Aslam"].map((name) => (
                    <motion.div
                      key={name}
                      whileHover={{ y: -6 }}
                      onClick={() => router.push(`/artist/${encodeURIComponent(name)}`)}
                      className="group shrink-0 flex flex-col items-center gap-3 cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-950 border border-white/[0.05] group-hover:border-purple-500/30 transition-all duration-300 shadow-md">
                        <SafeImage
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111118&color=fff&size=128`}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          fallbackType="artist"
                        />
                      </div>
                      <p className="text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors">{name}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Trending Albums */}
              <div className="space-y-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Releases</p>
                    <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Trending Albums</h2>
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
                  {STATIC_RECOMMENDED.map((album) => (
                    <motion.div
                      key={album.videoId}
                      whileHover={{ y: -6 }}
                      onClick={() => router.push(`/album/${album.videoId}`)}
                      className="group shrink-0 w-[140px] md:w-[155px] flex flex-col gap-3 cursor-pointer text-left"
                    >
                      <div className="relative rounded-[20px] overflow-hidden bg-zinc-900 aspect-square border border-white/[0.05] group-hover:border-purple-500/35 transition-all duration-300 shadow-sm">
                        <SafeImage src={album.thumbnail} videoId={album.videoId} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="album" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play size={12} fill="white" className="text-white" />
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight tracking-tight">{album.title}</p>
                      <p className="text-[9px] text-zinc-555 truncate mt-0.5">{album.artist}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Popular Playlists */}
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Curated</p>
                  <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Popular Playlists</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {POPULAR_PLAYLISTS.map((playlist) => (
                    <motion.div
                      key={playlist.id}
                      whileHover={{ y: -6 }}
                      onClick={() => handleSelectSuggestion(playlist.name)}
                      className="group relative p-3.5 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.035] hover:border-purple-500/20 transition-all duration-300 cursor-pointer flex gap-3.5 overflow-hidden"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-950 border border-white/5 shadow-sm">
                        <SafeImage src={playlist.image} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="song" />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <h3 className="font-display text-[13px] font-bold text-zinc-300 group-hover:text-white truncate transition-colors">{playlist.name}</h3>
                        <p className="text-[9px] text-zinc-650 font-bold uppercase tracking-wider mt-1">{playlist.songsCount} Songs</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recommended For You */}
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Just For You</p>
                  <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Recommended For You</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {STATIC_RECOMMENDED.map((song, i) => (
                    <div
                      key={`static-rec-${song.videoId}-${i}`}
                      onClick={() => { setQueue(STATIC_RECOMMENDED); setTrack(song.videoId, song.title, song.artist, song.thumbnail, i); }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:border-purple-500/20 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                          <SafeImage src={song.thumbnail} videoId={song.videoId} alt={song.title} className="w-full h-full object-cover" fallbackType="song" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">{song.title}</h3>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-black transition-opacity shadow-sm shrink-0">
                        <Play size={10} fill="black" className="text-black ml-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Tips (Small premium card) */}
              <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex items-start gap-3 max-w-md">
                <HelpCircle size={15} className="text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-zinc-300">Quick Tip</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">
                    Try searching for specific tracks, artist profiles, or albums. Keywords are matched across titles, categories, and lyrics.
                  </p>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        )}

        {/* ── 3. Loading Skeleton ─────────────────────────────── */}
        {loading && (
          <div className="space-y-6">
            <div className="h-5 w-28 mf-skeleton rounded-lg bg-white/[0.015]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 w-full mf-skeleton rounded-2xl bg-white/[0.015] border border-white/[0.05]" />
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Results ──────────────────────────────────────── */}
        {!loading && hasResults && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "tracks", "artists", "albums"] as const).map(filter => (
                <button key={filter} onClick={() => setActiveFilter(filter)}
                  className="px-4.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border select-none"
                  style={{
                    background: activeFilter === filter ? "#FFFFFF" : "rgba(255,255,255,0.02)",
                    color: activeFilter === filter ? "#000000" : "#a1a1aa",
                    border: `1px solid ${activeFilter === filter ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Songs */}
            {(activeFilter === "all" || activeFilter === "tracks") && results.length > 0 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Songs</p>
                  <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
                    {results.length} Matches
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {results.slice(0, activeFilter === "all" ? 6 : 30).map((song, i) => (
                    <SongRow key={song.videoId} song={song} index={i} onPlay={playSong} />
                  ))}
                </div>
              </div>
            )}

            {/* Artists */}
            {(activeFilter === "all" || activeFilter === "artists") && artists.length > 0 && artists[0] && (
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Profiles</p>
                  <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Artists</h2>
                </div>
                <div className="flex gap-6 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
                  {artists.map((artist) => (
                    <motion.button
                      key={artist.name}
                      whileHover={{ y: -6 }}
                      onClick={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
                      className="flex flex-col items-center gap-3 shrink-0 group focus:outline-none"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-950 border border-white/[0.05] group-hover:border-purple-500/30 transition-all duration-300 shadow-md">
                        <SafeImage src={artist.image} alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="artist" />
                      </div>
                      <div className="text-center">
                        <p className="text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors">{artist.name}</p>
                        <p className="text-[9px] text-zinc-650 uppercase tracking-wider font-bold mt-0.5">Artist</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Albums */}
            {(activeFilter === "all" || activeFilter === "albums") && albums.length > 0 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Releases</p>
                  <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Albums</h2>
                </div>
                <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
                  {albums.map((album) => (
                    <motion.button
                      key={album.albumId}
                      whileHover={{ y: -6 }}
                      onClick={() => router.push(`/album/${album.albumId}`)}
                      className="group flex flex-col gap-3 text-left focus:outline-none shrink-0 w-[140px] md:w-[155px]"
                    >
                      <div className="relative aspect-square rounded-[20px] overflow-hidden bg-zinc-900 border border-white/[0.05] group-hover:border-purple-500/35 transition-all duration-300 shadow-md">
                        <SafeImage src={album.thumbnail} videoId={album.albumId} alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="album" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                            <Play size={12} fill="black" className="text-black ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight tracking-tight">{album.name}</p>
                        <p className="text-[10px] text-zinc-555 truncate mt-0.5">{album.artist}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="px-6 md:px-10 pt-10 pb-8 space-y-4">
        <div className="h-4 w-16 mf-skeleton rounded bg-white/[0.015]" />
        <div className="h-12 w-72 mf-skeleton rounded-2xl bg-white/[0.015]" />
        <div className="h-14 mf-skeleton rounded-[20px] bg-white/[0.015]" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}