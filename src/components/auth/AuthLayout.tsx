"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Disc } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex items-center justify-center px-6">

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-blue-950/15" />

      {/* Purple Glow */}
      <div className="absolute -top-40 -left-40 w-[450px] h-[450px] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      {/* Blue Glow */}
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-blue-500/10 blur-[120px]" />

      {/* Logo */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-white"
      >
        <div className="w-9 h-9 rounded-xl bg-purple-550 flex items-center justify-center text-white">
          <Disc size={18} className="animate-spin" style={{ animationDuration: "8s" }} />
        </div>
        <span className="font-display text-lg font-black tracking-tighter">
          MusicFlow.
        </span>
      </Link>

      {/* Glass Card */}
      <div
        className="
          relative
          z-10
          w-full
          max-w-md
          rounded-[32px]
          bg-white/[0.015]
          backdrop-blur-2xl
          border
          border-white/[0.04]
          shadow-[0_24px_80px_rgba(0,0,0,0.5)]
          p-8
          text-left
        "
      >
        <h1 className="font-display text-3xl font-black text-white leading-tight">
          {title}
        </h1>

        <p className="text-zinc-500 text-xs font-semibold mt-2.5">
          {subtitle}
        </p>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}