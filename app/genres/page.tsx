"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import {
  Radio,
  Play,
  Heart,
  Flame,
  Search,
  Volume2,
} from "lucide-react";
import { Track, GenreDetail } from "@/types/music";
import { SafeImage } from "@/components/ui/SafeImage";

const GENRE_LIST: GenreDetail[] = [
  {
    id: "bollywood",
    name: "Bollywood",
    emoji: "🎬",
    tagline: "Blockbuster Soundtracks & Melodies",
    description: "From timeless 90s romances to modern chart-topping cinematic anthems.",
    color: "#f43f5e",
    gradient: "from-rose-500/20 via-rose-950/10 to-transparent",
    featuredArtists: ["Arijit Singh", "KK", "Shreya Ghoshal", "Sonu Nigam", "Pritam"],
    popularSearchQueries: ["Arijit Singh Hits", "Romantic Bollywood", "90s Bollywood Melodies"],
  },
  {
    id: "punjabi",
    name: "Punjabi Hits",
    emoji: "🥁",
    tagline: "High-Energy Beats & Urban Folk",
    description: "Bass-heavy dhol, modern urban trap, and infectious melodies from Punjab.",
    color: "#f59e0b",
    gradient: "from-amber-500/20 via-amber-950/10 to-transparent",
    featuredArtists: ["AP Dhillon", "Diljit Dosanjh", "Karan Aujla", "Sidhu Moose Wala"],
    popularSearchQueries: ["AP Dhillon Hits", "Punjabi Pop", "Diljit Dosanjh Essentials"],
  },
  {
    id: "lofi",
    name: "Lo-Fi Beats",
    emoji: "☁️",
    tagline: "Chill Study & Ambient Relaxation",
    description: "Mellow tape flutter, vinyl crackle, and soothing keys for concentration.",
    color: "#6366f1",
    gradient: "from-indigo-500/20 via-indigo-950/10 to-transparent",
    featuredArtists: ["Lofi Fruit", "Kavv", "ChilledCow", "Kupla"],
    popularSearchQueries: ["Lo-Fi Study Beats", "Bollywood Lofi", "Late Night Lofi"],
  },
  {
    id: "pop",
    name: "Global Pop",
    emoji: "✨",
    tagline: "Worldwide Chart Dominators",
    description: "Catchy hooks, soaring synths, and global radio hits.",
    color: "#ec4899",
    gradient: "from-pink-500/20 via-pink-950/10 to-transparent",
    featuredArtists: ["Taylor Swift", "The Weeknd", "Dua Lipa", "Ed Sheeran"],
    popularSearchQueries: ["Today Top Pop Hits", "Viral Pop 2024", "Billboard Top Pop"],
  },
  {
    id: "chill",
    name: "Chill & Ambient",
    emoji: "🌊",
    tagline: "Unwind & Decompress",
    description: "Calm soundscapes and acoustic warmth for relaxing afternoons.",
    color: "#14b8a6",
    gradient: "from-teal-500/20 via-teal-950/10 to-transparent",
    featuredArtists: ["Novo Amor", "Bon Iver", "Prateek Kuhad", "Anuv Jain"],
    popularSearchQueries: ["Acoustic Chill", "Peaceful Piano", "Indie Chill Vibes"],
  },
  {
    id: "workout",
    name: "High-Energy Workout",
    emoji: "⚡",
    tagline: "Power Your Reps & Cardio",
    description: "Fast BPM electro, EDM, and aggressive basslines to push past your limits.",
    color: "#f97316",
    gradient: "from-orange-500/20 via-orange-950/10 to-transparent",
    featuredArtists: ["Skrillex", "David Guetta", "Eminem", "Alan Walker"],
    popularSearchQueries: ["Gym Motivation Music", "EDM Workout Beats", "High BPM Cardio"],
  },
  {
    id: "romance",
    name: "Romance & Love",
    emoji: "💕",
    tagline: "Heartfelt Ballads & Duets",
    description: "Songs that capture love, longing, and unforgettable moments.",
    color: "#d946ef",
    gradient: "from-fuchsia-500/20 via-fuchsia-950/10 to-transparent",
    featuredArtists: ["Atif Aslam", "Armaan Malik", "Jubin Nautiyal", "Mohit Chauhan"],
    popularSearchQueries: ["Romantic Slow Songs", "Valentine Love Mix", "Acoustic Love Hits"],
  },
  {
    id: "rock",
    name: "Rock & Alternative",
    emoji: "🎸",
    tagline: "Raw Guitars & Anthemic Energy",
    description: "Driving guitar riffs, thumping drums, and emotional indie anthems.",
    color: "#eab308",
    gradient: "from-yellow-500/20 via-yellow-950/10 to-transparent",
    featuredArtists: ["Coldplay", "Imagine Dragons", "Linkin Park", "Local Train"],
    popularSearchQueries: ["Rock Classics", "Modern Alt Rock", "Indie Rock Essentials"],
  },
  {
    id: "hiphop",
    name: "Hip-Hop & Rap",
    emoji: "🎤",
    tagline: "Flows, Beats & Urban Poetry",
    description: "808 bass, razor-sharp bars, and hard-hitting cyphers.",
    color: "#8b5cf6",
    gradient: "from-purple-500/20 via-purple-950/10 to-transparent",
    featuredArtists: ["DIVINE", "MC Stan", "Drake", "Travis Scott", "Seedhe Maut"],
    popularSearchQueries: ["Desi Hip Hop Hits", "Trap Bangers", "Underground Cypher"],
  },
  {
    id: "classical",
    name: "Classical & Instrumental",
    emoji: "🎻",
    tagline: "Symphonic Mastery & Strings",
    description: "Timeless orchestral masterpieces, sitar symphonies, and meditative piano.",
    color: "#3b82f6",
    gradient: "from-blue-500/20 via-blue-950/10 to-transparent",
    featuredArtists: ["Ustad Zakir Hussain", "Ludovico Einaudi", "Hans Zimmer", "A.R. Rahman"],
    popularSearchQueries: ["Indian Classical Fusion", "Focus Classical Strings", "Cinema Orchestral"],
  },
];

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function GenresPage() {
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState<GenreDetail>(GENRE_LIST[0]);
  const [genreTracks, setGenreTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const { setTrack, setQueue, likedSongs, toggleLike, videoId, isPlaying } = usePlayerStore(
    useShallow((s) => ({
      setTrack: s.setTrack,
      setQueue: s.setQueue,
      likedSongs: s.likedSongs,
      toggleLike: s.toggleLike,
      videoId: s.videoId,
      isPlaying: s.isPlaying,
    }))
  );

  useEffect(() => {
    let isCancelled = false;
    async function loadGenreTracks() {
      setLoading(true);
      try {
        const query = `${selectedGenre.name} Songs Hits`;
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setGenreTracks(data.results?.slice(0, 15) || []);
          }
        }
      } catch (err) {
        console.error("Failed to load genre tracks:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadGenreTracks();
    return () => {
      isCancelled = true;
    };
  }, [selectedGenre]);

  const startGenreRadio = () => {
    if (genreTracks.length === 0) return;
    const shuffled = [...genreTracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    const first = shuffled[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  const playSong = (song: Track, index: number) => {
    setQueue(genreTracks);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const filteredGenres = GENRE_LIST.filter(
    (g) =>
      g.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      g.tagline.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <main className="min-h-screen text-white select-none pb-36 text-left space-y-6 px-4 md:px-8 pt-4">
      {/* 1. Page Header */}
      <section className="relative pb-4 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Explore Genres
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Curated musical genres, top tracks, and continuous genre radios
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter genres..."
            className="w-full h-9 pl-9 pr-4 rounded-xl text-xs font-semibold text-white placeholder:text-zinc-600 outline-none transition-colors bg-[#121216] border border-white/[0.06] focus:border-purple-550"
          />
        </div>
      </section>

      {/* 2. Genre Horizontal Grid / Pills */}
      <section className="px-4 md:px-10 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
            SELECT A GENRE ({filteredGenres.length})
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {filteredGenres.map((genre) => {
            const isSelected = selectedGenre.id === genre.id;
            return (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre)}
                className={`group relative p-3.5 rounded-xl cursor-pointer text-left transition-all duration-150 overflow-hidden border ${
                  isSelected
                    ? "bg-white/[0.08] border-white/20"
                    : "bg-[#121216] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{genre.emoji}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                  )}
                </div>

                <div>
                  <h3
                    className="text-xs font-bold truncate transition-colors"
                    style={{ color: isSelected ? "#ffffff" : genre.color }}
                  >
                    {genre.name}
                  </h3>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-medium">
                    {genre.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Selected Genre Hero & Top Tracks */}
      <section className="px-4 md:px-10 space-y-8">
        <motion.div
          key={selectedGenre.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-6 rounded-2xl border border-white/[0.06] bg-[#121216] space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{selectedGenre.emoji}</span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {selectedGenre.name}
                </h2>
              </div>
              <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-medium">
                {selectedGenre.description}
              </p>

              {/* Featured Artists Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Top Icons:
                </span>
                {selectedGenre.featuredArtists.map((artist) => (
                  <button
                    key={artist}
                    onClick={() => router.push(`/artist/${encodeURIComponent(artist)}`)}
                    className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {artist}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Genre Radio Button */}
            <div className="shrink-0 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGenreRadio}
                className="px-6 py-3 rounded-full bg-white text-black font-black text-xs flex items-center gap-2 shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:bg-zinc-100 transition active:scale-95 cursor-pointer"
              >
                <Radio size={14} className="text-black animate-pulse" />
                Start {selectedGenre.name} Radio
              </motion.button>
            </div>
          </div>

          {/* Track Listing Table */}
          <div className="border-t border-white/[0.06] pt-6 space-y-2">
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-display text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Flame size={14} className="text-orange-400" />
                Trending in {selectedGenre.name}
              </h3>
              <span className="text-[11px] font-mono text-zinc-500 font-bold">
                {genreTracks.length} Top Songs
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse pt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-white/[0.02] border border-white/[0.04] rounded-2xl w-full" />
                ))}
              </div>
            ) : genreTracks.length > 0 ? (
              <div className="space-y-1.5">
                {genreTracks.map((song, idx) => {
                  const isCurrent = song.videoId === videoId;
                  const isCurrentPlaying = isCurrent && isPlaying;
                  const isLiked = likedSongs.some((s) => s.videoId === song.videoId);

                  return (
                    <div
                      key={`${song.videoId}-${idx}`}
                      onClick={() => playSong(song, idx)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.04] hover:border-purple-500/20 transition-all duration-150 cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-5 text-center text-[11px] font-mono text-zinc-500 group-hover:hidden">
                          {isCurrentPlaying ? (
                            <Volume2 size={13} className="text-purple-400 animate-pulse mx-auto" />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <Play size={11} fill="white" className="text-white mx-auto hidden group-hover:block" />

                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/5 shadow-sm">
                          <SafeImage
                            src={song.thumbnail}
                            videoId={song.videoId}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            fallbackType="song"
                          />
                        </div>

                        <div className="min-w-0 text-left">
                          <p className={`text-xs font-bold truncate ${isCurrent ? "text-purple-300 font-black" : "text-zinc-200 group-hover:text-white"}`}>
                            {song.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-medium">
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                          {song.duration ? formatDur(song.duration) : "3:30"}
                        </span>
                        <button
                          onClick={() => toggleLike(song)}
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
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs font-semibold">
                No tracks loaded for this genre.
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
