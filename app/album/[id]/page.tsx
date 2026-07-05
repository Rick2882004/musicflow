"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Play, Shuffle, Calendar, Music, Clock } from "lucide-react";
import Link from "next/link";
import { Track, Album } from "@/types/music";

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
      <div className="space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-[250px] w-full bg-white/5 rounded-3xl" />
        {/* Controls skeleton */}
        <div className="flex gap-4">
          <div className="h-12 w-28 bg-white/5 rounded-full" />
          <div className="h-12 w-28 bg-white/5 rounded-full" />
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

  if (!album) {
    return (
      <main className="p-8 text-zinc-400">
        <p>Album not found.</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs">
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
    <main className="space-y-8">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-25 pointer-events-none"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
        <div className="relative bg-gradient-to-r from-purple-900/40 via-zinc-950/80 to-[#07070a] border border-white/5 p-8 md:p-10 flex flex-col sm:flex-row items-center gap-8 shadow-2xl">
          <img
            src={coverImage}
            alt={album.name}
            className="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover shadow-2xl border border-white/5"
          />

          <div className="space-y-3 text-center sm:text-left min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Album
            </span>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none truncate">
              {album.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-zinc-300">
              {album.artist.artistId ? (
                <Link
                  href={`/artist/${encodeURIComponent(album.artist.name)}`}
                  className="hover:text-purple-400 transition font-bold"
                >
                  {album.artist.name}
                </Link>
              ) : (
                <span className="font-semibold">{album.artist.name}</span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {album.year || "2024"}
              </span>
              <span>•</span>
              <span>{songCount} songs</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formattedDuration}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Actions Bar */}
      <div className="flex items-center gap-4 select-none">
        {songCount > 0 && (
          <>
            <button
              onClick={playAlbum}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-lg shadow-purple-600/25"
            >
              <Play size={16} fill="white" className="text-white" />
              Play
            </button>

            <button
              onClick={shuffleAlbum}
              className="px-6 py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-200 hover:text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <Shuffle size={14} />
              Shuffle
            </button>
          </>
        )}
      </div>

      {/* 3. Songs Tracklist Table */}
      {songCount > 0 ? (
        <section className="space-y-2">
          {album.songs?.map((song, index) => (
            <div
              key={song.videoId}
              onClick={() => playSong(song, index)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-6 text-center text-xs font-bold text-zinc-600 group-hover:text-purple-400 transition-colors">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                    {song.title}
                  </h3>
                  <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
                </div>
              </div>

              <div className="text-zinc-500 text-xs font-semibold">
                {song.duration
                  ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
                  : "3:30"}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="text-center py-12">
          <Music className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No tracks inside this album.</p>
        </div>
      )}
    </main>
  );
}