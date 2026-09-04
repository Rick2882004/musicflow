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
import { ShareModal } from "@/components/social/ShareModal";

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const artistProfileCache = new Map<string, { data: Artist; timestamp: number }>();
const ARTIST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();

  const artistName = decodeURIComponent(params.name as string);

  const [artist, setArtist] = useState<Artist | null>(() => {
    const cached = artistProfileCache.get(artistName.toLowerCase());
    return cached && Date.now() - cached.timestamp < ARTIST_CACHE_TTL ? cached.data : null;
  });
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`artist-${artistName}`) === "true";
    }
    return false;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = artistProfileCache.get(artistName.toLowerCase());
    return !(cached && Date.now() - cached.timestamp < ARTIST_CACHE_TTL);
  });
  const [shareOpen, setShareOpen] = useState(false);

  const { setQueue, setTrack } = usePlayerStore(useShallow((s) => ({
    setQueue: s.setQueue,
    setTrack: s.setTrack,
  })));

  useEffect(() => {
    let isMounted = true;

    async function loadArtistData() {
      const cached = artistProfileCache.get(artistName.toLowerCase());
      if (cached && Date.now() - cached.timestamp < ARTIST_CACHE_TTL) {
        setArtist(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/artist?name=${encodeURIComponent(artistName)}`);
        if (!res.ok) throw new Error("Failed to load artist details");
        const data: Artist = await res.json();
        if (isMounted) {
          setArtist(data);
          artistProfileCache.set(artistName.toLowerCase(), { data, timestamp: Date.now() });
        }
      } catch (err) {
        console.error("Artist profile fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArtistData();

    return () => {
      isMounted = false;
    };
  }, [artistName]);

  const toggleFollow = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    localStorage.setItem(`artist-${artistName}`, String(nextState));
  };

  const shareArtist = () => {
    setShareOpen(true);
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
    <main className="space-y-8 select-none text-left px-4 md:px-8 pt-4 pb-24">
      {/* 1. Standard Artist Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-2 pb-2">
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden shrink-0 border border-white/[0.08] shadow-lg">
          <SafeImage
            src={artistImage}
            alt={artist.name}
            className="w-full h-full object-cover"
            fallbackType="artist"
          />
        </div>

        <div className="space-y-2.5 text-center md:text-left min-w-0 flex-grow">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none"
            style={{
              background: "rgba(124,58,237,0.10)",
              border: "1px solid rgba(124,58,237,0.25)",
              color: "var(--mf-accent-light)",
            }}
          >
            <Award size={11} />
            Verified Artist
          </span>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight truncate">
            {artist.name}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[11px] font-semibold" style={{ color: "var(--mf-text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <Users size={12} />
              {artist.monthlyListeners || "22M"} Monthly Listeners
            </span>
            <span className="text-zinc-700">·</span>
            <span>{artist.songs?.length || 0} Tracks available</span>
          </div>
        </div>
      </div>


      {/* Actions Row */}
      <div className="flex items-center flex-wrap justify-between gap-4 select-none">
        <div className="flex items-center gap-2.5">
          <button
            onClick={playAll}
            className="px-5 py-2 rounded-full text-white font-bold text-[12px] flex items-center gap-2 hover:scale-102 active:scale-97 transition shadow-md cursor-pointer"
            style={{ background: "var(--mf-accent)" }}
          >
            <Play size={13} fill="currentColor" />
            Play
          </button>

          <button
            onClick={shufflePlay}
            className="px-4 py-2 rounded-full text-zinc-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--mf-border)" }}
          >
            <Shuffle size={12} />
            Shuffle
          </button>

          <button
            onClick={toggleFollow}
            className={`px-4 py-2 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isFollowing
                ? "bg-pink-500/15 border border-pink-500/30 text-pink-400"
                : "bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white"
            }`}
          >
            <Heart size={12} fill={isFollowing ? "currentColor" : "none"} />
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>

        <button
          onClick={shareArtist}
          className="p-2 rounded-full text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--mf-border)" }}
          aria-label="Share artist"
        >
          <Share2 size={13} />
        </button>
      </div>

      {/* Popular Songs */}
      {artist.songs && artist.songs.length > 0 && (
        <section className="mf-section">
          <div className="mf-section-header">
            <div>
              <p
                className="text-[9px] font-black uppercase mb-1"
                style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
              >
                Popular
              </p>
              <h2 className="mf-section-title">Top Tracks</h2>
            </div>
          </div>
          <div className="space-y-1.5">
            {artist.songs.slice(0, 8).map((song, index) => (
              <div
                key={song.videoId}
                onClick={() => playSong(song, index)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-[14px] cursor-pointer group transition-all duration-150 select-none"
                style={{
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid var(--mf-border-soft)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.30)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--mf-border-soft)";
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-5 text-center text-[11px] font-mono" style={{ color: "var(--mf-text-dim)" }}>
                    {index + 1}
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                    style={{ background: "var(--mf-bg-card)", border: "1px solid var(--mf-border-soft)" }}
                  >
                    <SafeImage
                      src={song.thumbnail}
                      videoId={song.videoId}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="text-[12px] font-bold truncate transition-colors"
                      style={{ color: "var(--mf-text-primary)" }}
                    >
                      {song.title}
                    </h3>
                    <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--mf-text-muted)" }}>{song.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: "var(--mf-text-muted)" }}>
                    {song.duration ? formatDur(song.duration) : "3:40"}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md transition-opacity"
                    style={{ background: "var(--mf-accent)", color: "#fff" }}
                  >
                    <Play size={10} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Albums section */}
      {artist.albums && artist.albums.length > 0 && (
        <section className="mf-section">
          <div className="mf-section-header">
            <div>
              <p
                className="text-[9px] font-black uppercase mb-1"
                style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
              >
                Releases
              </p>
              <h2 className="mf-section-title">Featured Albums</h2>
            </div>
          </div>
          <div className="mf-rail -mx-4 md:-mx-8 px-4 md:px-8">
            {artist.albums.slice(0, 6).map((album) => (
              <Link key={album.albumId} href={`/album/${album.albumId}`}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="group shrink-0 w-[150px] md:w-[170px] flex flex-col gap-2.5 cursor-pointer text-left focus:outline-none"
                >
                  <div
                    className="relative rounded-[16px] overflow-hidden aspect-square transition-all duration-300"
                    style={{
                      background: "var(--mf-bg-card)",
                      border: "1px solid var(--mf-border)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    <SafeImage
                      src={album.thumbnail}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="album"
                    />
                  </div>
                  <div className="px-0.5">
                    <p
                      className="text-[12px] font-bold truncate leading-tight transition-colors"
                      style={{ color: "var(--mf-text-primary)" }}
                    >
                      {album.name}
                    </p>
                    {album.year && (
                      <p className="text-[10px] font-medium truncate mt-0.5 flex items-center gap-1" style={{ color: "var(--mf-text-muted)" }}>
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
      <section className="mf-section">
        <div className="mf-section-header">
          <div>
            <p
              className="text-[9px] font-black uppercase mb-1"
              style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
            >
              About
            </p>
            <h2 className="mf-section-title">Biography</h2>
          </div>
        </div>
        <div
          className="p-5 md:p-6 rounded-2xl bg-[#121216] border border-white/[0.06]"
        >
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--mf-text-secondary)" }}>
            {bioSummary}
          </p>
        </div>
      </section>

      {/* Similar Artists */}
      {artist.similarArtists && artist.similarArtists.length > 0 && (
        <section className="mf-section">
          <div className="mf-section-header">
            <div>
              <p
                className="text-[9px] font-black uppercase mb-1"
                style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
              >
                Related
              </p>
              <h2 className="mf-section-title">Fans Also Like</h2>
            </div>
          </div>
          <div className="mf-rail -mx-4 md:-mx-8 px-4 md:px-8">
            {artist.similarArtists.slice(0, 6).map((sim) => {
              const simImage = sim.thumbnails?.[sim.thumbnails.length - 1]?.url || "/logo.png";
              return (
                <motion.div
                  key={sim.artistId}
                  whileHover={{ y: -5 }}
                  onClick={() => router.push(`/artist/${encodeURIComponent(sim.name)}`)}
                  className="cursor-pointer group flex flex-col items-center gap-2.5 shrink-0 focus:outline-none w-[100px]"
                >
                  <div
                    className="relative w-20 h-20 rounded-full overflow-hidden transition-all duration-300 shadow-md"
                    style={{ background: "var(--mf-bg-card)", border: "1px solid var(--mf-border)" }}
                  >
                    <SafeImage
                      src={simImage}
                      alt={sim.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="artist"
                    />
                  </div>
                  <div className="text-center w-full">
                    <h3
                      className="text-[12px] font-bold truncate leading-tight transition-colors"
                      style={{ color: "var(--mf-text-secondary)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--mf-text-primary)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--mf-text-secondary)"; }}
                    >
                      {sim.name}
                    </h3>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--mf-text-muted)" }}>Artist</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {artist && (
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          title={artist.name}
          subtitle={`${artist.monthlyListeners || "22M"} Monthly Listeners · MusicFlow`}
          thumbnail={artist.thumbnails?.[artist.thumbnails.length - 1]?.url || "/logo.png"}
          type="artist"
        />
      )}
    </main>
  );
}