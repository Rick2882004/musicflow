"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { SongCard } from "@/components/ui/SongCard";
import { Search as SearchIcon, X, Clock, Compass, Grid, Sparkles, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Track } from "@/types/music";

const categories = [
  { title: "Pop", color: "from-sky-500 to-cyan-600" },
  { title: "Romance", color: "from-pink-500 to-rose-600" },
  { title: "Chill & Lofi", color: "from-indigo-500 to-purple-600" },
  { title: "Workout", color: "from-orange-500 to-red-600" },
  { title: "Bollywood Hits", color: "from-fuchsia-500 to-pink-600" },
  { title: "Classical", color: "from-amber-500 to-orange-600" },
  { title: "Focus Beats", color: "from-teal-500 to-emerald-600" },
  { title: "Sleep Rain", color: "from-blue-500 to-indigo-600" },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Track[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "tracks" | "artists" | "albums">("all");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const { setTrack, setQueue } = usePlayerStore(useShallow((s) => ({
    setTrack: s.setTrack,
    setQueue: s.setQueue,
  })));

  useEffect(() => {
    const history = localStorage.getItem("recent-searches");
    if (history) {
      setRecentSearches(JSON.parse(history));
    }

    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error("Suggestions fetch error:", err);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setShowSuggestions(false);

    saveSearchQuery(searchQuery);

    try {
      const resultsRes = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const resultsData = await resultsRes.json();
      setResults(resultsData.results || []);

      const artistsRes = await fetch(`/api/artist?name=${encodeURIComponent(searchQuery)}`);
      if (artistsRes.ok) {
        const artistDetails = await artistsRes.json();
        setArtists([artistDetails]);
      } else {
        setArtists([]);
      }

      const albumSearchRes = await fetch(`/api/search?q=${encodeURIComponent(searchQuery + " album")}`);
      const albumSearchData = await albumSearchRes.json();
      
      const uniqueAlbums: any[] = [];
      const seenAlbums = new Set();
      (albumSearchData.results || []).forEach((song: any) => {
        const albumName = song.title;
        if (albumName && !seenAlbums.has(albumName)) {
          seenAlbums.add(albumName);
          uniqueAlbums.push({
            albumId: song.videoId,
            name: song.title,
            artist: song.artist,
            thumbnail: song.thumbnail,
          });
        }
      });
      setAlbums(uniqueAlbums.slice(0, 5));

    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSearchQuery = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const removeSearchQuery = (e: React.MouseEvent, searchQuery: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== searchQuery);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const handleSelectSuggestion = (searchQuery: string) => {
    setQuery(searchQuery);
    executeSearch(searchQuery);
  };

  const playSong = (song: Track, index: number) => {
    setQueue(results);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto" ref={containerRef}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white select-none">Search</h1>
        <p className="text-xs text-zinc-500">Discover songs, albums, and artists in real-time</p>
      </div>

      <div className="relative">
        <div className="flex h-12 w-full rounded-xl bg-white/5 border border-white/10 items-center px-4 focus-within:border-purple-500/50 transition">
          <SearchIcon className="text-zinc-500 w-5 h-5 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && executeSearch(query)}
            placeholder="What do you want to play?"
            className="w-full bg-transparent outline-none text-white text-sm"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setArtists([]);
                setAlbums([]);
              }}
              className="text-zinc-500 hover:text-white p-1 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 mt-2 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 p-1.5"
            >
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-xs hover:bg-white/5 text-zinc-300 hover:text-white font-medium flex items-center gap-2"
                >
                  <SearchIcon size={12} className="text-zinc-500" />
                  {item}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!loading && results.length === 0 && (
        <div className="space-y-8">
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Searches</h3>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem("recent-searches");
                  }}
                  className="text-[10px] text-zinc-500 hover:text-white"
                >
                  Clear all
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs text-zinc-300 hover:text-white transition"
                  >
                    <Clock size={11} className="text-zinc-500" />
                    {item}
                    <X
                      size={10}
                      className="text-zinc-600 hover:text-red-400 cursor-pointer ml-1"
                      onClick={(e) => removeSearchQuery(e, item)}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Browse All</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.title}
                  onClick={() => handleSelectSuggestion(cat.title)}
                  className={`bg-gradient-to-br ${cat.color} rounded-2xl h-36 p-5 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition shadow-md group`}
                >
                  <span className="text-lg font-bold text-white relative z-10 block">{cat.title}</span>
                  <div className="absolute right-[-15px] bottom-[-15px] w-20 h-20 rounded-full bg-white/10 group-hover:scale-125 transition duration-500 rotate-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex gap-2">
          {(["all", "tracks", "artists", "albums"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition select-none cursor-pointer ${
                activeFilter === filter
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="h-6 w-32 mf-skeleton rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white/[0.01] rounded-xl">
                <div className="w-14 h-14 mf-skeleton rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 mf-skeleton rounded" />
                  <div className="h-3 w-1/4 mf-skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-8">
          {(activeFilter === "all" || activeFilter === "tracks") && (
            <div>
              <h2 className="text-lg font-bold mb-4 text-white">Songs</h2>
              <div className="space-y-2">
                {results.slice(0, activeFilter === "all" ? 5 : 20).map((song, index) => (
                  <div
                    key={song.videoId}
                    onClick={() => playSong(song, index)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                          {song.title}
                        </h3>
                        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                      </div>
                    </div>
                    <div className="text-zinc-500 text-xs font-semibold">
                      {song.duration
                        ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
                        : "0:00"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeFilter === "all" || activeFilter === "artists") && artists.length > 0 && artists[0] && (
            <div>
              <h2 className="text-lg font-bold mb-4 text-white">Artist Profiles</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {artists.map((artist) => (
                  <div
                    key={artist.name}
                    onClick={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
                    className="flex flex-col items-center p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.05] transition-all"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 shadow-inner">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-sm font-semibold mt-3 text-zinc-200 truncate w-full text-center">
                      {artist.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-bold">Artist</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeFilter === "all" || activeFilter === "albums") && albums.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4 text-white">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {albums.map((album) => (
                  <div
                    key={album.albumId}
                    onClick={() => router.push(`/album/${album.albumId}`)}
                    className="p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.05] transition group shadow"
                  >
                    <img
                      src={album.thumbnail}
                      alt={album.name}
                      className="w-full aspect-square object-cover rounded-xl shadow-md group-hover:scale-[1.01] transition duration-300"
                    />
                    <h3 className="text-sm font-semibold mt-3 text-zinc-200 truncate group-hover:text-purple-300 transition-colors">
                      {album.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 truncate">{album.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center text-zinc-500 text-xs">
        Loading search engine...
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}