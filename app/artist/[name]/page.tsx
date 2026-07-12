"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Play, Shuffle, Heart, Share2, Award, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { Track, Artist } from "@/types/music";
import { SafeImage } from "@/components/ui/SafeImage";

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

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
    setTimeout(() => {
      setIsFollowing(followed === "true");
    }, 0);
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

  const playSong = (song: Track, index: number) => {
    if (artist?.songs) {
      setQueue(artist.songs);
      setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
    }
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
      <div className="space-y-12 animate-pulse text-left px-6 md:px-10 pt-10">
        <div className="h-[250px] w-full bg-white/[0.02] border border-white/[0.05] rounded-[24px]" />
        <div className="flex gap-3">
          <div className="h-11 w-24 bg-white/[0.02] border border-white/[0.05] rounded-full" />
          <div className="h-11 w-24 bg-white/[0.02] border border-white/[0.05] rounded-full" />
          <div className="h-11 w-11 bg-white/[0.02] border border-white/[0.05] rounded-full" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white/[0.015] border border-white/[0.05] rounded-[14px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!artist) {
    return <main className="p-8 text-zinc-400 text-left text-sm font-semibold">Artist details not found</main>;
  }

  const artistImage = artist.image || artist.thumbnails?.[artist.thumbnails.length - 1]?.url || "/logo.png";
  const bioSummary = artist.description || artist.bio || `${artist.name} is a verified artist on MusicFlow. Stream their latest tracks and explore their dynamic music library below.`;

  return (
    <main className="space-y-10 select-none text-left">
      {/* Immersive Hero */}
      <div className="relative overflow-hidden rounded-[24px]">
        {/* Glow Layer */}
        <div className="absolute top-0 right-0 w-[500px] h-[350px] rounded-full bg-purple-900/[0.06] blur-[140px] pointer-events-none" />

        <div className="relative bg-white/[0.015] border border-white/[0.05] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl rounded-[24px]">
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={artistImage}
            alt={artist.name}
            className="w-40 h-40 md:w-44 md:h-44 rounded-full object-cover border border-white/[0.08] shadow-2xl shrink-0"
          />

          <div className="space-y-3.5 text-center md:text-left min-w-0 flex-grow">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider select-none">
              <Award size={11} />
              Verified Artist
            </span>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none truncate">
              {artist.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[11px] text-zinc-550 font-bold">
              <span className="flex items-center gap-1.5">
                <Users size={12} />
                {artist.monthlyListeners || "22M"} Monthly Listeners
              </span>
              <span className="text-zinc-700">·</span>
              <span>{artist.songs?.length || 0} Tracks available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacing alignment */}
      <div className="border-t border-white/[0.03]" />

      {/* Actions Row */}
      <div className="flex items-center flex-wrap justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={playAll}
            className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-150 text-black font-bold text-[13px] flex items-center gap-2 hover:scale-103 active:scale-97 transition shadow-md"
          >
            <Play size={14} fill="currentColor" />
            Play
          </button>

          <button
            onClick={shufflePlay}
            className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-zinc-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95"
          >
            <Shuffle size={13} />
            Shuffle
          </button>

          <button
            onClick={toggleFollow}
            className={`px-5 py-2.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 ${
              isFollowing
                ? "bg-pink-500/10 border border-pink-500/20 text-pink-400"
                : "bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white"
            }`}
          >
            <Heart size={13} fill={isFollowing ? "currentColor" : "none"} />
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>

        <button
          onClick={shareArtist}
          className="p-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white transition active:scale-95"
          aria-label="Share artist"
        >
          <Share2 size={13} />
        </button>
      </div>

      {/* Popular Songs */}
      {artist.songs && artist.songs.length > 0 && (
        <section className="space-y-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-650 mb-1.5">
              Popular
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Top Tracks
            </h2>
          </div>
          <div className="space-y-1.5">
            {artist.songs.slice(0, 5).map((song, index) => (
              <div
                key={song.videoId}
                onClick={() => playSong(song, index)}
                className="flex items-center justify-between px-3 py-2.5 rounded-[14px] bg-white/[0.015] border border-white/[0.05] hover:border-purple-500/20 hover:bg-white/[0.03] transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-6 text-center text-[11px] font-mono text-zinc-650 group-hover:text-purple-400 transition-colors">
                    {index + 1}
                  </span>
                  <div className="w-11 h-11 rounded-[10px] overflow-hidden bg-zinc-900 shrink-0 border border-white/5 shadow-md">
                    <SafeImage
                      src={song.thumbnail}
                      videoId={song.videoId}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                      {song.title}
                    </h3>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-zinc-650 tabular-nums">
                    {song.duration ? formatDur(song.duration) : "3:40"}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-black shadow-md transition-opacity">
                    <Play size={10} fill="black" className="text-black ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Albums section */}
      {artist.albums && artist.albums.length > 0 && (
        <section className="space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-650 mb-1.5">
              Releases
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Featured Albums
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
            {artist.albums.slice(0, 6).map((album) => (
              <Link
                key={album.albumId}
                href={`/album/${album.albumId}`}
              >
                <motion.div
                  whileHover={{ y: -6 }}
                  className="group shrink-0 w-[160px] md:w-[180px] flex flex-col gap-3 cursor-pointer text-left focus:outline-none"
                >
                  <div className="relative rounded-[22px] overflow-hidden bg-zinc-900 aspect-square border border-white/[0.05] group-hover:border-purple-500/30 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                    <SafeImage
                      src={album.thumbnail}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="album"
                    />
                  </div>
                  <div className="px-0.5">
                    <p className="font-display text-[13px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight tracking-tight">
                      {album.name}
                    </p>
                    {album.year && (
                      <p className="text-[11px] text-zinc-550 font-medium truncate mt-0.5 flex items-center gap-1">
                        <Calendar size={11} />
                        {album.year}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Biography */}
      <section className="space-y-5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-650 mb-1.5">
            About the Artist
          </p>
          <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
            Biography
          </h2>
        </div>
        <div
          className="rounded-[24px] bg-white/[0.015] border border-white/[0.05] p-6 md:p-8 text-zinc-300 text-sm md:text-[15px] leading-relaxed shadow-lg"
          dangerouslySetInnerHTML={{ __html: bioSummary }}
        />
      </section>

      {/* Similar Artists */}
      {artist.similarArtists && artist.similarArtists.length > 0 && (
        <section className="space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-650 mb-1.5">
              Related
            </p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">
              Fans Also Like
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4 -mx-6 md:-mx-10 px-6 md:px-10">
            {artist.similarArtists.slice(0, 5).map((sim) => {
              const simImage = sim.thumbnails?.[sim.thumbnails.length - 1]?.url || "/logo.png";
              return (
                <motion.div
                  key={sim.artistId}
                  whileHover={{ y: -6 }}
                  onClick={() => router.push(`/artist/${encodeURIComponent(sim.name)}`)}
                  className="cursor-pointer group flex flex-col items-center gap-3 shrink-0 focus:outline-none w-[110px]"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-zinc-900 border border-white/[0.06] group-hover:border-purple-500/40 transition-colors duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                    <SafeImage
                      src={simImage}
                      alt={sim.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="artist"
                    />
                  </div>
                  <div className="text-center w-full">
                    <h3 className="text-[13px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate leading-tight">
                      {sim.name}
                    </h3>
                    <p className="text-[10px] text-zinc-600 font-medium mt-0.5">Artist</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}