"use client";

import { useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { GeneratedPlaylist } from "@/lib/ai/playlist/playlist-generator";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  Sparkles,
  X,
  Play,
  Shuffle,
  BookmarkPlus,
  RotateCw,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AIPlaylistGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INSPIRATION_CHIPS = [
  { label: "🌧️ Rainy Lo-Fi", prompt: "Rainy day lo-fi beats to relax and think" },
  { label: "⚡ Gym Pump", prompt: "High energy aggressive workout motivation" },
  { label: "🌃 Night Drive", prompt: "Late night city highway synthwave drive" },
  { label: "🎯 Deep Coding", prompt: "Cyberpunk instrumental focus flow for coding" },
  { label: "☕ Cozy Chai", prompt: "Warm acoustic Sunday morning with chai" },
  { label: "🎉 Party Bangers", prompt: "Upbeat global dance and pop party anthems" },
];

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
];

function formatDur(s: number = 0) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function AIPlaylistGeneratorModal({
  isOpen,
  onClose,
}: AIPlaylistGeneratorModalProps) {
  const [prompt, setPrompt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<GeneratedPlaylist | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const { setTrack, setQueue, addPlaylist, addSongToPlaylist } = usePlayerStore(
    useShallow((s) => ({
      setTrack: s.setTrack,
      setQueue: s.setQueue,
      addPlaylist: s.addPlaylist,
      addSongToPlaylist: s.addSongToPlaylist,
    }))
  );

  const handleGenerate = async (targetPrompt = prompt) => {
    if (!targetPrompt.trim()) return;
    setLoading(true);
    setLoadingStep(0);
    setResult(null);
    setIsSaved(false);

    // Dynamic progress step sequence
    const t1 = setTimeout(() => setLoadingStep(1), 600);
    const t2 = setTimeout(() => setLoadingStep(2), 1600);
    const t3 = setTimeout(() => setLoadingStep(3), 2600);

    try {
      const res = await fetch("/api/ai/playlist-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: targetPrompt.trim(),
          durationMinutes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.playlist && data.playlist.tracks) {
          setResult(data.playlist);
        }
      }
    } catch (err) {
      console.error("AI playlist generation error:", err);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setLoading(false);
    }
  };

  const handlePlayAll = (shuffle = false) => {
    if (!result || result.tracks.length === 0) return;
    let list = [...result.tracks];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    const first = list[0];
    setQueue(list);
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
    onClose();
  };

  const handleSavePlaylist = async () => {
    if (!result || result.tracks.length === 0 || isSaved) return;
    await addPlaylist(result.title);
    const store = usePlayerStore.getState();
    const created = store.playlists[store.playlists.length - 1];
    if (created) {
      for (const track of result.tracks) {
        await addSongToPlaylist(created.id, track);
      }
    }
    setIsSaved(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-[#0e0e14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">AI Playlist Generator</h2>
              <p className="text-[11px] text-zinc-400">
                Craft complete playable playlists from natural descriptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
          {!result ? (
            <>
              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">
                  Describe your ideal playlist vibe
                </label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Late night rainy drive through Tokyo with warm synthwave and slow beats..."
                    rows={3}
                    className="w-full p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-purple-500/50 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Inspiration Chips */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Quick Inspiration
                </span>
                <div className="flex flex-wrap gap-2">
                  {INSPIRATION_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => {
                        setPrompt(chip.prompt);
                        handleGenerate(chip.prompt);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] hover:bg-purple-600/20 hover:text-purple-300 border border-white/5 hover:border-purple-500/30 text-zinc-300 transition active:scale-95"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Target Length
                </span>
                <div className="flex items-center gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDurationMinutes(opt.value)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold transition active:scale-95 border",
                        durationMinutes === opt.value
                          ? "bg-purple-600/20 text-purple-300 border-purple-500/40"
                          : "bg-white/[0.03] text-zinc-400 border-white/5 hover:bg-white/[0.06]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading State Animation */}
              {loading && (
                <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-purple-300">
                      {loadingStep === 0 && "Parsing prompt mood & acoustic profile..."}
                      {loadingStep === 1 && "Querying real music catalog candidates..."}
                      {loadingStep === 2 && "Verifying playable audio streams..."}
                      {loadingStep === 3 && "Curating flow and track sequencing..."}
                    </p>
                    <p className="text-[10px] text-zinc-500">Real songs only · No placeholders</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Result View */
            <div className="space-y-5">
              {/* Hero Result Banner */}
              <div className="flex gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-zinc-900 border border-purple-500/20">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10 shadow-lg">
                  <SafeImage
                    src={result.coverImage}
                    title={result.title}
                    artist="AI Playlist"
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                      Generated Set
                    </span>
                    <span className="text-[10px] text-zinc-500">·</span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {result.tracks.length} tracks
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white truncate">{result.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{result.description}</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayAll(false)}
                    className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition active:scale-95 shadow-md cursor-pointer"
                  >
                    <Play size={13} fill="black" />
                    <span>Play All</span>
                  </button>
                  <button
                    onClick={() => handlePlayAll(true)}
                    className="px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <Shuffle size={13} />
                    <span>Shuffle</span>
                  </button>
                  <button
                    onClick={handleSavePlaylist}
                    className={cn(
                      "px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer",
                      isSaved
                        ? "bg-emerald-600 text-white"
                        : "bg-purple-600 hover:bg-purple-500 text-white"
                    )}
                  >
                    {isSaved ? <Check size={13} /> : <BookmarkPlus size={13} />}
                    <span>{isSaved ? "Saved to Library" : "Save Playlist"}</span>
                  </button>
                </div>

                <button
                  onClick={() => handleGenerate(prompt)}
                  disabled={loading}
                  className="px-3 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCw size={12} className={cn(loading && "animate-spin")} />
                  <span>Regenerate</span>
                </button>
              </div>

              {/* Verified Tracks List */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  <span>Tracklist</span>
                  <span>Duration</span>
                </div>
                <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {result.tracks.map((track, idx) => (
                    <div
                      key={`${track.videoId}-${idx}`}
                      onClick={() => {
                        setQueue(result.tracks);
                        setTrack(track.videoId, track.title, track.artist, track.thumbnail, idx);
                        onClose();
                      }}
                      className="p-2 rounded-xl flex items-center justify-between gap-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.03] hover:border-white/10 text-zinc-300 hover:text-white transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-4 text-[11px] font-mono text-zinc-600 group-hover:text-purple-400 text-center">
                          {idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/5">
                          <SafeImage
                            src={track.thumbnail}
                            videoId={track.videoId}
                            title={track.title}
                            artist={track.artist}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                          <p className="text-[10px] text-zinc-400 truncate">{track.artist}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                        {formatDur(track.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        {!result && (
          <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleGenerate(prompt)}
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles size={14} className={cn(loading && "animate-spin")} />
              <span>{loading ? "Generating..." : "Generate Playlist"}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
