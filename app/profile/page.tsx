"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { useAuth } from "../../src/context/AuthContext";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Edit2, Check, User, Mail, Award, Flame, Disc, BarChart, Settings } from "lucide-react";
import { Track } from "@/types/music";

export default function ProfilePage() {
  const { user } = useAuth();
  const { recentSongs } = usePlayerStore(useShallow((s) => ({
    recentSongs: s.recentSongs,
  })));

  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "MusicFlow User");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [themePref, setThemePref] = useState("glass");

  // Load profile details from local storage on mount
  useEffect(() => {
    if (user?.uid) {
      const storedBio = localStorage.getItem(`profile-bio-${user.uid}`);
      const storedPhoto = localStorage.getItem(`profile-photo-${user.uid}`);
      const storedTheme = localStorage.getItem(`profile-theme-${user.uid}`);
      if (storedBio) setBio(storedBio);
      if (storedPhoto) setPhotoURL(storedPhoto);
      if (storedTheme) setThemePref(storedTheme);
    }
  }, [user]);

  const saveProfile = () => {
    if (user?.uid) {
      localStorage.setItem(`profile-bio-${user.uid}`, bio);
      localStorage.setItem(`profile-photo-${user.uid}`, photoURL);
      localStorage.setItem(`profile-theme-${user.uid}`, themePref);
    }
    setEditMode(false);
  };

  // Derive stats from recent listening history
  const getTopArtists = () => {
    const artistCounts: { [key: string]: number } = {};
    recentSongs.forEach((song: Track) => {
      artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
    });

    return Object.entries(artistCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const getTopTracks = () => {
    const trackCounts: { [key: string]: { song: Track; count: number } } = {};
    recentSongs.forEach((song: Track) => {
      const key = `${song.title}-${song.artist}`;
      if (!trackCounts[key]) {
        trackCounts[key] = { song, count: 0 };
      }
      trackCounts[key].count += 1;
    });

    return Object.values(trackCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const topArtists = getTopArtists();
  const topTracks = getTopTracks();
  const totalListened = recentSongs.length;

  return (
    <ProtectedRoute>
      <main className="max-w-4xl mx-auto space-y-8 select-none">
        {/* Profile Card Header */}
        <div className="relative overflow-hidden rounded-3xl">
          <div className="relative bg-gradient-to-br from-purple-900/40 via-zinc-950/80 to-[#07070a] border border-white/5 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
            <div className="relative group shrink-0">
              <img
                src={
                  photoURL ||
                  user?.photoURL ||
                  `https://ui-avatars.com/api/?background=7c3aed&color=fff&name=${encodeURIComponent(
                    displayName
                  )}`
                }
                alt="Profile Avatar"
                className="w-36 h-36 rounded-full object-cover border-4 border-white/10 shadow-2xl"
              />
            </div>

            <div className="flex-grow space-y-4 text-center md:text-left min-w-0">
              {editMode ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full max-w-sm bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xl text-white font-bold focus:outline-none focus:border-purple-500"
                    placeholder="Display name"
                  />
                  <input
                    type="text"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="w-full max-w-sm bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
                    placeholder="Profile Image URL"
                  />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full max-w-sm bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500 min-h-[50px]"
                    placeholder="Short bio"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Award size={10} />
                    Verified User
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none truncate">
                    {displayName}
                  </h1>
                  <p className="text-xs text-zinc-400 font-medium flex items-center justify-center md:justify-start gap-1">
                    <Mail size={12} className="text-zinc-500" />
                    {user?.email}
                  </p>
                  {bio && (
                    <p className="text-xs text-zinc-300 max-w-md pt-1 italic leading-relaxed">
                      "{bio}"
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 flex items-center justify-center">
              {editMode ? (
                <button
                  onClick={saveProfile}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Check size={14} />
                  Save Profile
                </button>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Edit2 size={12} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Theme Preference Select */}
        <div className="glass p-5 rounded-2xl border border-white/5 bg-zinc-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Settings size={14} className="text-pink-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-200">Theme Preference</span>
              <span className="text-[10px] text-zinc-500 block">Personalize your system aesthetics</span>
            </div>
          </div>

          <select
            value={themePref}
            onChange={(e) => {
              setThemePref(e.target.value);
              if (user?.uid) localStorage.setItem(`profile-theme-${user.uid}`, e.target.value);
            }}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="glass">Premium Glass</option>
            <option value="dark">Vibrant Dark</option>
            <option value="amoled">Amoled Black</option>
          </select>
        </div>

        {/* Listening Stats & History Grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Overview */}
          <div className="md:col-span-1 glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <BarChart size={16} className="text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Listening Stats</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                <Flame className="text-orange-400 w-6 h-6 shrink-0" />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Tracks Streamed</span>
                  <span className="text-xl font-bold text-white">{totalListened}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                <Disc className="text-purple-400 w-6 h-6 shrink-0" />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Active Artists</span>
                  <span className="text-xl font-bold text-white">{topArtists.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Artists & Top Songs lists */}
          <div className="md:col-span-2 glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Top Artists list */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Top Artists</h4>
                {topArtists.length > 0 ? (
                  <div className="space-y-2.5">
                    {topArtists.map((artist, i) => (
                      <div key={artist.name} className="flex items-center justify-between text-xs bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <span className="font-semibold text-zinc-200 truncate pr-2">
                          {i + 1}. {artist.name}
                        </span>
                        <span className="text-zinc-500 font-bold shrink-0">{artist.count} plays</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600">No listener statistics generated yet.</p>
                )}
              </div>

              {/* Top Tracks list */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Top Tracks</h4>
                {topTracks.length > 0 ? (
                  <div className="space-y-2.5">
                    {topTracks.map((item, i) => (
                      <div key={item.song.videoId} className="flex items-center justify-between text-xs bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <span className="font-semibold text-zinc-200 truncate pr-2">
                          {i + 1}. {item.song.title}
                        </span>
                        <span className="text-zinc-500 font-bold shrink-0">{item.count} plays</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600">No listener statistics generated yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Complete Listening History List */}
        <section className="glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Listening History</h3>
          {recentSongs.length > 0 ? (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {recentSongs.map((song: Track, i: number) => (
                <div
                  key={`${song.videoId}-${i}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={song.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-200 truncate">{song.title}</h4>
                      <p className="text-[10px] text-zinc-500 truncate">{song.artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      usePlayerStore.getState().setTrack(song.videoId, song.title, song.artist, song.thumbnail, i);
                    }}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-[10px] font-bold text-white transition"
                  >
                    Play
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">History is empty.</p>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}