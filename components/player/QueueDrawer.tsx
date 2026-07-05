"use client";

import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { ArrowUp, ArrowDown, Trash2, X, AlertCircle } from "lucide-react";
import { Track } from "@/types/music";
import { motion, AnimatePresence } from "framer-motion";

export default function QueueDrawer() {
  const {
    queue,
    currentIndex,
    setTrack,
    setQueue,
    toggleQueue,
    reorderQueue,
    clearQueue,
  } = usePlayerStore(useShallow((s) => ({
    queue: s.queue,
    currentIndex: s.currentIndex,
    setTrack: s.setTrack,
    setQueue: s.setQueue,
    toggleQueue: s.toggleQueue,
    reorderQueue: s.reorderQueue,
    clearQueue: s.clearQueue,
  })));

  const handleMoveUp = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index > 0) {
      reorderQueue(index, index - 1);
    }
  };

  const handleMoveDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index < queue.length - 1) {
      reorderQueue(index, index + 1);
    }
  };

  const handleRemoveTrack = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const updatedQueue = queue.filter((_, idx) => idx !== indexToRemove);
    setQueue(updatedQueue);
  };

  return (
    <div className="fixed top-0 right-0 h-screen w-80 bg-zinc-950/95 backdrop-blur-3xl border-l border-white/5 z-[999] p-5 flex flex-col shadow-2xl select-none">
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
        <div>
          <h2 className="text-base font-bold text-white">Play Queue</h2>
          <span className="text-[10px] text-zinc-500 font-semibold">{queue.length} songs loaded</span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="px-2 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-[10px] rounded-lg border border-red-500/10 hover:border-red-500/25 transition"
            >
              Clear
            </button>
          )}
          <button
            onClick={toggleQueue}
            className="text-zinc-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Queue tracks list mapping */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-500">Queue is empty.</p>
          </div>
        ) : (
          <AnimatePresence>
            {queue.map((song: Track, index) => {
              const active = currentIndex === index;
              return (
                <motion.div
                  key={`${song.videoId}-${index}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setTrack(song.videoId, song.title, song.artist, song.thumbnail, index)}
                  className={`p-3 rounded-2xl flex items-center justify-between border cursor-pointer group transition-all duration-200 ${
                    active
                      ? "bg-purple-950/20 border-purple-500/30 text-purple-300 shadow-md shadow-purple-500/5 font-semibold"
                      : "bg-white/[0.01] hover:bg-white/[0.04] border-white/5 hover:border-white/10 text-zinc-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.thumbnail}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate">{song.title}</h4>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                    </div>
                  </div>

                  {/* Actions: Move up/down, remove */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleMoveUp(e, index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 rounded transition text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Move Up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={(e) => handleMoveDown(e, index)}
                      disabled={index === queue.length - 1}
                      className="p-1 hover:bg-white/10 rounded transition text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Move Down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      onClick={(e) => handleRemoveTrack(e, index)}
                      className="p-1 hover:bg-red-500/10 rounded transition text-zinc-500 hover:text-red-400"
                      aria-label="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}