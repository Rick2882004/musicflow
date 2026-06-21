"use client";

import Link from "next/link";

export default function TopNav() {
  return (
    <div className="flex items-center justify-between mb-10">

      <h1 className="text-3xl font-bold text-purple-400">
        MusicFlow
      </h1>

      <div className="flex gap-8">

        <Link href="/">
          Home
        </Link>

        <Link href="/search">
          Search
        </Link>

        <Link href="/library">
          Library
        </Link>

      </div>

      <div>
        ⚙️
      </div>

    </div>
  );
}