"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Shield,
  User as UserIcon,
  LogOut,
  Sparkles,
  Bell
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import { useAuth } from "../../src/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { SafeImage } from "@/components/ui/SafeImage";
import { AIDJModal } from "@/components/ui/AIDJModal";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [djOpen, setDjOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    await signOut(auth);
    setOpen(false);
    router.push("/login");
  };

  const getBreadcrumb = () => {
    if (pathname === "/") return "Discover";
    if (pathname === "/explore") return "Explore";
    if (pathname === "/search") return "Search";
    if (pathname === "/library") return "My Library";
    if (pathname === "/liked") return "Liked Songs";
    if (pathname === "/playlists") return "Playlists";
    if (pathname === "/recently-played") return "Recently Played";
    if (pathname === "/queue") return "Queue";
    if (pathname === "/settings") return "Settings";
    if (pathname === "/profile") return "My Profile";
    if (pathname.startsWith("/playlists/")) return "Playlist";
    if (pathname.startsWith("/album/")) return "Album";
    if (pathname.startsWith("/artist/")) return "Artist";
    return "MusicFlow";
  };

  return (
    <header className="sticky top-0 md:top-4 z-30 mx-0 md:mx-6 h-14 rounded-none md:rounded-2xl bg-[#07070a]/75 md:bg-zinc-950/40 backdrop-blur-3xl border-t-0 border-x-0 md:border border-b border-white/[0.04] md:border-white/[0.06] shadow-none md:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between px-4 md:px-5 shrink-0 transition-all duration-300">
      {/* Navigation Arrows & Page Title */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => router.back()}
            className="w-7 h-7 rounded-full bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 flex items-center justify-center border border-white/[0.05] hover:border-white/[0.08] transition text-zinc-400 hover:text-white"
            aria-label="Go back"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => router.forward()}
            className="w-7 h-7 rounded-full bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 flex items-center justify-center border border-white/[0.05] hover:border-white/[0.08] transition text-zinc-400 hover:text-white"
            aria-label="Go forward"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Dynamic Title / Breadcrumb */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={getBreadcrumb()}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-[12px] font-bold text-zinc-300 uppercase tracking-[0.16em] select-none"
          >
            {getBreadcrumb()}
          </motion.h2>
        </AnimatePresence>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {/* Search shortcut pill */}
        <Link href="/search" className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[10px] text-zinc-500 font-bold hover:bg-white/[0.04] transition">
          <span>Search...</span>
          <kbd className="bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded text-[8px] font-mono font-normal select-none">/</kbd>
        </Link>

        {/* AI DJ Assistant */}
        {user && (
          <button
            onClick={() => setDjOpen(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-650/10 to-pink-650/10 border border-purple-500/20 hover:border-purple-500/40 flex items-center justify-center text-purple-400 hover:text-white transition cursor-pointer group shadow-[0_2px_10px_rgba(168,85,247,0.1)] active:scale-90"
            title="Open AI DJ"
          >
            <Sparkles size={13} className="text-purple-400 group-hover:scale-110 transition animate-pulse" />
          </button>
        )}

        {/* Notifications Bell */}
        {user && (
          <button className="relative w-8 h-8 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-zinc-450 hover:text-white transition cursor-pointer">
            <Bell size={13} />
            <span className="absolute top-2.5 right-2.5 w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
          </button>
        )}

        {/* VIP Promo tag */}
        {user && (
          <div className="hidden md:flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-400 select-none">
            <Sparkles size={9} className="text-purple-400" />
            Premium
          </div>
        )}

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
        ) : user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 hover:bg-white/[0.04] rounded-full p-1 transition border border-transparent hover:border-white/[0.05] active:scale-95"
            >
              <SafeImage
                src={
                  user.photoURL ||
                  `https://ui-avatars.com/api/?background=7c3aed&color=fff&name=${encodeURIComponent(
                    user.displayName || user.email || "User"
                  )}&size=128`
                }
                alt={user.displayName || "User Avatar"}
                className="w-6.5 h-6.5 rounded-full object-cover shadow-md"
                fallbackType="artist"
              />
              <span className="hidden sm:inline text-xs font-semibold text-zinc-300 pr-2">
                {user.displayName || "User"}
              </span>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.08] overflow-hidden shadow-2xl p-1.5 space-y-0.5"
                >
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.04] transition"
                  >
                    <UserIcon size={14} className="text-zinc-400" />
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.04] transition"
                  >
                    <Settings size={14} className="text-zinc-400" />
                    Settings
                  </Link>

                  {/* Admin link for management */}
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-purple-300 hover:text-purple-100 hover:bg-purple-500/10 transition"
                  >
                    <Shield size={14} className="text-purple-400" />
                    Admin Panel
                  </Link>

                  <div className="h-px bg-white/[0.05] my-1 mx-1" />

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-red-400 hover:text-red-200 hover:bg-red-500/10 transition text-left"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-1.5 text-xs rounded-full bg-white text-black font-bold hover:bg-zinc-100 transition shadow-md shadow-white/5"
          >
            Login
          </Link>
        )}
      </div>
      <AIDJModal
        isOpen={djOpen}
        onClose={() => setDjOpen(false)}
      />

    </header>
  );
}
