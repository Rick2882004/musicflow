"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Search as SearchIcon, X, Clock, Play, HelpCircle, Mic, ListPlus, ListMusic, Sparkles, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SafeImage } from "@/components/ui/SafeImage";
import { useRouter, useSearchParams } from "next/navigation";
import { Track } from "@/types/music";
import { SearchIntent } from "@/lib/ai/types";
import Link from "next/link";
import { AddToPlaylistModal } from "@/components/ui/AddToPlaylistModal";
import { isFakeAlbumId } from "@/lib/canonical-music";
import { useRadioStore } from "@/store/radio-store";

const CATEGORIES = [
  { title: "Pop",          bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.25)",  text: "#c4b5fd" },
  { title: "Romance",      bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.22)",  text: "#f9a8d4" },
  { title: "Chill & LoFi", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.22)",  text: "#93c5fd" },
  { title: "Workout",      bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.22)",  text: "#fdba74" },
  { title: "Bollywood",    bg: "rgba(217,70,239,0.12)",  border: "rgba(217,70,239,0.22)",  text: "#f0abfc" },
  { title: "Classical",    bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.22)",  text: "#fcd34d" },
];

const TRENDING_SEARCHES = ["Arijit Singh", "KK", "Lofi", "AP Dhillon", "Bollywood", "Workout", "Party", "Rain", "Romance"];

