"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlayerStore } from "@/store/player-store";
import { SongCard } from "@/components/ui/SongCard";
import { Track } from "@/types/music";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";

export default function HomeRecommendations() {
  const { recentSongs, likedSongs, setTrack, setQueue } = usePlayerStore(useShallow((s) => ({
    recentSongs: s.recentSongs,
    likedSongs: s.likedSongs,
    setTrack: s.setTrack,
    setQueue: s.setQueue,
  })));

  const [trendingSongs, setTrendingSongs] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<Track[]>([]);
  const [likedFallbackSongs, setLikedFallbackSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrending = useCallback(async () => {
    try {
      const res = await fetch("/api/search?q=Trending Songs");
      const json = await res.json();
      setTrendingSongs(json.results?.slice(0, 10) || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadReleases = useCallback(async () => {
    try {
      const res = await fetch("/api/search?q=Latest Hits");
      const json = await res.json();
      setNewReleases(json.results?.slice(0, 5) || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadRecommended = useCallback(async () => {
    try {
      const query = likedSongs.length > 0 
        ? `${likedSongs[0].artist} radio`
        : "Chill Lofi Beats";
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setRecommendedSongs(json.results?.slice(0, 5) || []);
    } catch (error) {
      console.error(error);
    }
  }, [likedSongs]);

  const loadLikedFallback = useCallback(async () => {
    if (likedSongs.length === 0) return;
    try {
      const randomLiked = likedSongs[Math.floor(Math.random() * likedSongs.length)];
      const res = await fetch(`/api/search?q=${encodeURIComponent(randomLiked.title)}`);
      const json = await res.json();
      const songs = (json.results || []).filter((s: Track) => s.videoId !== randomLiked.videoId);
      setLikedFallbackSongs(songs.slice(0, 5));
    } catch (error) {
      console.error(error);
    }
  }, [likedSongs]);

  useEffect(() => {
    async function loadAllHomeSongs() {
      setLoading(true);
      try {
        await Promise.all([
          loadTrending(),
          loadReleases(),
          loadRecommended(),
          loadLikedFallback(),
        ]);
      } catch (err) {
        console.error("Error loading home songs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllHomeSongs();
  }, [loadTrending, loadReleases, loadRecommended, loadLikedFallback]);

  const playSong = (song: Track, index: number, songQueue: Track[]) => {
    const uniqueQueue = Array.from(
      new Map(songQueue.map((item) => [item.videoId, item])).values()
    );
    setQueue(uniqueQueue);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  const trendingAlbums = [
    { id: "MPREb_HtIOxExZ0ci", title: "Arijit Singh Hits", artist: "Arijit Singh", image: "https://i.ytimg.com/vi/V0KD0nDkbpM/hqdefault.jpg" },
    { id: "MPREb_FCKWeH9GnWF", title: "Jigra Collection", artist: "Achint", image: "https://yt3.googleusercontent.com/F8s9lSInfQQu6PvEl23by6_KPoazHLcjk4226uEZqcabT7w_QQP4IX8nxutH5pLJOtwAi32VfMhRJPo=w226-h226-l90-rj" },
    { id: "MPREb_aak6B9FGA6U", title: "Bollywood Romance Essentials", artist: "Various Artists", image: "https://yt3.googleusercontent.com/FPXzFBDqz2viDjL-yyPFSVLyzc8dv9uLHBVyJIfSc1hTQiGe6Lie2fbVRhMjpYtMD1NLcNo_l3T9Mg=w226-h226-l90-rj" },
    {
  id: "MPREb_HtIOxExZ0cj",
  title: "Kabir Singh",
  artist: "Sachet Tandon",
  image: "https://i.ytimg.com/vi/xRb8hxwN5zc/hqdefault.jpg"
},
    { id: "MPREb_HtIOxExZ0ck", title: "Lofi Bollywood", artist: "Lofi Fruit", image: "https://i.ytimg.com/vi/OkpIoEC44kk/hqdefault.jpg" }
  ];

  if (loading) {
    return (
      <div className="space-y-12 mt-10">
        {[1, 2, 3].map((sectionIdx) => (
          <section key={sectionIdx} className="space-y-4">
            <div className="w-48 h-6 mf-skeleton rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {[1, 2, 3, 4, 5].map((cardIdx) => (
                <div key={cardIdx} className="space-y-3">
                  <div className="aspect-square w-full mf-skeleton rounded-2xl" />
                  <div className="w-3/4 h-4 mf-skeleton rounded-md" />
                  <div className="w-1/2 h-3 mf-skeleton rounded-md" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-14 mt-10">
      {/* 1. Quick Picks / Recents */}
      {recentSongs.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white select-none">
                Quick Picks
              </h2>
              <p className="text-xs text-zinc-500">Jump back into your recent tracks</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentSongs.slice(0, 6).map((song, index) => (
              <div
                key={`${song.videoId}-quick-${index}`}
                onClick={() => playSong(song, index, recentSongs)}
              >
                <SongCard
                  song={{
                    id: song.videoId,
                    title: song.title,
                    artist: song.artist,
                    thumbnail: song.thumbnail,
                    duration: song.duration || 180,
                  }}
                />
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* 2. Trending Now */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white select-none">
            Trending Now
          </h2>
          <p className="text-xs text-zinc-500">The most popular hits stream-wide</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {trendingSongs.map((song, index) => (
            <div
              key={`${song.videoId}-trending`}
              onClick={() => playSong(song, index, trendingSongs)}
            >
              <SongCard
                song={{
                  id: song.videoId,
                  title: song.title,
                  artist: song.artist,
                  thumbnail: song.thumbnail,
                  duration: song.duration || 180,
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 3. Recommended Songs */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white select-none">
            Recommended For You
          </h2>
          <p className="text-xs text-zinc-500">Personalized tracks based on your vibe</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {recommendedSongs.map((song, index) => (
            <div
              key={`${song.videoId}-recom`}
              onClick={() => playSong(song, index, recommendedSongs)}
            >
              <SongCard
                song={{
                  id: song.videoId,
                  title: song.title,
                  artist: song.artist,
                  thumbnail: song.thumbnail,
                  duration: song.duration || 180,
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 4. Because You Liked */}
      {likedSongs.length > 0 && likedFallbackSongs.length > 0 && (
        <section>
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white select-none">
              Because You Liked:{" "}
              <span className="text-purple-400 font-semibold">{likedSongs[0].title}</span>
            </h2>
            <p className="text-xs text-zinc-500">Related to your favorite tracks</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {likedFallbackSongs.map((song, index) => (
              <div
                key={`${song.videoId}-by-liked`}
                onClick={() => playSong(song, index, likedFallbackSongs)}
              >
                <SongCard
                  song={{
                    id: song.videoId,
                    title: song.title,
                    artist: song.artist,
                    thumbnail: song.thumbnail,
                    duration: song.duration || 180,
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Trending Albums */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white select-none">
            Trending Albums
          </h2>
          <p className="text-xs text-zinc-500">Popular album releases</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {trendingAlbums.map((album) => (
            <a
              key={album.id}
              href={`/album/${album.id}`}
              className="bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] rounded-2xl p-4 transition-all duration-300 flex flex-col group shadow-md"
            >
              <img
  src={album.image}
  alt={album.title}
  onError={(e) => {
    e.currentTarget.src =
      "https://placehold.co/500x500/18181b/ffffff?text=Album";
  }}
  className="w-full aspect-square object-cover rounded-xl shadow-md group-hover:scale-[1.02] transition duration-300"
/>
              <h3 className="text-sm font-semibold mt-4 text-zinc-200 group-hover:text-white transition-colors truncate">
                {album.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 truncate">{album.artist}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 6. New Releases */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white select-none">
            New Releases
          </h2>
          <p className="text-xs text-zinc-500">Hot off the press bollywood singles</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {newReleases.map((song, index) => (
            <div
              key={`${song.videoId}-release`}
              onClick={() => playSong(song, index, newReleases)}
            >
              <SongCard
                song={{
                  id: song.videoId,
                  title: song.title,
                  artist: song.artist,
                  thumbnail: song.thumbnail,
                  duration: song.duration || 180,
                }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}