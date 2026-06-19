"use client";

import { Play } from "lucide-react";

type TrackCardProps = {
  title: string;
  artist: string;
  audioUrl: string;
  coverImage?: string | null;
};

export default function TrackCard({
  title,
  artist,
  audioUrl,
  coverImage,
}: TrackCardProps) {
  return (
    <div
      className="
        group
        bg-zinc-900/70
        backdrop-blur
        rounded-2xl
        p-4
        hover:bg-zinc-800
        transition-all
        duration-300
        hover:scale-[1.03]
        cursor-pointer
      "
    >
      <div className="relative">
        <img
          src={
            coverImage ||
            "https://placehold.co/500x500/png"
          }
          alt={title}
          className="
            aspect-square
            w-full
            object-cover
            rounded-xl
          "
        />

        <button
          className="
            absolute
            bottom-3
            right-3
            bg-green-500
            text-black
            p-3
            rounded-full
            opacity-0
            translate-y-2
            group-hover:opacity-100
            group-hover:translate-y-0
            transition-all
          "
        >
          <Play size={20} fill="black" />
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold text-white line-clamp-1">
          {title}
        </h3>

        <p className="text-zinc-400 text-sm line-clamp-1">
          {artist}
        </p>
      </div>
    </div>
  );
}