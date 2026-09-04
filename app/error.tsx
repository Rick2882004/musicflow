"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("MusicFlow Global Error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[#121216] border border-white/[0.06] space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black font-display tracking-tight text-white">
            Something went wrong
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            MusicFlow encountered an unexpected issue while tuning into this page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-550 text-white text-xs font-bold hover:bg-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-550/25"
          >
            <RefreshCw size={14} /> Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={14} /> Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
