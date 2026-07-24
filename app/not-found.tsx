import Link from "next/link";
import { Disc, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto animate-spin" style={{ animationDuration: "12s" }}>
          <Disc size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest font-black text-purple-400">404 Error</span>
          <h1 className="text-3xl font-black font-display tracking-tight text-white">
            Track Not Found
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The page or audio stream you are looking for has been moved, renamed, or doesn&apos;t exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-550 text-white text-xs font-bold hover:bg-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-550/25"
          >
            <Home size={14} /> Back to Home
          </Link>

          <Link
            href="/search"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search size={14} /> Search Tracks
          </Link>
        </div>
      </div>
    </main>
  );
}
