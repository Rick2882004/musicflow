"use client";

import { ReactNode } from "react";
import Link from "next/link";

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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-blue-950" />

      {/* Purple Glow */}
      <div className="absolute -top-40 -left-40 w-[450px] h-[450px] rounded-full bg-fuchsia-600/20 blur-[120px]" />

      {/* Blue Glow */}
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-blue-500/20 blur-[120px]" />

      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/noise.png')]" />

      {/* Logo */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-3"
      >
        <img
          src="/logo.png"
          className="w-12 h-12"
          alt="MusicFlow"
        />

        <span className="text-2xl font-black tracking-tight">
          MusicFlow
        </span>
      </Link>

      {/* Card */}

      <div
        className="
        relative
        z-10
        w-full
        max-w-md
        rounded-[32px]
        bg-white/[0.05]
        backdrop-blur-3xl
        border
        border-white/10
        shadow-[0_0_80px_rgba(124,58,237,.2)]
        p-8
      "
      >
        <h1 className="text-4xl font-black">
          {title}
        </h1>

        <p className="text-zinc-400 mt-2">
          {subtitle}
        </p>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}