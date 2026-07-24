"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { useAuth } from "../../src/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Bell,
  Globe,
  HardDrive,
  Lock,
  User,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <div
    onClick={() => onChange(!checked)}
    className="w-12 h-10 flex items-center justify-center cursor-pointer active:scale-95 transition shrink-0"
  >
    <div
      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${checked ? "bg-purple-550" : "bg-zinc-800"}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-md ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </div>
  </div>
);

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
  const [crossfade, setCrossfade] = useState(5);
  const [equalizer, setEqualizer] = useState("flat");
  const [autoplay, setAutoplay] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (user?.uid) {
      const storedTheme = localStorage.getItem(`profile-theme-${user.uid}`);
      if (storedTheme) setTimeout(() => setTheme(storedTheme), 0);
    }
  }, [user]);

  const saveSettings = () => {
    if (user?.uid) {
      localStorage.setItem(`profile-theme-${user.uid}`, theme);
    }
    setSavedMsg("Settings saved successfully!");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const clearCache = () => {
    if (confirm("Are you sure you want to clear cached track responses and thumbnails?")) {
      setCacheSize("0 Bytes");
      setSavedMsg("Cache cleared successfully!");
      setTimeout(() => setSavedMsg(""), 2500);
    }
  };

  const sectionCardStyle = "p-5 rounded-[22px] bg-white/[0.015] border border-white/[0.04] space-y-5 shadow-lg text-left";
  const labelStyle = "text-xs font-bold text-zinc-200 block";
  const descStyle = "text-[10px] text-zinc-555 block font-medium mt-0.5";
  const selectStyle = "bg-[#0c0c0e]/95 border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-purple-550 transition-colors";

  return (
    <ProtectedRoute>
      <main className="max-w-3xl mx-auto space-y-8 select-none pb-36">
        
        {/* Save confirmation toast */}
        <AnimatePresence>
          {savedMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-purple-600 border border-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
            >
              <CheckCircle size={13} /> {savedMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Page Header */}
        <div className="relative px-4 md:px-10 pt-6 md:pt-10 pb-4 overflow-hidden text-left flex items-center justify-between">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-[-10%] w-[500px] h-[300px] rounded-full bg-purple-900/[0.06] blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">
              Workspace Settings
            </p>
            <h1 className="font-display text-[44px] sm:text-[60px] font-black leading-[0.92] tracking-tighter text-white select-none">
              Settings.
            </h1>
            <p className="text-[12px] text-zinc-550 font-semibold mt-2">
              Configure playback, downloads, system notifications, and privacy preferences.
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <div className="px-4 md:px-10 space-y-6">
          
          {/* Category: Account Details */}
          <section className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.04] pb-3">
              <User size={13} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-550 select-none">
                Account
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-zinc-400">
              <div className="space-y-1">
                <span className="text-zinc-600 text-[9px] uppercase tracking-wider block font-bold">Email Address</span>
                <span className="text-zinc-250 font-medium">{user?.email || "Unknown"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-600 text-[9px] uppercase tracking-wider block font-bold">User Identifier (UID)</span>
                <span className="font-mono text-[10px] text-zinc-350 truncate block max-w-xs">{user?.uid || "N/A"}</span>
              </div>
            </div>
          </section>

          {/* Category: Appearance */}
          <section className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.04] pb-3">
              <Smartphone size={13} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-550 select-none">
                Appearance
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className={labelStyle}>Workspace Skin Style</span>
                <span className={descStyle}>Change the background style of your desktop player</span>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className={selectStyle}
              >
                <option value="glass">Premium Glass</option>
                <option value="dark">Vibrant Dark</option>
                <option value="amoled">Amoled Black</option>
              </select>
            </div>
          </section>

          {/* Category: Playback & Streaming Quality */}
          <section className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.04] pb-3">
              <Volume2 size={13} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-550 select-none">
                Audio &amp; Streaming
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={labelStyle}>Streaming Quality</span>
                  <span className={descStyle}>Select streaming speed and quality limit</span>
                </div>
                <select
                  value={streamQuality}
                  onChange={(e) => setStreamQuality(e.target.value)}
                  className={selectStyle}
                >
                  <option value="auto">Auto (Recommended)</option>
                  <option value="high">High Quality (256kbps)</option>
                  <option value="normal">Normal Quality (128kbps)</option>
                  <option value="low">Data Saver (64kbps)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className={labelStyle}>Download Audio Quality</span>
                  <span className={descStyle}>Audio resolution format for cached items</span>
                </div>
                <select
                  value={audioQuality}
                  onChange={(e) => setAudioQuality(e.target.value)}
                  className={selectStyle}
                >
                  <option value="ultra">Ultra Fidelity (320kbps)</option>
                  <option value="high">High Quality (256kbps)</option>
                  <option value="normal">Standard (128kbps)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className={labelStyle}>Audio Equalizer Preset</span>
                  <span className={descStyle}>Configure frequencies response curve</span>
                </div>
                <select
                  value={equalizer}
                  onChange={(e) => setEqualizer(e.target.value)}
                  className={selectStyle}
                >
                  <option value="flat">Flat / Normal</option>
                  <option value="bass">Bass Booster</option>
                  <option value="acoustic">Acoustic</option>
                  <option value="electronic">Electronic</option>
                  <option value="classical">Classical</option>
                  <option value="pop">Pop</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className={labelStyle}>Crossfade Duration</span>
                  <span className={descStyle}>Transition overlaps between playing tracks: {crossfade} seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={crossfade}
                    onChange={(e) => setCrossfade(Number(e.target.value))}
                    className="w-24 h-1 bg-zinc-850 outline-none rounded-full cursor-pointer appearance-none accent-purple-550"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className={labelStyle}>Autoplay Similar Content</span>
                  <span className={descStyle}>Keep playing similar tracks when queue reaches the end</span>
                </div>
                <ToggleSwitch checked={autoplay} onChange={setAutoplay} />
              </div>

            </div>
          </section>

          {/* Category: Notifications */}
          <section className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.04] pb-3">
              <Bell size={13} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-550 select-none">
                Notifications
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={labelStyle}>New Music Alerts</span>
                  <span className={descStyle}>Notify when artists you follow release singles</span>
                </div>
                <ToggleSwitch checked={notifyNew} onChange={setNotifyNew} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className={labelStyle}>Collaborative Playlist Updates</span>
                  <span className={descStyle}>Notify when songs are added by collaborators</span>
                </div>
                <ToggleSwitch checked={notifyCollab} onChange={setNotifyCollab} />
              </div>
            </div>
          </section>

          {/* Category: System Languages */}
          <section className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.04] pb-3">
              <Globe size={13} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-550 select-none">
                Localizations
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className={labelStyle}>App Language</span>
                <span className={descStyle}>System display text language</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={selectStyle}
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>
          </section>

          {/* Category: Local Storage & Caching */}
          <section className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.04] pb-3">
              <HardDrive size={13} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-550 select-none">
                Storage &amp; Cache
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={labelStyle}>Cached Memory Size</span>
                  <span className={descStyle}>
                    Space taken by saved items on disk:{" "}
                    <span className="font-bold text-purple-450 font-mono">{cacheSize}</span>
                  </span>
                </div>
                <button
                  onClick={clearCache}
                  className="px-4 py-2 border border-red-500/10 hover:border-red-500/35 bg-red-650/10 hover:bg-red-650/20 text-red-400 hover:text-red-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Trash2 size={12} /> Clear Cache
                </button>
              </div>
            </div>
          </section>

          {/* Category: Account Privacy */}
          <section className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.04] pb-3">
              <Lock size={13} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-550 select-none">
                Privacy &amp; Security
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className={labelStyle}>Private Session</span>
                <span className={descStyle}>Hide current music listening activity from followers</span>
              </div>
              <ToggleSwitch checked={isPrivate} onChange={setIsPrivate} />
            </div>
          </section>

          {/* Save Triggers Row */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/help"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Need Help? Visit Help & Support Center →
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-zinc-350 hover:text-white font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-150 text-black font-black text-xs transition active:scale-95 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>

        </div>
      </main>
    </ProtectedRoute>
  );
}
