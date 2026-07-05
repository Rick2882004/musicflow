"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SongCard } from "@/components/ui/SongCard";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Play, Shuffle, Heart, Share2, Award, Calendar, Users } from "lucide-react";
import { Track, Artist } from "@/types/music";

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();

  const artistName = decodeURIComponent(params.name as string);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { setQueue, setTrack } = usePlayerStore(useShallow((s) => ({
    setQueue: s.setQueue,
    setTrack: s.setTrack,
  })));

  useEffect(() => {
    async function loadArtistData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/artist?name=${encodeURIComponent(artistName)}`);
        if (!res.ok) throw new Error("Failed to load artist details");
        const data = await res.json();
        setArtist(data);
      } catch (err) {
        console.error("Artist profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadArtistData();

    const followed = localStorage.getItem(`artist-${artistName}`);
    setIsFollowing(followed === "true");
  }, [artistName]);

  const toggleFollow = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    localStorage.setItem(`artist-${artistName}`, String(nextState));
  };

  const shareArtist = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    alert("Artist link copied to clipboard! 🔗");
  };

  const playAll = () => {
    if (!artist?.songs || artist.songs.length === 0) return;
    setQueue(artist.songs);
    const first = artist.songs[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  const shufflePlay = () => {
    if (!artist?.songs || artist.songs.length === 0) return;
    const shuffled = [...artist.songs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    const first = shuffled[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-[250px] w-full bg-white/5 rounded-3xl" />
        {/* Controls skeleton */}
        <div className="flex gap-4">
          <div className="h-12 w-28 bg-white/5 rounded-full" />
          <div className="h-12 w-28 bg-white/5 rounded-full" />
          <div className="h-12 w-12 bg-white/5 rounded-full" />
        </div>
        {/* Tracks List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!artist) {
    return <main className="p-8 text-zinc-400">Artist details not found</main>;
  }

  const artistImage = artist.image || artist.thumbnails?.[artist.thumbnails.length - 1]?.url || "/logo.png";
  const bioSummary = artist.description || artist.bio || `${artist.name} is a verified artist on MusicFlow. Stream their latest tracks and explore their dynamic music library below.`;

  return (
    <main className="space-y-12">
      {/* 1. Artist Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${artistImage})` }}
        />
        <div className="relative bg-gradient-to-r from-purple-900/40 via-zinc-950/80 to-[#07070a] border border-white/5 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={artistImage}
            alt={artist.name}
            className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white/10 shadow-2xl shrink-0"
          />

          <div className="space-y-4 text-center md:text-left min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider select-none">
              <Award size={12} />
              Verified Artist
            </span>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none truncate">
              {artist.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-zinc-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Users size={12} className="text-zinc-500" />
                {artist.monthlyListeners || "22M"} Monthly Listeners
              </span>
              <span>•</span>
              <span>{artist.songs?.length || 0} Tracks available</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Actions row */}
      <div className="flex items-center flex-wrap gap-4 select-none">
        <button
          onClick={playAll}
          className="px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-lg shadow-purple-600/25"
        >
          <Play size={16} fill="white" className="text-white" />
          Play All
        </button>

        <button
          onClick={shufflePlay}
          className="px-6 py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-200 hover:text-white font-bold text-xs flex items-center gap-2 transition"
        >
          <Shuffle size={14} />
          Shuffle
        </button>

        <button
          onClick={toggleFollow}
          className={`px-6 py-3.5 rounded-full text-xs font-bold flex items-center gap-2 transition ${
            isFollowing
              ? "bg-pink-600/10 border border-pink-500/30 text-pink-300 hover:bg-pink-600/20"
              : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
          }`}
        >
          <Heart size={14} fill={isFollowing ? "currentColor" : "none"} />
          {isFollowing ? "Following" : "Follow"}
        </button>

        <button
          onClick={shareArtist}
          className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition"
          aria-label="Share artist"
        >
          <Share2 size={14} />
        </button>
      </div>

      {/* 3. Popular Songs list */}
      {artist.songs && artist.songs.length > 0 && (
        <section>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-6">Popular Tracks</h2>
          <div className="space-y-2.5">
            {artist.songs.slice(0, 5).map((song, index) => (
              <div
                key={song.videoId}
                onClick={() => {
                  if (artist.songs) {
                    setQueue(artist.songs);
                    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
                  }
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-6 text-center text-xs font-bold text-zinc-600 group-hover:text-purple-400 transition-colors">
                    {index + 1}
                  </span>
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
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
                    : "3:40"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Albums & Singles section */}
      {artist.albums && artist.albums.length > 0 && (
        <section>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-6">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {artist.albums.slice(0, 6).map((album) => (
              <a
                key={album.albumId}
                href={`/album/${album.albumId}`}
                className="bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] rounded-2xl p-4 transition-all duration-300 flex flex-col group shadow-md"
              >
                <img
                  src={album.thumbnail}
                  alt={album.name}
                  className="w-full aspect-square object-cover rounded-xl shadow-md group-hover:scale-[1.02] transition duration-300"
                />
                <h3 className="text-xs font-semibold mt-4 text-zinc-200 group-hover:text-white transition-colors truncate">
                  {album.name}
                </h3>
                {album.year && (
                  <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                    <Calendar size={10} />
                    {album.year}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 5. Biography / About Card */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-6">About</h2>
        <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-4">
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: bioSummary }} />
        </div>
      </section>

      {/* 6. Related Artists ("Fans Also Like") */}
      {artist.similarArtists && artist.similarArtists.length > 0 && (
        <section>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-6">Fans Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {artist.similarArtists.slice(0, 5).map((sim) => {
              const simImage = sim.thumbnails?.[sim.thumbnails.length - 1]?.url || "/logo.png";
              return (
                <div
                  key={sim.artistId}
                  onClick={() => router.push(`/artist/${encodeURIComponent(sim.name)}`)}
                  className="cursor-pointer bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] rounded-2xl p-4 transition duration-300 flex flex-col items-center shadow-md group"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-white/10 shadow-inner">
                    <img
                      src={simImage}
                      alt={sim.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <h3 className="text-xs font-semibold mt-3 text-zinc-200 truncate w-full text-center group-hover:text-white">
                    {sim.name}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1">Artist</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}