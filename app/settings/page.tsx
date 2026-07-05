"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { useAuth } from "../../src/context/AuthContext";
import { usePlayerStore } from "@/store/player-store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Volume2,
  Bell,
  Globe,
  HardDrive,
  Lock,
  User,
  Trash2,
  CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [theme, setTheme] = useState("glass");
  const [notifyNew, setNotifyNew] = useState(true);
  const [notifyCollab, setNotifyCollab] = useState(true);
  const [language, setLanguage] = useState("en");
  const [audioQuality, setAudioQuality] = useState("high");
  const [streamQuality, setStreamQuality] = useState("auto");
  const [cacheSize, setCacheSize] = useState("142 MB");
  const [isPrivate, setIsPrivate] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (user?.uid) {
      const storedTheme = localStorage.getItem(`profile-theme-${user.uid}`);
      if (storedTheme) setTheme(storedTheme);
    }
  }, [user]);

  const saveSettings = () => {
    if (user?.uid) {
      localStorage.setItem(`profile-theme-${user.uid}`, theme);
    }
    setSavedMsg("Settings saved successfully!");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const clearCache = () => {
    if (confirm("Are you sure you want to clear cached track responses and thumbnails?")) {
      setCacheSize("0 Bytes");
      alert("Cache cleared successfully!");
    }
  };

  return (
    <ProtectedRoute>
      <main className="max-w-3xl mx-auto space-y-8 select-none pb-12">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white select-none">Settings</h1>
          <p className="text-xs text-zinc-500">Configure playback quality, notifications, and profile privacy</p>
        </div>

        {/* Saved confirmation feedback */}
        <AnimatePresence>
          {savedMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle size={16} />
              {savedMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category: Account Details */}
        <section className="glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <User size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Account Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-zinc-500 block">Email Address</span>
              <span className="font-semibold text-zinc-200">{user?.email || "Unknown"}</span>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-500 block">User Identifier (UID)</span>
              <span className="font-mono text-[10px] text-zinc-400 truncate block max-w-xs">{user?.uid || "N/A"}</span>
            </div>
          </div>
        </section>

        {/* Category: Playback & Streaming Quality */}
        <section className="glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <Volume2 size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Audio & Streaming</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Streaming Quality</span>
                <span className="text-[10px] text-zinc-500">Select streaming speed preference</span>
              </div>
              <select
                value={streamQuality}
                onChange={(e) => setStreamQuality(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="auto">Auto (Recommended)</option>
                <option value="high">High Quality (256kbps)</option>
                <option value="normal">Normal Quality (128kbps)</option>
                <option value="low">Data Saver (64kbps)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Download Audio Quality</span>
                <span className="text-[10px] text-zinc-500">Audio resolution for offline availability</span>
              </div>
              <select
                value={audioQuality}
                onChange={(e) => setAudioQuality(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="ultra">Ultra Fidelity (320kbps)</option>
                <option value="high">High Quality (256kbps)</option>
                <option value="normal">Standard (128kbps)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Category: Notifications */}
        <section className="glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <Bell size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Notifications</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">New Music Alerts</span>
                <span className="text-[10px] text-zinc-500">Notify when artists you follow release singles</span>
              </div>
              <input
                type="checkbox"
                checked={notifyNew}
                onChange={(e) => setNotifyNew(e.target.checked)}
                className="accent-purple-600 rounded scale-110 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Collaborative Playlist Updates</span>
                <span className="text-[10px] text-zinc-500">Notify when songs are added by collaborators</span>
              </div>
              <input
                type="checkbox"
                checked={notifyCollab}
                onChange={(e) => setNotifyCollab(e.target.checked)}
                className="accent-purple-600 rounded scale-110 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Category: System Languages */}
        <section className="glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <Globe size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Localizations</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">App Language</span>
              <span className="text-[10px] text-zinc-500">System display text language</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="en">English (US)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </section>

        {/* Category: Local Storage & Caching */}
        <section className="glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <HardDrive size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Storage & Cache</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Cached Memory Size</span>
                <span className="text-[10px] text-zinc-500">Space taken by saved items on disk: <span className="font-bold text-purple-400">{cacheSize}</span></span>
              </div>
              <button
                onClick={clearCache}
                className="px-4 py-2 border border-red-500/20 hover:border-red-500/40 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 size={12} />
                Clear Cache
              </button>
            </div>
          </div>
        </section>

        {/* Category: Account Privacy */}
        <section className="glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <Lock size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Privacy & Security</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Private Session</span>
              <span className="text-[10px] text-zinc-500">Hide current music listening activity from followers</span>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-purple-600 rounded scale-110 cursor-pointer"
            />
          </div>
        </section>

        {/* Save Triggers Row */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-white/5 hover:bg-white/5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition"
          >
            Go Back
          </button>
          <button
            onClick={saveSettings}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-xs hover:scale-105 transition"
          >
            Save Changes
          </button>
        </div>
      </main>
    </ProtectedRoute>
  );
}
