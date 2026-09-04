"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { Play, Pause } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { Track } from "@/types/music";

const FALLBACK_QUICK_PICKS: Track[] = [
  {
    videoId: "JFcgOboQZ08",
    title: "Tum Hi Ho",
    artist: "Arijit Singh",
    thumbnail: "https://img.youtube.com/vi/JFcgOboQZ08/hqdefault.jpg",
    duration: 262,
  },
  {
    videoId: "V0KD0nDkbpM",
    title: "Bekhayali",
    artist: "Sachet Tandon",
    thumbnail: "https://img.youtube.com/vi/V0KD0nDkbpM/hqdefault.jpg",
    duration: 371,
  },
  {
    videoId: "k4yXQkG2s1E",
    title: "Kesariya",
    artist: "Arijit Singh",
    thumbnail: "https://img.youtube.com/vi/k4yXQkG2s1E/hqdefault.jpg",
    duration: 268,
  },
  {
    videoId: "kJQP7kiw5Fk",
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    duration: 282,
  },
  {
    videoId: "JGwWNGJdvx8",
    title: "Shape of You",
    artist: "Ed Sheeran",
    thumbnail: "https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    duration: 233,
  },

  {
    videoId: "OPf0YbXqDm0",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    thumbnail: "https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg",
    duration: 270,
  },
];

export default function HomeHero() {
  const { recentSongs, likedSongs, setTrack, setQueue, isPlaying, videoId } =
    usePlayerStore(
      useShallow((s) => ({
        recentSongs: s.recentSongs,
        likedSongs: s.likedSongs,
        setTrack: s.setTrack,
        setQueue: s.setQueue,
        isPlaying: s.isPlaying,
        videoId: s.videoId,
      }))
    );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // If recent songs exist, use them; otherwise use verified instant quick picks
  const hasRecents = recentSongs.length > 0;
  const displayItems = hasRecents
    ? recentSongs.slice(0, 6)
    : FALLBACK_QUICK_PICKS;

  const handlePlay = (song: Track, idx: number) => {
    setQueue(displayItems);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, idx);
  };

  return (
    <section className="px-4 md:px-8 pt-3 md:pt-5 pb-1 select-none text-left">
      {/* Greeting Header & Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
        <div>
          <p
            className="text-[9px] font-black uppercase mb-0.5"
            style={{ letterSpacing: "0.18em", color: "var(--mf-text-dim)" }}
          >
            {hasRecents ? "Continue Listening" : "Welcome Back"}
          </p>
          <h1
            className="text-lg md:text-xl font-black tracking-tight"
            style={{ color: "var(--mf-text-primary)" }}
          >
            {greeting}
          </h1>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <button
            className="px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs"
            style={{
              background: "var(--mf-text-primary)",
              color: "var(--mf-text-inverse)",
            }}
          >
            All
          </button>
          <Link
            href="/explore"
            className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all hover:bg-white/8 whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--mf-border)",
              color: "var(--mf-text-secondary)",
            }}
          >
            Browse
          </Link>
          <Link
            href="/genres"
            className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all hover:bg-white/8 whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--mf-border)",
              color: "var(--mf-text-secondary)",
            }}
          >
            Genres
          </Link>
          <Link
            href="/liked"
            className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all hover:bg-white/8 whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--mf-border)",
              color: "var(--mf-text-secondary)",
            }}
          >
            Liked ({likedSongs.length})
          </Link>
        </div>
      </div>

      {/* Quick Resume Grid (2 cols on mobile, 3 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
        {displayItems.map((song, idx) => {
          const isCurrent = song.videoId === videoId;
          const isCurrentPlaying = isCurrent && isPlaying;

          return (
            <div
              key={`quick-${song.videoId}-${idx}`}
              onClick={() => handlePlay(song, idx)}
              className="group flex items-center justify-between rounded-lg transition-all duration-150 cursor-pointer overflow-hidden pr-2.5 select-none"
              style={{
                background: isCurrent ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.025)",
                border: isCurrent ? "1px solid var(--mf-border-accent)" : "1px solid var(--mf-border)",
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.055)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--mf-border-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--mf-border)";
                }
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-12 h-12 sm:w-13 sm:h-13 shrink-0 bg-zinc-900 relative">
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
                <div className="min-w-0 flex-1 pr-1">
                  <p
                    className="text-[12px] font-bold truncate leading-snug"
                    style={{
                      color: isCurrent ? "var(--mf-accent-light)" : "var(--mf-text-primary)",
                    }}
                  >
                    {song.title}
                  </p>
                  <p
                    className="text-[10px] truncate mt-0.5 font-medium"
                    style={{ color: "var(--mf-text-muted)" }}
                  >
                    {song.artist}
                  </p>
                </div>
              </div>

              {/* Instant Play/Pause Button on Hover */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-150 shrink-0 ${
                  isCurrentPlaying
                    ? "opacity-100 scale-100"
                    : "opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90"
                }`}
                style={{
                  background: isCurrentPlaying ? "var(--mf-playing)" : "var(--mf-accent)",
                  color: "#fff",
                }}
              >
                {isCurrentPlaying ? (
                  <Pause size={12} fill="currentColor" />
                ) : (
                  <Play size={12} fill="currentColor" className="ml-0.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

