"use client";

import { WifiOff, RefreshCw, Music } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto animate-pulse">
          <WifiOff size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest font-black text-purple-400">Offline Mode</span>
          <h1 className="text-3xl font-black font-display tracking-tight text-white">
            You are Offline
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Check your internet connection to stream live tracks, search new artists, or load new playlists.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
            <Music size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Cached Library Available</p>
            <p className="text-[10px] text-zinc-500">Your previously loaded tracks & liked songs remain accessible.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-550 text-white text-xs font-bold hover:bg-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-550/25"
          >
            <RefreshCw size={14} /> Retry Connection
          </button>

          <Link
            href="/library"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Music size={14} /> Open My Library
          </Link>
        </div>
      </div>
    </main>
  );
}