function formatDur(s: number = 0) {
  if (!s || isNaN(s)) return "--:--";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function SongRow({
  song,
  index,
  onPlay,
  onAddToPlaylist,
  onStartRadio,
}: {
  song: Track;
  index: number;
  onPlay: (s: Track, i: number) => void;
  onAddToPlaylist?: (s: Track) => void;
  onStartRadio?: (s: Track) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onPlay(song, index)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center justify-between px-3.5 py-2.5 rounded-[14px] cursor-pointer group transition-all duration-150 select-none"
      style={{
        background: hov ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${hov ? "rgba(124,58,237,0.30)" : "var(--mf-border-soft)"}`,
      }}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-5 text-center shrink-0">
          {hov ? (
            <Play size={12} fill="white" className="text-white mx-auto" />
          ) : (
            <span className="text-[11px] font-mono" style={{ color: "var(--mf-text-dim)" }}>
              {index + 1}
            </span>
          )}
        </div>

        <div
          className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
          style={{ background: "var(--mf-bg-card)", border: "1px solid var(--mf-border-soft)" }}
        >
          <SafeImage
            src={song.thumbnail}
            videoId={song.videoId}
            title={song.title}
            artist={song.artist}
            alt={song.title}
            className="w-full h-full object-cover"
            fallbackType="song"
          />
        </div>

        <div className="min-w-0">
          <p
            className="text-[12px] font-bold truncate transition-colors"
            style={{ color: hov ? "var(--mf-accent-light)" : "var(--mf-text-primary)" }}
          >
            {song.title}
          </p>
          <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--mf-text-muted)" }}>
            <Link
              href={`/artist/${encodeURIComponent(song.artist)}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-purple-400 hover:underline transition-colors"
            >
              {song.artist}
            </Link>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {onStartRadio && (
          <button
            type="button"
            title="Start AI Radio"
            onClick={(e) => {
              e.stopPropagation();
              onStartRadio(song);
            }}
            className="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-zinc-400 hover:text-purple-300 hover:bg-white/10 transition"
          >
            <Radio size={13} />
          </button>
        )}
        {onAddToPlaylist && (
          <button
            type="button"
            title="Add to Playlist"
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist(song);
            }}
            className="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <ListPlus size={13} />
          </button>
        )}
        <span className="text-[10px] font-mono tabular-nums min-w-[34px] text-right" style={{ color: "var(--mf-text-muted)" }}>
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
    browseId?: string;
    name: string;
    artist: string | { name?: string; artistId?: string | null };
    thumbnail: string;
  }
  interface ArtistItem {
    artistId?: string;
    browseId?: string;
    name: string;
    genre?: string;
    image: string;
  }

  const [query,          setQuery]          = useState(initialQuery);
  const [results,        setResults]        = useState<Track[]>([]);
  const [artists,        setArtists]        = useState<ArtistItem[]>([]);
  const [albums,         setAlbums]         = useState<AlbumItem[]>([]);
  const [suggestions,    setSuggestions]    = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [activeFilter,   setActiveFilter]   = useState<"all"|"tracks"|"artists"|"albums"|"playlists">("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused,      setIsFocused]      = useState(false);
  const [isListening,    setIsListening]    = useState(false);
  const [voiceNotice,    setVoiceNotice]    = useState<string | null>(null);
  const [searchError,    setSearchError]    = useState<string | null>(null);
  const [searchIntent,   setSearchIntent]   = useState<SearchIntent | null>(null);
  const [searchExplanation, setSearchExplanation] = useState<string>("");
  const [moreLikeThis,   setMoreLikeThis]   = useState<Track[]>([]);
  const [playlistSong,   setPlaylistSong]   = useState<Track | null>(null);

  const startVoiceSearch = () => {
    setVoiceNotice(null);
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceNotice("Voice search is not supported by your browser.");
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuery(transcript);
          executeSearch(transcript);
        }
        setIsListening(false);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceNotice("Microphone permission was denied.");
        } else if (event.error !== "no-speech") {
          setVoiceNotice("Voice recognition failed. Please try again.");
        }
        setTimeout(() => setVoiceNotice(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Voice search error:", err);
      setIsListening(false);
      setVoiceNotice("Could not initialize voice search.");
      setTimeout(() => setVoiceNotice(null), 4000);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  const { recentSongs, playlists, setTrack, setQueue } = usePlayerStore(
    useShallow((s) => ({
      recentSongs: s.recentSongs,
      playlists:   s.playlists,
      setTrack:    s.setTrack,
      setQueue:    s.setQueue,
    }))
  );

  const saveSearchQuery = useCallback((q: string) => {
    setRecentSearches((prev) => {
      const updated = [q, ...prev.filter((s) => s !== q)].slice(0, 6);
      localStorage.setItem("recent-searches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const searchCache = useRef<Map<string, { results: Track[]; artists: ArtistItem[]; albums: AlbumItem[]; timestamp: number }>>(new Map());
  const activeSearchQueryRef = useRef<string>("");

  const executeSearch = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;
    activeSearchQueryRef.current = q.toLowerCase();
    setLoading(true);
    setShowSuggestions(false);
    saveSearchQuery(q);

    // Reset AI intent and continuation for fresh search
    setSearchIntent(null);
    setSearchExplanation("");
    setMoreLikeThis([]);

    const cached = searchCache.current.get(q.toLowerCase());
    if (cached && Date.now() - cached.timestamp < 3 * 60 * 1000) {
      setResults(cached.results);
      setArtists(cached.artists);
      setAlbums(cached.albums);
      setLoading(false);

      // Refresh AI metadata in background for cached query
      fetch(`/api/ai/search?q=${encodeURIComponent(q)}`)
        .then(async (aiRes) => {
          if (!aiRes.ok) return;
          const aiData = await aiRes.json();
          if (activeSearchQueryRef.current !== q.toLowerCase()) return;
          if (aiData?.intent) setSearchIntent(aiData.intent);
          if (aiData?.explanation) setSearchExplanation(aiData.explanation);
          if (aiData?.moreLikeThis && Array.isArray(aiData.moreLikeThis)) {
            setMoreLikeThis(aiData.moreLikeThis);
          }
        })
        .catch(() => {});
      return;
    }

    try {
      // 1. PRIMARY: Query real catalog search directly as the absolute source of truth
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Failed to load search results");
      const data = await res.json();

      // 2. ENHANCEMENT: Non-blocking parallel / background AI enrichment (Vibe, Intent, More Like This)
      fetch(`/api/ai/search?q=${encodeURIComponent(q)}`)
        .then(async (aiRes) => {
          if (!aiRes.ok) return;
          const aiData = await aiRes.json();
          if (activeSearchQueryRef.current !== q.toLowerCase()) return;
          if (aiData?.intent) setSearchIntent(aiData.intent);
          if (aiData?.explanation) setSearchExplanation(aiData.explanation);
          if (aiData?.moreLikeThis && Array.isArray(aiData.moreLikeThis)) {
            setMoreLikeThis(aiData.moreLikeThis);
          }
        })
        .catch(() => {
          // AI enhancement failure is completely non-fatal and does not affect catalog results
        });

      const rawTracks: Track[] = data.results || data.songs || [];
      const seenVideoIds = new Set<string>();
      const resTracks: Track[] = [];
      for (const t of rawTracks) {
        if (!t || !t.videoId || seenVideoIds.has(t.videoId)) continue;
        seenVideoIds.add(t.videoId);
        resTracks.push(t);
      }

      const rawArtists: ArtistItem[] = (data.artists || []).map((a: { artistId?: string; browseId?: string; name: string; genre?: string; image?: string; thumbnail?: string; thumbnails?: { url: string }[] }) => ({
        artistId: a.artistId || a.browseId || "",
        browseId: a.browseId || a.artistId || "",
        name: a.name || "Unknown Artist",
        genre: a.genre,
        image: a.image || a.thumbnail || a.thumbnails?.[0]?.url || "",
      }));
      const seenArtistIds = new Set<string>();
      const seenArtistFallbacks = new Set<string>();
      const resArtists: ArtistItem[] = [];
      for (const a of rawArtists) {
        const id = a.browseId || a.artistId;
        if (id) {
          if (seenArtistIds.has(id)) continue;
          seenArtistIds.add(id);
          resArtists.push(a);
        } else {
          const fallbackKey = `${a.name.trim().toLowerCase()}::${a.image}`;
          if (seenArtistFallbacks.has(fallbackKey)) continue;
          seenArtistFallbacks.add(fallbackKey);
          resArtists.push(a);
        }
      }

      const rawAlbums: AlbumItem[] = (data.albums || [])
        .map((alb: { albumId?: string; browseId?: string; name?: string; title?: string; artist?: string | { name?: string; artistId?: string | null }; thumbnail?: string; thumbnails?: { url: string }[] }) => {
          const rawArtistName = typeof alb.artist === "string"
            ? alb.artist
            : (alb.artist && typeof alb.artist === "object" ? alb.artist.name : "") || "";
          return {
            albumId: alb.albumId || alb.browseId || "",
            browseId: alb.browseId || alb.albumId || "",
            name: (alb.name || alb.title || "").trim(),
            artist: rawArtistName.trim() || "Unknown Artist",
            thumbnail: alb.thumbnail || alb.thumbnails?.[0]?.url || "",
          };
        })
        .filter((alb: AlbumItem) => !!alb.albumId && alb.name.length > 0 && !isFakeAlbumId(alb.albumId));
      const seenAlbumIds = new Set<string>();
      const resAlbums: AlbumItem[] = [];
      for (const alb of rawAlbums) {
        const id = alb.albumId || alb.browseId;
        if (id) {
          if (seenAlbumIds.has(id)) continue;
          seenAlbumIds.add(id);
          resAlbums.push(alb);
        }
      }

      setResults(resTracks);
      setArtists(resArtists);
      setAlbums(resAlbums);

      searchCache.current.set(q.toLowerCase(), {
        results: resTracks,
        artists: resArtists,
        albums: resAlbums,
        timestamp: Date.now(),
      });
      setSearchError(null);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError("Unable to load search results. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  }, [saveSearchQuery]);

  const removeSearchQuery = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== q);
    setTimeout(() => setRecentSearches(updated), 0);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };
  const handleSelectSuggestion = (q: string) => { setQuery(q); executeSearch(q); };
  const startRadio = useRadioStore((s) => s.startRadio);
  const handleStartRadio = (song: Track) => {
    setQueue([song]);
    startRadio(song);
  };
  const playSong = (song: Track) => {
    // Queue only the chosen song from search. Smart Queue will continue playback
    // based on the verified song and user taste profile, preventing search query contamination.
    setQueue([song]);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, 0);
  };

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
  }, [initialQuery, executeSearch]);

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

  const matchingPlaylists = query.trim()
    ? playlists.filter((p) => p.name.toLowerCase().includes(query.toLowerCase().trim()))
    : [];

  const hasResults = results.length > 0 || artists.length > 0 || albums.length > 0 || matchingPlaylists.length > 0;

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

      {/* ── 1. Clean Search Header ─────────────────────────────────── */}
      <div className="relative px-4 md:px-8 pt-4 pb-3 border-b border-white/[0.06] text-left">
        <div className="max-w-2xl space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white select-none">
              Search
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Explore songs, artists, albums, and playlists
            </p>
          </div>

          {/* Search Box */}
          <div className="relative" ref={containerRef}>
            <div
              className={`relative flex items-center rounded-xl bg-[#121216] border transition-colors ${isFocused ? "border-purple-550/70" : "border-white/[0.08]"}`}
            >
              <SearchIcon className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeSearch(query)}
                placeholder="What do you want to listen to?"
                className="w-full h-11 bg-transparent outline-none text-white text-xs pl-10 pr-10 placeholder:text-zinc-500 font-medium"
                aria-label="Search music"
              />
              <AnimatePresence mode="wait">
                {query ? (
                  <button
                    key="clear"
                    onClick={() => { setQuery(""); setResults([]); setArtists([]); setAlbums([]); inputRef.current?.focus(); }}
                    className="absolute right-3 p-1 rounded-full bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <button
                    key="voice"
                    onClick={startVoiceSearch}
                    className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Voice search"
                  >
                    <Mic size={14} />
                  </button>
                )}
              </AnimatePresence>
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50 p-1 bg-[#16161e] border border-white/10 shadow-xl"
                >
                  {suggestions.map((item, idx) => (
                    <button key={`suggestion-${item}-${idx}`} onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/[0.06] text-zinc-300 hover:text-white font-medium flex items-center gap-2.5 transition-colors cursor-pointer">
                      <SearchIcon size={12} className="text-zinc-500 shrink-0" />
                      {item}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {voiceNotice && (
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] font-medium flex items-center justify-between">
                <span>{voiceNotice}</span>
                <button type="button" onClick={() => setVoiceNotice(null)} className="text-red-400 hover:text-white ml-2 cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Trending Searches */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Trending:</span>
            {TRENDING_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => handleSelectSuggestion(term)}
                className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
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
                          <SafeImage src={song.thumbnail} videoId={song.videoId} title={song.title} artist={song.artist} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="song" />
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
                <div className="flex gap-5 overflow-x-auto scrollbar-none pb-2 -mx-4 md:-mx-10 px-4 md:px-10">
                  {[
                    { name: "Arijit Singh", image: "https://e-cdns-images.dzcdn.net/images/artist/c632832960f4e1f787b6495b542e76f5/500x500.jpg" },
                    { name: "KK", image: "https://e-cdns-images.dzcdn.net/images/artist/b6f505963f4ce81ad669e71bf8c751a0/500x500.jpg" },
                    { name: "Sonu Nigam", image: "https://e-cdns-images.dzcdn.net/images/artist/23015f62ef1ef0728fe2fa90b9fbc792/500x500.jpg" },
                    { name: "Atif Aslam", image: "https://e-cdns-images.dzcdn.net/images/artist/c1a60bc4b7975c6bf2e2bc13d56d10ad/500x500.jpg" },
                    { name: "Shreya Ghoshal", image: "https://e-cdns-images.dzcdn.net/images/artist/37397e558c4f981f3e7b1a9f14067335/500x500.jpg" },
                    { name: "Diljit Dosanjh", image: "https://e-cdns-images.dzcdn.net/images/artist/e13f4124036fef95b7787687834572f4/500x500.jpg" },
                  ].map((art) => (
                    <div
                      key={`featured-artist-${art.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => router.push(`/artist/${encodeURIComponent(art.name)}`)}
                      className="group shrink-0 flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-950 border border-white/[0.08] group-hover:border-purple-500/40 transition-all shadow-md">
                        <SafeImage
                          src={art.image}
                          alt={art.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallbackType="artist"
                        />
                      </div>
                      <p className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">{art.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Tip */}
              <div
                className="p-4 rounded-2xl flex items-start gap-3 max-w-md"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--mf-border-soft)" }}
              >
                <HelpCircle size={15} style={{ color: "var(--mf-accent-light)" }} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[12px] font-bold text-white mb-0.5">Search Tip</h4>
                  <p className="text-[11px] font-medium leading-relaxed" style={{ color: "var(--mf-text-muted)" }}>
                    Type an artist name, song title, or album to find instant high-fidelity audio streams. Keywords are matched across titles, categories, and lyrics.
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

        {/* ── Search Error State ──────────────────────────────── */}
        {searchError && !loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-1">
              <SearchIcon size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">Search Unavailable</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{searchError}</p>
            <button
              type="button"
              onClick={() => executeSearch(query)}
              className="mt-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── 4. Results ──────────────────────────────────────── */}
        {!loading && hasResults && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

            {/* AI Intent & Vibe Banner */}
            {searchExplanation && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-transparent border border-purple-500/20 flex flex-wrap items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-white leading-tight">{searchExplanation}</p>
                    <p className="text-[10px] text-purple-300/80 font-medium">AI Natural Language Search</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {searchIntent?.mood && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      ✨ {searchIntent.mood}
                    </span>
                  )}
                  {searchIntent?.activity && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      🎯 {searchIntent.activity}
                    </span>
                  )}
                  {searchIntent?.language && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      🗣️ {searchIntent.language}
                    </span>
                  )}
                  {searchIntent?.era && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      ⏳ {searchIntent.era}
                    </span>
                  )}
                  {searchIntent?.genre && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20">
                      🎵 {searchIntent.genre}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "tracks", "artists", "albums", ...(matchingPlaylists.length > 0 ? ["playlists" as const] : [])] as const).map(filter => (
                <button key={filter} onClick={() => setActiveFilter(filter)}
                  className="px-4.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border select-none"
                  style={{
                    background: activeFilter === filter ? "#FFFFFF" : "rgba(255,255,255,0.02)",
                    color: activeFilter === filter ? "#000000" : "#a1a1aa",
                    border: `1px solid ${activeFilter === filter ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  {filter === "all" ? "All" : filter === "tracks" ? "Songs" : filter === "artists" ? "Artists" : filter === "albums" ? "Albums" : "Playlists"}
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
                    <SongRow
                      key={song.videoId || `search-song-${song.title.toLowerCase().trim()}-${i}`}
                      song={song}
                      index={i}
                      onPlay={playSong}
                      onAddToPlaylist={(s) => setPlaylistSong(s)}
                      onStartRadio={handleStartRadio}
                    />
                  ))}
                </div>

                {/* More Like This (Central AI Discovery) */}
                {moreLikeThis.length > 0 && (
                  <div className="pt-6 space-y-4 border-t border-white/[0.04]">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400 mb-1">
                        Intelligent Continuation
                      </p>
                      <h3 className="font-display text-[18px] font-black text-white tracking-tight flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-400" />
                        More Like This
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {moreLikeThis.map((song, i) => (
                        <SongRow
                          key={`more-like-${song.videoId}-${i}`}
                          song={song}
                          index={i}
                          onPlay={playSong}
                          onAddToPlaylist={(s) => setPlaylistSong(s)}
                          onStartRadio={handleStartRadio}
                        />
                      ))}
                    </div>
                  </div>
                )}
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
                  {artists.map((artist, idx) => (
                    <motion.button
                      key={artist.browseId || artist.artistId || `artist-${artist.name.toLowerCase().trim()}-${idx}`}
                      whileHover={{ y: -6 }}
                      onClick={() => router.push(artist.artistId ? `/artist/${encodeURIComponent(artist.name)}?id=${encodeURIComponent(artist.artistId)}` : `/artist/${encodeURIComponent(artist.name)}`)}
                      className="flex flex-col items-center gap-3 shrink-0 group focus:outline-none cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-950 border border-white/[0.05] group-hover:border-purple-500/30 transition-all duration-300 shadow-md">
                        <SafeImage src={artist.image} alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="artist" />
                      </div>
                      <div className="text-center">
                        <p className="text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors">{artist.name}</p>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold mt-0.5 truncate max-w-[90px]">{artist.genre || "Artist"}</p>
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
                  {albums.map((album, idx) => {
                    const albumArtistName =
                      typeof album.artist === "string"
                        ? album.artist
                        : album.artist?.name || "Unknown Artist";

                    return (
                      <motion.div
                        key={album.albumId || album.browseId || `album-${album.name.toLowerCase().trim()}-${idx}`}
                        whileHover={{ y: -6 }}
                        className="group flex flex-col gap-2.5 text-left shrink-0 w-[140px] md:w-[155px]"
                      >
                        <div
                          onClick={() => router.push(`/album/${album.albumId}`)}
                          className="relative aspect-square rounded-[20px] overflow-hidden bg-zinc-900 border border-white/[0.05] group-hover:border-purple-500/35 transition-all duration-300 shadow-md cursor-pointer"
                        >
                          <SafeImage
                            src={album.thumbnail}
                            title={album.name}
                            artist={albumArtistName}
                            alt={album.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            fallbackType="album"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
                              <Play size={12} fill="black" className="text-black ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <p
                            onClick={() => router.push(`/album/${album.albumId}`)}
                            className="text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight tracking-tight cursor-pointer"
                          >
                            {album.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                            <Link
                              href={`/artist/${encodeURIComponent(albumArtistName)}`}
                              className="hover:text-purple-400 hover:underline transition-colors"
                            >
                              {albumArtistName}
                            </Link>
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Playlists */}
            {(activeFilter === "all" || activeFilter === "playlists") && matchingPlaylists.length > 0 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Your Library</p>
                  <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Playlists</h2>
                </div>
                <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
                  {matchingPlaylists.map((pl) => (
                    <motion.div key={pl.id} whileHover={{ y: -6 }} className="shrink-0 w-[140px] md:w-[155px]">
                      <Link
                        href={`/playlists/${pl.id}`}
                        className="group flex flex-col gap-2.5 text-left"
                      >
                        <div className="relative aspect-square rounded-[20px] overflow-hidden bg-zinc-900 border border-white/[0.05] group-hover:border-purple-500/35 transition-all duration-300 shadow-md flex items-center justify-center">
                          {pl.coverImage ? (
                            <SafeImage src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover" />
                          ) : (
                            <ListMusic size={32} className="text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight tracking-tight">
                            {pl.name}
                          </p>
                          <p className="text-[10px] text-zinc-555 truncate mt-0.5">
                            {pl.songs?.length || 0} songs · Playlist
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <AddToPlaylistModal
          isOpen={!!playlistSong}
          onClose={() => setPlaylistSong(null)}
          song={playlistSong}
        />
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