"use client";

import { useState, useMemo, memo } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useRadioStore } from "@/store/radio-store";
import { useShallow } from "zustand/react/shallow";
import { computeMusicDNA } from "@/lib/music-dna/music-dna-service";
import { AIPlaylistGeneratorModal } from "@/components/playlist/AIPlaylistGeneratorModal";
import { useRouter } from "next/navigation";
import {
  Dna,
  Play,
  Radio,
  Sparkles,
  Compass,
  User,
  RotateCw,
  Info,
  Layers,
  Flame,
  Globe,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MusicDNACard = memo(function MusicDNACard() {
  const router = useRouter();
  const [showExplainer, setShowExplainer] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const { likedSongs, history, recentSongs, skips, followedArtists, setTrack, setQueue } =
    usePlayerStore(
      useShallow((s) => ({
        likedSongs: s.likedSongs,
        history: s.history,
        recentSongs: s.recentSongs,
        skips: s.skips,
        followedArtists: s.followedArtists,
        setTrack: s.setTrack,
        setQueue: s.setQueue,
      }))
    );

  const { startRadio } = useRadioStore();

  const dna = useMemo(() => {
    return computeMusicDNA({
      likedSongs,
      history,
      recentSongs,
      skips,
      followedArtists,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [likedSongs, history, recentSongs, skips, followedArtists, refreshSeed]);

  const handlePlayTopMusic = () => {
    const allTracks = history.length > 0 ? history.map((h) => h.track) : recentSongs;
    const candidates = allTracks.length > 0 ? allTracks : likedSongs;
    if (candidates.length === 0) return;
    const first = candidates[0];
    setQueue(candidates);
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
  };

  const handleStartRadio = () => {
    const allTracks = history.length > 0 ? history.map((h) => h.track) : recentSongs;
    const seedTrack = allTracks[0] || likedSongs[0];
    if (seedTrack) {
      startRadio(seedTrack);
    }
  };

  const handleExploreGenre = () => {
    router.push("/explore");
  };

  const handleExploreArtist = () => {
    if (dna.topArtists[0]) {
      router.push(`/artist/${encodeURIComponent(dna.topArtists[0].name)}`);
    } else {
      router.push("/explore");
    }
  };

  return (
    <section className="w-full rounded-2xl bg-gradient-to-b from-[#161622]/90 to-[#101017]/90 border border-white/[0.08] p-5 md:p-7 relative overflow-hidden backdrop-blur-xl shadow-2xl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
            <Dna size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
                Personalization Intelligence
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-zinc-400">
                Live Analysis
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
              Your Music DNA
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Decoded from {dna.totalInteractions} verified listening events & library preferences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowExplainer((v) => !v)}
            title="How DNA is calculated"
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border",
              showExplainer
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-white/[0.04] text-zinc-400 hover:text-white border-white/[0.06]"
            )}
          >
            <Info size={13} />
            <span>Explain Signals</span>
          </button>

          <button
            onClick={() => setRefreshSeed((v) => v + 1)}
            title="Recalculate DNA"
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Cold Start View */}
      {dna.isForming ? (
        <div className="relative z-10 py-10 px-4 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center text-purple-400">
            <Headphones size={24} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">Your Music DNA is still forming</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We need at least 3 track interactions to analyze your unique sound signature, genre weights, and listening style.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleExploreGenre}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <Compass size={13} /> Explore Music
            </button>
          </div>
        </div>
      ) : (
        /* Full DNA Profile View */
        <div className="relative z-10 pt-6 space-y-6">
          {/* Sound Profile Banner */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Your Sound Archetype
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-lg font-black text-white">{dna.archetype.title}</h3>
                <span className="text-xs font-semibold text-purple-400">
                  &ldquo;{dna.soundProfile}&rdquo;
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{dna.archetype.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePlayTopMusic}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
              >
                <Play size={13} fill="currentColor" /> Play Your Top Tracks
              </button>
              <button
                onClick={handleStartRadio}
                className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Radio size={13} /> DNA Radio
              </button>
            </div>
          </div>

          {/* Explainers Drawer */}
          {showExplainer && (
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-zinc-300 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
                <Info size={13} /> Scientific Grounding of Your Music DNA
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] text-zinc-400">
                <div>
                  <span className="font-semibold text-zinc-200">Genres Basis: </span>
                  {dna.explainers.genresBasis}
                </div>
                <div>
                  <span className="font-semibold text-zinc-200">Artists Basis: </span>
                  {dna.explainers.artistsBasis}
                </div>
                <div>
                  <span className="font-semibold text-zinc-200">Listening Style: </span>
                  {dna.explainers.styleBasis}
                </div>
                <div>
                  <span className="font-semibold text-zinc-200">Artist Diversity: </span>
                  {dna.explainers.diversityBasis}
                </div>
              </div>
            </div>
          )}

          {/* Key Dimensions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Top Genres with Percentages */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Layers size={13} className="text-purple-400" /> Top Genres
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">By Play Weight</span>
              </div>
              <div className="space-y-2.5">
                {dna.topGenres.map((g) => (
                  <div key={g.genre} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-200 truncate">{g.genre}</span>
                      <span className="font-mono text-zinc-400 font-bold">{g.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(6, Math.min(100, g.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Top Artists Ranked */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <User size={13} className="text-indigo-400" /> Top Artists
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">By Engagement</span>
              </div>
              <div className="space-y-2">
                {dna.topArtists.map((a, idx) => (
                  <div
                    key={a.name}
                    onClick={() => router.push(`/artist/${encodeURIComponent(a.name)}`)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono text-zinc-400 w-4">{idx + 1}</span>
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                        {a.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                      {a.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Style & Diversity Metrics */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Flame size={13} className="text-pink-400" /> Habit Patterns
              </span>

              {/* Familiarity vs Discovery Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-purple-300">
                    Familiar {dna.listeningStyle.familiarPercentage}%
                  </span>
                  <span className="text-teal-300">
                    Discovery {dna.listeningStyle.discoveryPercentage}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-white/[0.06]">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    style={{ width: `${dna.listeningStyle.familiarPercentage}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-emerald-400"
                    style={{ width: `${dna.listeningStyle.discoveryPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  {dna.listeningStyle.description}
                </p>
              </div>

              {/* Languages & Timing */}
              <div className="pt-2 border-t border-white/[0.05] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                    <Globe size={11} /> Top Language
                  </span>
                  <span className="font-semibold text-white block mt-0.5">
                    {dna.topLanguages[0]?.language || "English"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Peak Hours</span>
                  <span className="font-semibold text-white block mt-0.5">
                    {dna.listeningConsistency.primaryTimeOfDay}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Actions Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setPlaylistModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-200 hover:text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Sparkles size={13} className="text-purple-400" />
              Generate DNA Playlist
            </button>

            <button
              onClick={handleExploreGenre}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-200 hover:text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Compass size={13} className="text-indigo-400" />
              Explore {dna.topGenres[0]?.genre || "Genres"}
            </button>

            {dna.topArtists[0] && (
              <button
                onClick={handleExploreArtist}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-200 hover:text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <User size={13} className="text-teal-400" />
                More by {dna.topArtists[0].name}
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Playlist Generator Modal Pre-filled with DNA */}
      <AIPlaylistGeneratorModal
        isOpen={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
      />
    </section>
  );
});
