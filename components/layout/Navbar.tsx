"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  User as UserIcon,
  LogOut,
  Sparkles,
  Bell,
  Search,
  Users,
  X,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import { useAuth } from "../../src/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { SafeImage } from "@/components/ui/SafeImage";
import dynamic from "next/dynamic";

const AIDJModal = dynamic(
  () => import("@/components/ui/AIDJModal").then((m) => m.AIDJModal),
  { ssr: false }
);
const AIAssistantModal = dynamic(
  () => import("@/components/ai/AIAssistantModal").then((m) => m.AIAssistantModal),
  { ssr: false }
);
const NotificationCenter = dynamic(
  () => import("@/components/ui/NotificationCenter").then((m) => m.NotificationCenter),
  { ssr: false }
);
const FriendActivity = dynamic(
  () => import("@/components/social/FriendActivity").then((m) => m.FriendActivity),
  { ssr: false }
);

const PAGE_LABELS: Record<string, string> = {
  "/":                 "Home",
  "/explore":          "Explore",
  "/search":           "Search",
  "/library":          "Library",
  "/liked":            "Liked Songs",
  "/playlists":        "Playlists",
  "/recently-played":  "History",
  "/queue":            "Queue",
  "/settings":         "Settings",
  "/profile":          "Profile",
  "/genres":           "Genres",
  "/lyrics":           "Lyrics",
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [djOpen, setDjOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [friendActivityOpen, setFriendActivityOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    await signOut(auth);
    setAvatarOpen(false);
    router.push("/login");
  };

  const getPageLabel = () => {
    if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
    if (pathname.startsWith("/playlists/")) return "Playlist";
    if (pathname.startsWith("/album/")) return "Album";
    if (pathname.startsWith("/artist/")) return "Artist";
    return "MusicFlow";
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-5 shrink-0 bg-[#09090e] border-b border-white/[0.06]"
        style={{
          height: "var(--mf-nav-h)",
        }}
      >
        {/* Left — Nav arrows + Page title */}
        <div className="flex items-center gap-3">
          {/* Back / Forward */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => router.back()}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "var(--mf-text-muted)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.color = "var(--mf-text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLElement).style.color = "var(--mf-text-muted)";
              }}
              aria-label="Go back"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => router.forward()}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "var(--mf-text-muted)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.color = "var(--mf-text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLElement).style.color = "var(--mf-text-muted)";
              }}
              aria-label="Go forward"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Animated Page Label */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={getPageLabel()}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="text-[13px] font-bold select-none"
              style={{ color: "var(--mf-text-primary)", letterSpacing: "-0.01em" }}
            >
              {getPageLabel()}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Right — Actions cluster */}
        <div className="flex items-center gap-2">
          {/* Quick Search input in top bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (navSearch.trim()) {
                router.push(`/search?q=${encodeURIComponent(navSearch.trim())}`);
              }
            }}
            className="hidden sm:flex items-center relative w-48 md:w-64"
          >
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search music..."
              className="w-full h-8 pl-8 pr-7 rounded-full text-xs font-medium text-white placeholder:text-zinc-500 bg-white/[0.04] border border-white/[0.08] focus:border-purple-550 focus:bg-[#121216] outline-none transition-colors"
            />
            {navSearch && (
              <button
                type="button"
                onClick={() => setNavSearch("")}
                className="absolute right-2 text-zinc-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </form>

          {/* AI Assistant button */}
          {user && (
            <button
              onClick={() => setAssistantOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 active:scale-95"
              style={{
                background: "rgba(124,58,237,0.10)",
                border: "1px solid rgba(124,58,237,0.22)",
                color: "var(--mf-accent-light)",
                fontSize: "11px",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.18)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.40)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.10)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.22)";
              }}
              title="AI Music Assistant"
            >
              <Sparkles size={11} />
              <span>AI</span>
            </button>
          )}

          {/* AI DJ button */}
          {user && (
            <button
              onClick={() => setDjOpen(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.18)",
                color: "var(--mf-accent-light)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.16)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.08)";
              }}
              title="AI DJ"
            >
              <Sparkles size={13} />
            </button>
          )}

          {/* Notifications */}
          {user && (
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 relative"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "var(--mf-text-muted)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.color = "var(--mf-text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLElement).style.color = "var(--mf-text-muted)";
              }}
            >
              <Bell size={14} />
              {/* Notification dot */}
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--mf-accent-light)" }}
              />
            </button>
          )}

          {/* Friend Activity drawer toggle */}
          <button
            onClick={() => setFriendActivityOpen(!friendActivityOpen)}
            aria-label="Friend Activity"
            title="Friend Activity"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90"
            style={{
              background: friendActivityOpen ? "rgba(124,58,237,0.14)" : "rgba(255,255,255,0.03)",
              border: "1px solid " + (friendActivityOpen ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)"),
              color: friendActivityOpen ? "var(--mf-accent-light)" : "var(--mf-text-muted)",
            }}
          >
            <Users size={14} />
          </button>

          {/* Avatar / Login */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="w-8 h-8 rounded-xl overflow-hidden transition-all duration-150 active:scale-90"
                style={{ border: "1px solid rgba(255,255,255,0.10)" }}
                aria-label="Account menu"
              >
                {user.photoURL ? (
                  <SafeImage
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-full h-full object-cover"
                    fallbackType="artist"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: "var(--mf-accent)", color: "#fff" }}
                  >
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {avatarOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 6 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-10 z-50 min-w-[180px] rounded-xl overflow-hidden"
                    style={{
                      background: "var(--mf-bg-elevated)",
                      border: "1px solid var(--mf-border)",
                      boxShadow: "var(--mf-shadow-lg)",
                    }}
                  >
                    {/* User info */}
                    <div
                      className="px-4 py-3"
                      style={{ borderBottom: "1px solid var(--mf-border-soft)" }}
                    >
                      <p
                        className="text-[12px] font-bold truncate"
                        style={{ color: "var(--mf-text-primary)" }}
                      >
                        {user.displayName || "MusicFlow User"}
                      </p>
                      <p
                        className="text-[10px] truncate mt-0.5"
                        style={{ color: "var(--mf-text-muted)" }}
                      >
                        {user.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    {[
                      { href: "/profile", icon: UserIcon, label: "My Profile" },
                      { href: "/settings", icon: Settings, label: "Settings" },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium transition-colors duration-150"
                        style={{ color: "var(--mf-text-secondary)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                          (e.currentTarget as HTMLElement).style.color = "var(--mf-text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "";
                          (e.currentTarget as HTMLElement).style.color = "var(--mf-text-secondary)";
                        }}
                      >
                        <Icon size={13} />
                        {label}
                      </Link>
                    ))}

                    <div style={{ borderTop: "1px solid var(--mf-border-soft)" }}>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium transition-colors duration-150"
                        style={{ color: "var(--mf-danger)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "";
                        }}
                      >
                        <LogOut size={13} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150"
              style={{
                background: "var(--mf-accent)",
                color: "#fff",
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Modals */}
      {assistantOpen && (
        <AIAssistantModal isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
      )}
      {djOpen && (
        <AIDJModal isOpen={djOpen} onClose={() => setDjOpen(false)} />
      )}
      {notificationsOpen && (
        <NotificationCenter isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      )}
      <FriendActivity
        isOpen={friendActivityOpen}
        onClose={() => setFriendActivityOpen(false)}
      />
    </>
  );
}
