"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Play, Shuffle, Calendar, Music, Clock } from "lucide-react";
import Link from "next/link";
import { Track, Album } from "@/types/music";
import { SafeImage } from "@/components/ui/SafeImage";

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  const { setTrack, setQueue } = usePlayerStore(useShallow((s) => ({
    setTrack: s.setTrack,
    setQueue: s.setQueue,
  })));

  useEffect(() => {
    async function loadAlbumData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/album?id=${encodeURIComponent(albumId)}`);
        if (!res.ok) throw new Error("Failed to load album details");
        const data = await res.json();
        setAlbum(data);
      } catch (err) {
        console.error("Album page fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAlbumData();
  }, [albumId]);

  const playAlbum = () => {
    if (!album?.songs || album.songs.length === 0) return;
    setQueue(album.songs);
    const first = album.songs[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  const shuffleAlbum = () => {
    if (!album?.songs || album.songs.length === 0) return;
    const shuffled = [...album.songs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    const first = shuffled[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  const playSong = (song: Track, index: number) => {
    if (!album?.songs) return;
    setQueue(album.songs);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse text-left px-6 md:px-10 pt-10">
        <div className="h-[250px] w-full bg-white/[0.02] border border-white/[0.05] rounded-[24px]" />
        <div className="flex gap-3">
          <div className="h-11 w-24 bg-white/[0.02] border border-white/[0.05] rounded-full" />
          <div className="h-11 w-24 bg-white/[0.02] border border-white/[0.05] rounded-full" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white/[0.015] border border-white/[0.05] rounded-[14px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <main className="p-8 text-zinc-400 text-left text-sm font-semibold">
        <p>Album not found.</p>
        <button onClick={() => router.back()} className="mt-4 px-5 py-2.5 bg-white text-black font-bold rounded-full text-xs">
          Go Back
        </button>
      </main>
    );
  }

  const coverImage = album.thumbnails?.[album.thumbnails.length - 1]?.url || "/logo.png";
  const songCount = album.songs?.length || 0;
  const totalSeconds = album.songs?.reduce((total, song) => total + (song.duration || 0), 0) || 0;
  const formattedDuration = `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;

  return (
    <main className="space-y-10 select-none text-left">
      {/* Immersive Header Banner */}
      <div className="relative overflow-hidden rounded-[24px]">
        {/* Glow Layer */}
        <div className="absolute top-0 right-0 w-[500px] h-[350px] rounded-full bg-purple-900/[0.06] blur-[140px] pointer-events-none" />

        <div className="relative bg-white/[0.015] border border-white/[0.05] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl rounded-[24px]">
          <SafeImage
            src={coverImage}
            alt={album.name}
            className="w-40 h-40 md:w-44 md:h-44 rounded-[22px] object-cover shadow-2xl border border-white/[0.08] shrink-0"
            fallbackType="album"
          />

          <div className="space-y-3.5 text-center md:text-left min-w-0 flex-grow">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400">
              Album Release
            </span>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none truncate">
              {album.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[11px] text-zinc-550 font-bold">
              {album.artist.artistId ? (
                <Link
                  href={`/artist/${encodeURIComponent(album.artist.name)}`}
                  className="text-zinc-300 hover:text-purple-400 transition duration-150 font-bold"
                >
                  {album.artist.name}
                </Link>
              ) : (
                <span className="text-zinc-300">{album.artist.name}</span>
              )}
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {album.year || "2024"}
              </span>
              <span className="text-zinc-700">·</span>
              <span>{songCount} songs</span>
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {formattedDuration}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacing alignment */}
      <div className="border-t border-white/[0.03]" />

      {/* Actions Bar */}
      <div className="flex items-center gap-3 select-none">
        {songCount > 0 && (
          <>
            <button
              onClick={playAlbum}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-150 text-black font-bold text-[13px] flex items-center gap-2 hover:scale-103 active:scale-97 transition shadow-md"
            >
              <Play size={14} fill="currentColor" />
              Play
            </button>

            <button
              onClick={shuffleAlbum}
              className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-zinc-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95"
            >
              <Shuffle size={13} />
              Shuffle
            </button>
          </>
        )}
      </div>

      {/* Songs Tracklist Table */}
      {songCount > 0 ? (
        <section className="space-y-1.5">
          {album.songs?.map((song, index) => (
            <div
              key={song.videoId}
              onClick={() => playSong(song, index)}
              className="flex items-center justify-between px-3 py-2.5 rounded-[14px] bg-white/[0.015] border border-white/[0.05] hover:border-purple-500/20 hover:bg-white/[0.03] transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-6 text-center text-[11px] font-mono text-zinc-650 group-hover:text-purple-400 transition-colors">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                    {song.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-zinc-650 text-[10px] font-mono tabular-nums mr-2">
                  {song.duration ? formatDur(song.duration) : "3:30"}
                </span>
                <div className="w-7 h-7 rounded-full bg-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-black shadow-md transition-opacity">
                  <Play size={10} fill="black" className="text-black ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="text-center py-20 bg-white/[0.015] border border-white/[0.05] rounded-[24px]">
          <Music className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <h3 className="font-display text-[16px] font-bold text-white mb-1">Album is empty</h3>
          <p className="text-[12px] text-zinc-500 max-w-xs mx-auto">No tracks inside this album yet.</p>
        </div>
      )}
    </main>
  );
}