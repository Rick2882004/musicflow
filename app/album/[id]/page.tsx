"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Play, Shuffle, Calendar, Music, Share2, Bookmark, BookmarkCheck, ListPlus } from "lucide-react";
import Link from "next/link";
import { Track, Album } from "@/types/music";
import { SafeImage } from "@/components/ui/SafeImage";
import { ShareModal } from "@/components/social/ShareModal";
import { AddToPlaylistModal } from "@/components/ui/AddToPlaylistModal";

function formatDur(s: number = 0) {
  if (!s || isNaN(s)) return "--:--";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const albumDetailsCache = new Map<string, { data: Album; timestamp: number }>();
const ALBUM_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(() => {
    const cached = albumDetailsCache.get(albumId);
    return cached && Date.now() - cached.timestamp < ALBUM_CACHE_TTL ? cached.data : null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = albumDetailsCache.get(albumId);
    return !(cached && Date.now() - cached.timestamp < ALBUM_CACHE_TTL);
  });
  const [shareOpen, setShareOpen] = useState(false);
  const [playlistSong, setPlaylistSong] = useState<Track | null>(null);

  const { setTrack, setQueue, savedAlbums, toggleSaveAlbum } = usePlayerStore(useShallow((s) => ({
    setTrack: s.setTrack,
    setQueue: s.setQueue,
    savedAlbums: s.savedAlbums,
    toggleSaveAlbum: s.toggleSaveAlbum,
  })));

  useEffect(() => {
    let isMounted = true;

    async function loadAlbumData() {
      const cached = albumDetailsCache.get(albumId);
      if (cached && Date.now() - cached.timestamp < ALBUM_CACHE_TTL) {
        setAlbum(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/album?id=${encodeURIComponent(albumId)}`);
        if (!res.ok) throw new Error("Failed to load album details");
        const data: Album = await res.json();
        if (isMounted) {
          setAlbum(data);
          albumDetailsCache.set(albumId, { data, timestamp: Date.now() });
        }
      } catch (err) {
        console.error("Album page fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAlbumData();

    return () => {
      isMounted = false;
    };
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
  const isSaved = savedAlbums.some((a) => a.albumId === albumId);

  return (
    <main className="space-y-8 select-none text-left px-4 md:px-8 pt-4 pb-24">
      {/* 1. Standard Album Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-2 pb-2">
        <SafeImage
          src={coverImage}
          title={album.name}
          artist={album.artist?.name}
          alt={album.name}
          className="w-36 h-36 md:w-44 md:h-44 rounded-xl object-cover shadow-lg border border-white/[0.08] shrink-0"
          fallbackType="album"
        />

        <div className="space-y-2.5 text-center md:text-left min-w-0 flex-grow">
          <span
            className="text-[9px] font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--mf-text-dim)" }}
          >
            Album
          </span>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight truncate">
            {album.name}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[11px] font-semibold" style={{ color: "var(--mf-text-muted)" }}>
            <Link
              href={`/artist/${encodeURIComponent(album.artist.name)}`}
              className="text-zinc-200 hover:text-purple-400 transition duration-150 font-bold"
            >
              {album.artist.name}
            </Link>
            {album.year ? (
              <>
                <span className="text-zinc-700">·</span>
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {album.year}
                </span>
              </>
            ) : null}
            <span className="text-zinc-700">·</span>
            <span>{songCount} songs</span>
            {totalSeconds > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span>{formattedDuration}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-2.5 select-none">
        {songCount > 0 && (
          <>
            <button
              onClick={playAlbum}
              className="px-5 py-2 rounded-full text-white font-bold text-[12px] flex items-center gap-2 hover:scale-102 active:scale-97 transition shadow-md cursor-pointer"
              style={{ background: "var(--mf-accent)" }}
            >
              <Play size={13} fill="currentColor" />
              Play
            </button>

            <button
              onClick={shuffleAlbum}
              className="px-4 py-2 rounded-full text-zinc-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--mf-border)" }}
            >
              <Shuffle size={12} />
              Shuffle
            </button>
          </>
        )}

        <button
          onClick={() => {
            toggleSaveAlbum({
              albumId,
              name: album.name,
              artist: album.artist?.name || "Unknown Artist",
              year: album.year,
              thumbnail: coverImage,
              songCount,
            });
          }}
          className={`px-4 py-2 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
            isSaved
              ? "bg-purple-600/20 text-purple-300 border border-purple-500/40"
              : "text-zinc-300 hover:text-white"
          }`}
          style={!isSaved ? { background: "rgba(255,255,255,0.03)", border: "1px solid var(--mf-border)" } : undefined}
        >
          {isSaved ? <BookmarkCheck size={13} className="text-purple-400" /> : <Bookmark size={13} />}
          {isSaved ? "Saved" : "Save Album"}
        </button>

        <button
          onClick={() => setShareOpen(true)}
          className="px-4 py-2 rounded-full text-zinc-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--mf-border)" }}
        >
          <Share2 size={12} />
          Share
        </button>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={album.name}
        subtitle={`${album.artist.name}${album.year ? ` · ${album.year}` : ""}`}
        thumbnail={coverImage}
        type="album"
      />

      <AddToPlaylistModal
        isOpen={!!playlistSong}
        onClose={() => setPlaylistSong(null)}
        song={playlistSong}
      />

      {/* Songs Tracklist Table */}
      {songCount > 0 ? (
        <section className="space-y-1.5">
          {album.songs?.map((song, index) => (
            <div
              key={song.videoId || `album-track-${song.title.toLowerCase().trim()}-${index}`}
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
                <div className="min-w-0">
                  <h3
                    className="text-[12px] font-bold truncate transition-colors"
                    style={{ color: "var(--mf-text-primary)" }}
                  >
                    {song.title}
                  </h3>
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

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  title="Add to Playlist"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlaylistSong(song);
                  }}
                  className="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
                >
                  <ListPlus size={13} />
                </button>

                <span className="text-[10px] font-mono tabular-nums min-w-[34px] text-right" style={{ color: "var(--mf-text-muted)" }}>
                  {formatDur(song.duration)}
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
        </section>
      ) : (
        <div
          className="text-center py-16 rounded-[20px]"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--mf-border)" }}
        >
          <Music className="w-7 h-7 text-zinc-700 mx-auto mb-2" />
          <h3 className="text-[14px] font-bold text-white mb-1">Album is empty</h3>
          <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">No tracks inside this album yet.</p>
        </div>
      )}
    </main>
  );
}