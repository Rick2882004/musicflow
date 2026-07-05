"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Settings, Shield, User as UserIcon, LogOut, Sparkles } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import { useAuth } from "../../src/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
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

  // Determine breadcrumb based on path
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
    if (pathname.startsWith("/playlists/")) return "Playlist View";
    if (pathname.startsWith("/album/")) return "Album View";
    if (pathname.startsWith("/artist/")) return "Artist Profile";
    return "MusicFlow";
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full glass-header-panel border-b border-white/5 px-6 flex items-center justify-between shrink-0">
      {/* Navigation Arrows & Page Title */}
      <div className="flex items-center gap-5">
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center border border-white/5 hover:border-white/10 transition text-zinc-300 hover:text-white"
            aria-label="Go back"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => router.forward()}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center border border-white/5 hover:border-white/10 transition text-zinc-300 hover:text-white"
            aria-label="Go forward"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Dynamic Title / Breadcrumb */}
        <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent select-none">
          {getBreadcrumb()}
        </h2>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* VIP Promo tag */}
        {user && (
          <div className="hidden lg:flex items-center gap-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-[11px] font-semibold text-purple-300">
            <Sparkles size={11} className="text-purple-400 animate-pulse" />
            Premium Account
          </div>
        )}

        {loading ? (
          <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
        ) : user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 hover:bg-white/5 rounded-full p-1 transition border border-transparent hover:border-white/5"
            >
              <img
                src={
                  user.photoURL ||
                  `https://ui-avatars.com/api/?background=7c3aed&color=fff&name=${
                    user.displayName || user.email
                  }`
                }
                alt={user.displayName || "User Avatar"}
                className="w-8 h-8 rounded-full object-cover shadow-md"
              />
              <span className="hidden sm:inline text-xs font-semibold text-zinc-300 pr-2">
                {user.displayName || "User"}
              </span>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl p-1.5 space-y-0.5"
                >
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <UserIcon size={14} className="text-zinc-400" />
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <Settings size={14} className="text-zinc-400" />
                    Settings
                  </Link>

                  {/* Admin link for management */}
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-purple-300 hover:text-purple-100 hover:bg-purple-500/10 transition"
                  >
                    <Shield size={14} className="text-purple-400" />
                    Admin Panel
                  </Link>

                  <div className="h-px bg-white/5 my-1" />

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-red-400 hover:text-red-200 hover:bg-red-500/10 transition"
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
            className="px-5 py-2 text-xs rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 font-bold hover:scale-105 shadow-md shadow-purple-500/20 active:scale-95 transition"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
