"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { useAuth } from "../../src/context/AuthContext";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Edit2, Check, Mail, Award, Flame, Settings, Sparkles, Clock, Star, Music, Disc, Activity } from "lucide-react";
import { Track } from "@/types/music";
import { useHasMounted } from "@/hooks/useHasMounted";
import { SafeImage } from "@/components/ui/SafeImage";
import { WrappedModal } from "@/components/ui/WrappedModal";
import { calculateListeningStats } from "@/lib/analytics";

export default function ProfilePage() {
  const { user } = useAuth();
  const mounted = useHasMounted();
  const { recentSongs, likedSongs, playlists, setTrack, setQueue } = usePlayerStore(useShallow((s) => ({
    recentSongs: s.recentSongs,
    likedSongs:  s.likedSongs,
    playlists:   s.playlists,
    setTrack:    s.setTrack,
    setQueue:    s.setQueue,
  })));

  const [editMode, setEditMode] = useState(false);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [themePref, setThemePref] = useState("glass");

  // Sync display profile name on user state change/mount
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        setDisplayName(user.displayName || user.email?.split("@")[0] || "MusicFlow User");
        setPhotoURL(user.photoURL || "");
      }, 0);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      const storedBio = localStorage.getItem(`profile-bio-${user.uid}`);
      const storedPhoto = localStorage.getItem(`profile-photo-${user.uid}`);
      const storedTheme = localStorage.getItem(`profile-theme-${user.uid}`);
      setTimeout(() => {
        if (storedBio) setBio(storedBio);
        if (storedPhoto) setPhotoURL(storedPhoto);
        if (storedTheme) setThemePref(storedTheme);
      }, 0);
    }
  }, [user]);

  if (!mounted) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center">
          <div className="text-zinc-450 text-xl font-bold animate-pulse">Loading Profile...</div>
        </div>
      </ProtectedRoute>
    );
  }

  const saveProfile = () => {
    if (user?.uid) {
      localStorage.setItem(`profile-bio-${user.uid}`, bio);
      localStorage.setItem(`profile-photo-${user.uid}`, photoURL);
      localStorage.setItem(`profile-theme-${user.uid}`, themePref);
    }
    setEditMode(false);
  };

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
  const stats = calculateListeningStats(recentSongs, likedSongs);
  const listeningLevel = Math.floor(stats.songsPlayed / 10) + 1;

  const getAchievementIcon = (id: string) => {
    switch (id) {
      case "night-owl": return Clock;
      case "trendsetter": return Star;
      case "superfan": return Flame;
      default: return Award;
    }
  };

  const handlePlaySong = (song: Track, index: number) => {
    setQueue(recentSongs);
    setTrack(song.videoId, song.title, song.artist, song.thumbnail, index);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen pb-36 text-white text-left space-y-16" style={{ background: "#07070A" }}>

        {/* 1. Profile Hero & Stats Header */}
        <section className="relative px-4 md:px-10 pt-6 md:pt-10 pb-6 overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-[-10%] w-[600px] h-[400px] rounded-full bg-purple-950/[0.08] blur-[140px] pointer-events-none" />
          <div className="absolute top-20 right-0 w-[450px] h-[320px] rounded-full bg-pink-950/[0.06] blur-[120px] pointer-events-none" />

          {/* Glass Card Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 p-6 md:p-10 rounded-[32px] bg-white/[0.015] border border-white/[0.04] backdrop-blur-2xl"
            style={{ boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)" }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="relative shrink-0 group">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border border-white/[0.08] shadow-2xl bg-zinc-950">
                    <SafeImage
                      src={
                        photoURL ||
                        user?.photoURL ||
                        `https://ui-avatars.com/api/?background=7c3aed&color=fff&name=${encodeURIComponent(displayName)}&size=256`
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      fallbackType="artist"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-550 border border-zinc-950 flex items-center justify-center text-white">
                    <Sparkles size={13} />
                  </div>
                </div>

                {/* Profile detail */}
                <div className="space-y-4 text-center md:text-left min-w-0">
                  {editMode ? (
                    <div className="space-y-2.5 max-w-sm">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-550"
                        placeholder="Display name"
                      />
                      <input
                        type="text"
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-zinc-300 focus:outline-none focus:border-purple-550"
                        placeholder="Profile Image URL"
                      />
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-zinc-300 focus:outline-none focus:border-purple-550 min-h-[50px]"
                        placeholder="Short bio..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.05]">
                        <Award size={11} className="text-purple-400" />
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-550 select-none">
                          Premium Lifetime Member
                        </span>
                      </div>

                      <h1 className="font-display text-[32px] sm:text-[48px] font-black leading-[0.92] tracking-tighter text-white select-none truncate">
                        {displayName}
                      </h1>

                      <p className="text-[11px] text-zinc-500 font-semibold flex items-center justify-center md:justify-start gap-1">
                        <Mail size={11} /> {user?.email}
                      </p>

                      {bio && (
                        <p className="text-xs text-zinc-405 font-medium leading-relaxed max-w-sm italic">
                          &quot;{bio}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions & Streaks */}
              <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0">
                <div className="flex items-center gap-6 text-zinc-500 font-semibold text-xs sm:border-r sm:border-white/5 sm:pr-6">
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Level</p>
                    <p className="text-xl font-black text-zinc-200 mt-1">Lvl {listeningLevel}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Followers</p>
                    <p className="text-xl font-black text-zinc-200 mt-1">148</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Following</p>
                    <p className="text-xl font-black text-zinc-200 mt-1">42</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Streak</p>
                    <p className="text-xl font-black text-zinc-200 mt-1 flex items-center gap-1">
                      14d <Flame size={14} className="text-orange-500" />
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center gap-2">
                  {editMode ? (
                    <button
                      onClick={saveProfile}
                      className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-150 text-black font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                    >
                      <Check size={13} /> Save Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setWrappedOpen(true)}
                        className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-650 to-pink-650 text-white font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-[0_4px_16px_rgba(168,85,247,0.3)] hover:brightness-110 cursor-pointer"
                      >
                        <Sparkles size={12} className="animate-pulse" /> Show My Wrapped
                      </button>
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-5 py-2.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-zinc-350 hover:text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Edit2 size={11} /> Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </section>

        {/* 2. Stats Dashboard & Info Grid */}
        <section className="px-4 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8">
            
            {/* Left Column: Stats & Settings */}
            <div className="space-y-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Overview</p>
                <h2 className="font-display text-[18px] font-black text-white tracking-tight leading-none">Listening Metrics</h2>
              </div>

              {/* Metrics cards */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Music size={11} className="text-purple-400" /> Tracks Played
                  </span>
                  <span className="text-xl font-black text-white font-mono">{stats.songsPlayed}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={11} className="text-indigo-400" /> Listening Time
                  </span>
                  <span className="text-xl font-black text-white font-mono">{stats.listeningHours} hrs</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Disc size={11} className="text-teal-400" /> Top Genre
                  </span>
                  <span className="text-xs font-black text-zinc-200 truncate">{stats.favoriteGenre}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Star size={11} className="text-pink-400" /> Top Artist
                  </span>
                  <span className="text-xs font-black text-zinc-200 truncate">{stats.favoriteArtist}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Flame size={11} className="text-orange-400" /> Current Streak
                  </span>
                  <span className="text-xl font-black text-white font-mono">{stats.listeningStreak} days</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex flex-col justify-between h-20">
                  <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={11} className="text-rose-400" /> Completion Rate
                  </span>
                  <span className="text-xl font-black text-white font-mono">{stats.completionRate}%</span>
                </div>
              </div>

              {/* Theme Settings Selector */}
              <div className="p-5 rounded-2xl bg-white/[0.015] border border-white/[0.04] space-y-4">
                <div className="flex items-center gap-3.5">
                  <Settings size={14} className="text-zinc-650" />
                  <div>
                    <span className="text-[11px] font-bold text-zinc-300">Theme Workspace Skin</span>
                    <p className="text-[9px] text-zinc-500 font-medium">Customize your styling preference</p>
                  </div>
                </div>
                <select
                  value={themePref}
                  onChange={(e) => {
                    setThemePref(e.target.value);
                    if (user?.uid) localStorage.setItem(`profile-theme-${user.uid}`, e.target.value);
                  }}
                  className="w-full bg-[#0c0c0e]/95 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-purple-550"
                >
                  <option value="glass">Premium Glass</option>
                  <option value="dark">Vibrant Dark</option>
                  <option value="amoled">Amoled Black</option>
                </select>
              </div>

            </div>

            {/* Right Column: Achievements & Activity */}
            <div className="space-y-6">
              
              {/* Achievements */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Progression</p>
                <h2 className="font-display text-[18px] font-black text-white tracking-tight leading-none">Achievements</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.achievements.map((ach: { id: string; name: string; desc: string; color: string }) => {
                  const Icon = getAchievementIcon(ach.id);
                  return (
                    <div
                      key={ach.id}
                      className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] flex items-center gap-3.5"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ach.color} flex items-center justify-center text-black shadow-md shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-xs font-bold text-zinc-200 block truncate">{ach.name}</span>
                        <span className="text-[9px] text-zinc-555 block font-medium truncate mt-0.5">{ach.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Listening Personality */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/10 via-white/[0.015] to-zinc-950/20 border border-white/[0.05] space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-purple-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400">Listening Style</span>
                </div>
                <h3 className="font-display text-base font-black text-white">{stats.personality.title} ({stats.personality.type})</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">{stats.personality.description}</p>
              </div>

            </div>

          </div>
        </section>

        {/* 3. Top Tracks & Top Artists */}
        <section className="px-4 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Column: Top Artists */}
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Metrics</p>
                <h2 className="font-display text-[18px] font-black text-white tracking-tight leading-none">Top Artists</h2>
              </div>
              {topArtists.length > 0 ? (
                <div className="space-y-2">
                  {topArtists.map((artist, idx) => (
                    <div
                      key={artist.name}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.035] hover:border-purple-500/20 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-[12px] font-mono text-zinc-650 w-4 text-center">{idx + 1}</span>
                        <span className="text-xs font-bold text-zinc-250 group-hover:text-white transition-colors">{artist.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 font-bold uppercase tracking-wider">{artist.count} plays</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white/[0.01] border border-white/[0.04] rounded-2xl text-zinc-600 text-xs">
                  Listening history is empty.
                </div>
              )}
            </div>

            {/* Column: Top Tracks */}
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Metrics</p>
                <h2 className="font-display text-[18px] font-black text-white tracking-tight leading-none">Top Tracks</h2>
              </div>
              {topTracks.length > 0 ? (
                <div className="space-y-2">
                  {topTracks.map((item, idx) => (
                    <div
                      key={`top-track-${item.song.videoId}-${idx}`}
                      onClick={() => handlePlaySong(item.song, idx)}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.035] hover:border-purple-500/20 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[12px] font-mono text-zinc-650 w-4 text-center shrink-0">{idx + 1}</span>
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                          <SafeImage src={item.song.thumbnail} videoId={item.song.videoId} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-bold text-zinc-250 group-hover:text-purple-300 truncate leading-snug">{item.song.title}</p>
                          <p className="text-[9px] text-zinc-555 truncate mt-0.5">{item.song.artist}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 font-bold uppercase tracking-wider shrink-0 pr-2">{item.count} plays</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white/[0.01] border border-white/[0.04] rounded-2xl text-zinc-600 text-xs">
                  Listening history is empty.
                </div>
              )}
            </div>

          </div>
        </section>

        {/* 4. Activity Timeline */}
        <section className="px-4 md:px-10 space-y-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Logs</p>
            <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Activity Timeline</h2>
          </div>
          
          <div className="p-5 rounded-[24px] bg-white/[0.015] border border-white/[0.04] relative space-y-6 pl-10 border-l border-white/[0.04] ml-3">
            
            <div className="relative text-left">
              <div className="absolute left-[-47px] top-1 w-5 h-5 rounded-full bg-purple-900 border border-purple-550 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
              <span className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase">Today</span>
              <p className="text-xs font-semibold text-zinc-250 mt-1">Logged into platform workspace, synchronized listening cloud sessions</p>
            </div>

            <div className="relative text-left">
              <div className="absolute left-[-47px] top-1 w-5 h-5 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
              </div>
              <span className="text-[9px] font-bold text-zinc-650 tracking-widest uppercase">Yesterday</span>
              <p className="text-xs font-semibold text-zinc-350 mt-1">Streamed {recentSongs.slice(0, 3).length} new tracks from explore dashboard suggestions</p>
            </div>

            <div className="relative text-left">
              <div className="absolute left-[-47px] top-1 w-5 h-5 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
              </div>
              <span className="text-[9px] font-bold text-zinc-650 tracking-widest uppercase">3 Days Ago</span>
              <p className="text-xs font-semibold text-zinc-350 mt-1">Constructed a new public sound collection playlist with custom metadata details</p>
            </div>

          </div>
        </section>

        {/* 5. Recent Playlists (Carousel) */}
        {playlists.length > 0 && (
          <section className="px-4 md:px-10 space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-1.5">Collections</p>
              <h2 className="font-display text-[22px] font-black text-white tracking-tight leading-none">Recent Playlists</h2>
            </div>
            <div className="flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-4 md:-mx-10 px-4 md:px-10">
              {playlists.slice(0, 6).map((playlist) => (
                <motion.div
                  key={`profile-playlist-${playlist.id}`}
                  whileHover={{ y: -6 }}
                  className="group shrink-0 w-[140px] md:w-[155px] p-3 rounded-[20px] bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-purple-500/25 transition-all duration-300 cursor-pointer text-left"
                >
                  <div className="relative aspect-square rounded-[14px] overflow-hidden bg-zinc-950 border border-white/5 shadow-sm mb-3">
                    {playlist.songs[0] ? (
                      <SafeImage src={playlist.songs[0].thumbnail} videoId={playlist.songs[0].videoId} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="song" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                        <Music size={28} className="text-zinc-800" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-zinc-300 truncate leading-tight group-hover:text-white transition-colors">{playlist.name}</p>
                  <p className="text-[9px] text-zinc-555 truncate mt-0.5">{playlist.songs.length} Tracks</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <WrappedModal
          isOpen={wrappedOpen}
          onClose={() => setWrappedOpen(false)}
          likedSongs={likedSongs}
          recentSongs={recentSongs}
        />

      </main>
    </ProtectedRoute>
  );
}