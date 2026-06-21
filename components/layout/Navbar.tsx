"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header
      className="
        sticky
        top-0
        z-50
        bg-black/90
        backdrop-blur
        border-b
        border-zinc-800
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
          px-8
          h-20
          flex
          items-center
          justify-between
        "
      >
        <Link
          href="/"
          className="
            text-4xl
            font-bold
            bg-gradient-to-r
            from-purple-400
            to-pink-500
            bg-clip-text
            text-transparent
          "
        >
          MusicFlow
        </Link>

        <nav className="flex gap-10 text-lg">
          <Link href="/">Home</Link>
          <Link href="/search">Search</Link>
          <Link href="/library">Library</Link>
          <Link href="/liked">Liked Songs</Link>
        </nav>

        <button
          className="
            w-12
            h-12
            rounded-full
            bg-zinc-800
          "
        >
          👤
        </button>
      </div>
    </header>
  );
}