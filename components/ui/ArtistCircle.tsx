"use client";

import { memo } from "react";
import Link from "next/link";
import { SafeImage } from "./SafeImage";
import { Play } from "lucide-react";

interface ArtistCircleProps {
  name: string;
  image: string;
  monthlyListeners?: string;
  subtitle?: string;
}

export const ArtistCircle = memo(function ArtistCircle({
  name,
  image,
  monthlyListeners,
  subtitle = "Artist",
}: ArtistCircleProps) {
  return (
    <Link
      href={`/artist/${encodeURIComponent(name)}`}
      className="group flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/[0.03] transition-all duration-200 cursor-pointer select-none text-center w-[130px] sm:w-[150px] shrink-0"
    >
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-zinc-900 border border-white/[0.06] shadow-md transition-transform duration-300 group-hover:scale-105">
        <SafeImage
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          fallbackType="artist"
        />
        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
            <Play size={14} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      </div>

      <div className="w-full">
        <p className="text-[13px] font-bold text-zinc-100 group-hover:text-white truncate transition-colors">
          {name}
        </p>
        <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
          {monthlyListeners ? `${monthlyListeners} listeners` : subtitle}
        </p>
      </div>
    </Link>
  );
});
