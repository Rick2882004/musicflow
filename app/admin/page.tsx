"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { usePlayerStore } from "@/store/player-store";
import { Shield, Users, Music, Layers, RefreshCw, Database } from "lucide-react";
import { Track } from "@/types/music";

export default function AdminPage() {
  const { playlists } = usePlayerStore();
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<{ success: boolean; imported: number } | null>(null);
  const [dbStats, setDbStats] = useState({ songsCount: 24, artistsCount: 6 });

  // Simulate or retrieve DB stats
  useEffect(() => {
    // In production we would fetch /api/v1/tracks or similar to count
    fetch("/api/v1/tracks")
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        if (data && data.length) {
          // Derive unique artists count
          const uniqueArtists = new Set(data.map((t: Track) => t.artist));
          setDbStats({
            songsCount: data.length,
            artistsCount: uniqueArtists.size || 6,
          });
        }
      })
      .catch((err) => console.error("Error reading track catalog:", err));
  }, [importStats]);

  const triggerImport = async () => {
    setImporting(true);
    setImportStats(null);
    try {
      const res = await fetch("/api/admin/import-jamendo");
      const data = res.ok ? await res.json() : { success: false, imported: 0 };
      setImportStats(data);
      if (data.success) {
        alert(`Successfully imported ${data.imported} new tracks from Jamendo! 🎉`);
      } else {
        alert("Failed to seed database from Jamendo.");
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Error seeding database.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="max-w-4xl mx-auto space-y-8 select-none pb-12">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/20 flex items-center justify-center">
            <Shield className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white select-none">Admin Control Center</h1>
            <p className="text-xs text-zinc-500 font-medium">Manage song index databases, seed metadata, and view active telemetry</p>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass p-5 rounded-2xl border border-white/5 bg-zinc-950/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users className="text-purple-400 w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Total Playlists</span>
              <span className="text-lg font-bold text-white">{playlists.length}</span>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/5 bg-zinc-950/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Music className="text-pink-400 w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Local Tracks Catalog</span>
              <span className="text-lg font-bold text-white">{dbStats.songsCount}</span>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/5 bg-zinc-950/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <Layers className="text-teal-400 w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Track Artists In DB</span>
              <span className="text-lg font-bold text-white">{dbStats.artistsCount}</span>
            </div>
          </div>
        </div>

        {/* Database Management & Actions */}
        <section className="glass p-6 rounded-3xl border border-white/5 bg-zinc-950/40 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Database size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Database Administration</h3>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Jamendo Tracks Importer</span>
                <span className="text-[10px] text-zinc-500 max-w-md block">
                  Connects to the Jamendo Creative Commons music registry and populates the local PostgreSQL/Supabase catalog with fresh royalty-free tracks.
                </span>
              </div>
              <button
                onClick={triggerImport}
                disabled={importing}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition shrink-0 active:scale-95"
              >
                <RefreshCw size={12} className={importing ? "animate-spin" : ""} />
                {importing ? "Importing Tracks..." : "Sync Jamendo Catalog"}
              </button>
            </div>

            {importStats && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 space-y-1 animate-fade-in">
                <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold block mb-1">Last Import Log:</span>
                <p>Status: <span className="text-zinc-100 font-semibold">{importStats.success ? "Success" : "Failed"}</span></p>
                <p>New Songs Loaded: <span className="text-zinc-100 font-semibold">{importStats.imported || 0}</span></p>
              </div>
            )}
          </div>
        </section>

        {/* Admin Warning Section */}
        <section className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
          <p className="font-bold">⚠️ Warning: Administrative Clearance</p>
          <p className="mt-1">
            Running manual seed scripts and database imports affects global search indexing and tracks accessibility. Ensure server connection is stable before importing.
          </p>
        </section>
      </main>
    </ProtectedRoute>
  );
}
