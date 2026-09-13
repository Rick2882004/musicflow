"use client";

import { useEffect, useState, memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useRadioStore } from "@/store/radio-store";
import { useShallow } from "zustand/react/shallow";
import { SmartMix, SmartMixId } from "@/lib/ai/mixes/smart-mixes-service";
import { SafeImage } from "@/components/ui/SafeImage";
import { Play, Shuffle, BookmarkPlus, RotateCw, Radio, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function formatDuration(seconds: number) {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

export const SmartMixesSection = memo(function SmartMixesSection({
  className = "",
}: {
  className?: string;
}) {
  const [mixes, setMixes] = useState<SmartMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [savedMixId, setSavedMixId] = useState<string | null>(null);

  const {
    likedSongs,
    recentSongs,
    history,
    skips,
    setTrack,
    setQueue,
    addPlaylist,
    addSongToPlaylist,
  } = usePlayerStore(
    useShallow((s) => ({
      likedSongs: s.likedSongs,
      recentSongs: s.recentSongs,
      history: s.history,
      skips: s.skips,
      setTrack: s.setTrack,
      setQueue: s.setQueue,
      addPlaylist: s.addPlaylist,
      addSongToPlaylist: s.addSongToPlaylist,
    }))
  );

  const { toggleRadio, radioActive } = useRadioStore();

  useEffect(() => {
    let isMounted = true;
    async function loadMixes() {
      try {
        setLoading(true);
        const res = await fetch("/api/ai/mixes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            likedSongs,
            recentSongs,
            history,
            skips,
          }),
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.mixes && Array.isArray(data.mixes)) {
            setMixes(data.mixes);
          }
        }
      } catch (err) {
        console.error("Failed to load smart mixes:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMixes();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayMix = (mix: SmartMix, shuffle = false) => {
    if (!mix.tracks || mix.tracks.length === 0) return;
    let list = [...mix.tracks];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    const first = list[0];
    setQueue(list);
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  const handleSaveMix = async (mix: SmartMix) => {
    if (!mix.tracks || mix.tracks.length === 0) return;
    setSavedMixId(mix.id);
    await addPlaylist(mix.title);
    const store = usePlayerStore.getState();
    const created = store.playlists[store.playlists.length - 1];
    if (created) {
      for (const track of mix.tracks) {
        await addSongToPlaylist(created.id, track);
      }
    }
    setTimeout(() => setSavedMixId(null), 2500);
  };

  const handleRefreshMix = async (mixId: SmartMixId) => {
    setRefreshingId(mixId);
    try {
      const res = await fetch("/api/ai/mixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mixId,
          likedSongs,
          recentSongs,
          history,
          skips,
          forceRefresh: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mix) {
          setMixes((prev) => prev.map((m) => (m.id === mixId ? data.mix : m)));
        }
      }
    } catch (err) {
      console.error("Failed to refresh mix:", err);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleStartMixRadio = (mix: SmartMix) => {
    if (!mix.tracks || mix.tracks.length === 0) return;
    handlePlayMix(mix, false);
    if (!radioActive) {
      toggleRadio();
    }
  };

  if (loading) {
    return (
      <section className={cn("px-4 md:px-8 space-y-4", className)}>
        <div className="flex items-center gap-2">
          <div className="w-36 h-6 bg-white/[0.05] rounded-lg animate-pulse" />
          <div className="w-16 h-4 bg-white/[0.03] rounded-full animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[220px] h-[280px] rounded-3xl bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (mixes.length === 0) return null;

  return (
    <section className={cn("px-4 md:px-8 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} />
              AI Crafted
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Smart Mixes
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dynamic sets adapted to your taste, mood, and daily flow.
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent -mx-4 md:-mx-8 px-4 md:px-8">
        {mixes.map((mix) => (
          <motion.div
            key={mix.id}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "shrink-0 w-[230px] md:w-[250px] rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden group shadow-lg border border-white/[0.08]",
              "bg-gradient-to-b",
              mix.gradient
            )}
          >
            {/* Ambient inner glow */}
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{ backgroundColor: mix.accent }}
            />

            {/* Top Row: Subtitle & Action Menu */}
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                {mix.subtitle}
              </span>
              <button
                onClick={() => handleRefreshMix(mix.id)}
                disabled={refreshingId === mix.id}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white transition active:scale-90"
                title="Refresh Mix"
                aria-label="Refresh Mix"
              >
                <RotateCw
                  size={12}
                  className={cn(refreshingId === mix.id && "animate-spin text-purple-400")}
                />
              </button>
            </div>

            {/* Middle: Artwork Artwork Preview */}
            <div className="my-3 z-10 flex items-center justify-center">
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-2xl border border-white/20 group-hover:scale-105 transition-transform duration-300">
                <SafeImage
                  src={mix.coverArtwork}
                  alt={mix.title}
                  title={mix.title}
                  artist={mix.subtitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {/* Track count badge */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-white/90">
                  <span>{mix.tracks.length} tracks</span>
                  <span>{formatDuration(mix.totalDuration)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Meta & Action Bar */}
            <div className="space-y-2 z-10">
              <div>
                <h3 className="text-base font-black text-white truncate group-hover:text-purple-200 transition-colors">
                  {mix.title}
                </h3>
                <p className="text-[11px] text-zinc-300/80 line-clamp-2 leading-snug mt-0.5">
                  {mix.description}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  {/* Play Main */}
                  <button
                    onClick={() => handlePlayMix(mix, false)}
                    className="p-2 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition shadow-md flex items-center justify-center"
                    title="Play Mix"
                    aria-label="Play Mix"
                  >
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  </button>

                  {/* Shuffle */}
                  <button
                    onClick={() => handlePlayMix(mix, true)}
                    className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white transition active:scale-90"
                    title="Shuffle Mix"
                    aria-label="Shuffle Mix"
                  >
                    <Shuffle size={13} />
                  </button>

                  {/* Radio */}
                  <button
                    onClick={() => handleStartMixRadio(mix)}
                    className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-purple-300 transition active:scale-90"
                    title="Start Radio from this Mix"
                    aria-label="Mix Radio"
                  >
                    <Radio size={13} />
                  </button>
                </div>

                {/* Save as playlist */}
                <button
                  onClick={() => handleSaveMix(mix)}
                  className={cn(
                    "p-2 rounded-full transition active:scale-90",
                    savedMixId === mix.id
                      ? "bg-purple-500 text-white"
                      : "bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white"
                  )}
                  title={savedMixId === mix.id ? "Saved to Library!" : "Save Mix as Playlist"}
                  aria-label="Save Mix"
                >
                  <BookmarkPlus size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
});
