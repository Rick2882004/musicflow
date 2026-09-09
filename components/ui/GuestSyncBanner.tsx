"use client";

import { useAuth } from "@/src/context/AuthContext";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function GuestSyncBanner({ message }: { message?: string }) {
  const { user } = useAuth();
  if (user) return null;

  return (
    <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
          <Sparkles size={15} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Local Guest Collection</h4>
          <p className="text-[11px] text-zinc-400">
            {message || "Saved locally on this device. Sign in to sync your library across all devices."}
          </p>
        </div>
      </div>
      <Link
        href="/login"
        className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs shrink-0 self-start sm:self-center hover:bg-zinc-200 transition-colors shadow-sm"
      >
        Sign In
      </Link>
    </div>
  );
}
