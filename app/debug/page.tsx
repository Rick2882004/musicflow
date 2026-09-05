"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, RefreshCw, Volume2, VolumeX, Play, Pause, Trash2 } from "lucide-react";
import { getAudioAnchorState, setAudioAnchorMode, getAudioAnchorMode, playAudioAnchor, pauseAudioAnchor } from "@/lib/audio-anchor";
import { getYTPlayerInfo, getIframeInfo } from "@/lib/bg-diagnostics";
import { usePlayerStore } from "@/store/player-store";

export default function DebugPage() {
  const [copied, setCopied] = useState(false);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);
  const [, setTick] = useState(0);
  const [logCount, setLogCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [cutoutInfo, setCutoutInfo] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Poll state every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      const diag = (window as any).__musicflowBgDiag; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (diag?.getLogs) {
        const logs = diag.getLogs();
        setLogCount(logs.length);
        setRecentLogs(logs.slice(-35).reverse());
      }
      if (diag?.analyzeCutout) {
        setCutoutInfo(diag.analyzeCutout());
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const store = usePlayerStore.getState();
  const ytInfo = getYTPlayerInfo();
  const anchorState = getAudioAnchorState();
  const iframeInfo = getIframeInfo();
  const anchorMode = getAudioAnchorMode();

  const handleCopyLogs = () => {
    const diag = (window as any).__musicflowBgDiag; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (diag?.copyLogs) {
      diag.copyLogs();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyAnalysis = () => {
    if (cutoutInfo?.summary && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cutoutInfo.summary);
      setCopiedAnalysis(true);
      setTimeout(() => setCopiedAnalysis(false), 3000);
    }
  };

  const handleSetAnchorMode = (mode: "silent" | "audible") => {
    setAudioAnchorMode(mode);
    setTick((t) => t + 1);
  };

  const handleClearLogs = () => {
    const diag = (window as any).__musicflowBgDiag; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (diag?.clear) {
      diag.clear();
      setRecentLogs([]);
      setLogCount(0);
      setCutoutInfo(null);
    }
  };

  const mediaSessionPlaybackState =
    typeof navigator !== "undefined" && "mediaSession" in navigator
      ? navigator.mediaSession.playbackState
      : "N/A";

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true); // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 pb-40 font-mono text-xs max-w-2xl mx-auto space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
          <ArrowLeft size={16} />
          <span>Back to MusicFlow</span>
        </Link>
        <span className="bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded font-bold">
          Chrome Android Diag
        </span>
      </div>

      {/* Cutout Sequence Analyzer Banner */}
      <div
        className={`border rounded-2xl p-4 space-y-2 transition ${
          cutoutInfo?.detected
            ? "bg-red-950/40 border-red-500/60 text-red-200"
            : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm flex items-center gap-2">
            {cutoutInfo?.detected ? "⚠️ Audio Cutout Detected!" : "✅ Playback State Monitor"}
          </span>
          {cutoutInfo?.category && cutoutInfo.category !== "NONE" && (
            <span className="bg-red-600 text-white px-2 py-0.5 rounded font-black text-[11px] uppercase tracking-wider">
              Category {cutoutInfo.category}
            </span>
          )}
        </div>
        <div className="text-xs font-semibold leading-relaxed bg-black/60 p-3 rounded-xl border border-white/10 select-text font-mono text-zinc-200">
          {cutoutInfo?.summary || "Monitoring playback... awaiting any cutout or pause event."}
        </div>
        {cutoutInfo?.categoryDescription && (
          <div className="text-[11px] text-zinc-300">
            <strong className="text-white">Trigger:</strong> {cutoutInfo.categoryDescription}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleCopyAnalysis}
          disabled={!cutoutInfo?.detected}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl font-bold transition text-white text-[11px] ${
            !cutoutInfo?.detected
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : copiedAnalysis
              ? "bg-emerald-600"
              : "bg-amber-600 hover:bg-amber-500"
          }`}
        >
          {copiedAnalysis ? <Check size={14} /> : <Copy size={14} />}
          <span>{copiedAnalysis ? "Analysis Copied!" : "Copy Analysis"}</span>
        </button>

        <button
          onClick={handleCopyLogs}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl font-bold transition text-white text-[11px] ${
            copied ? "bg-emerald-600" : "bg-purple-600 hover:bg-purple-500"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Logs Copied!" : `Copy Logs (${logCount})`}</span>
        </button>

        <button
          onClick={handleClearLogs}
          className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition text-[11px]"
        >
          <Trash2 size={14} />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Phase 3 Audio Anchor Toggles */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-zinc-300 text-sm">Phase 3: Audio Anchor Mode</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              anchorMode === "audible"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}
          >
            Current: {anchorMode}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSetAnchorMode("silent")}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
              anchorMode === "silent"
                ? "bg-blue-600/30 border-blue-500 text-white"
                : "bg-zinc-800/60 border-zinc-700 text-zinc-400"
            }`}
          >
            <VolumeX size={14} />
            <span>Silent (/silence.wav)</span>
          </button>

          <button
            onClick={() => handleSetAnchorMode("audible")}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
              anchorMode === "audible"
                ? "bg-amber-600/30 border-amber-500 text-white"
                : "bg-zinc-800/60 border-zinc-700 text-zinc-400"
            }`}
          >
            <Volume2 size={14} />
            <span>Audible (40Hz Sub-bass)</span>
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => playAudioAnchor()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[11px] text-emerald-400 font-semibold"
          >
            <Play size={12} /> Play Anchor
          </button>
          <button
            onClick={() => pauseAudioAnchor()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[11px] text-amber-400 font-semibold"
          >
            <Pause size={12} /> Pause Anchor
          </button>
        </div>
      </div>

      {/* Live Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Document & Visibility */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1.5">
          <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-1 flex justify-between">
            <span>Page Lifecycle</span>
            <RefreshCw size={12} className="animate-spin text-zinc-600" />
          </div>
          <div>visibilityState: <span className="text-white font-bold">{typeof document !== "undefined" ? document.visibilityState : "N/A"}</span></div>
          <div>document.hidden: <span className="text-white font-bold">{typeof document !== "undefined" ? String(document.hidden) : "N/A"}</span></div>
          <div>hasFocus(): <span className="text-white font-bold">{typeof document !== "undefined" ? String(document.hasFocus()) : "N/A"}</span></div>
          <div>Standalone PWA: <span className="text-white font-bold">{String(isStandalone)}</span></div>
        </div>

        {/* YouTube Player */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1.5">
          <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-1">YouTube Player</div>
          <div>Connected: <span className="text-white font-bold">{String(ytInfo.connected)}</span></div>
          <div>State: <span className="text-amber-400 font-bold">{ytInfo.stateName || "NONE"} ({ytInfo.state ?? "N/A"})</span></div>
          <div>Time / Dur: <span className="text-white">{ytInfo.currentTime || 0}s / {ytInfo.duration || 0}s</span></div>
          <div>Track: <span className="text-zinc-300 truncate inline-block max-w-[180px]">{store.title || "None"}</span></div>
          <div>Store isPlaying: <span className="text-white font-bold">{String(store.isPlaying)}</span></div>
        </div>

        {/* Audio Anchor (Phase 2) */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1.5">
          <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-1">Audio Anchor (Top-Level)</div>
          <div>Attached to DOM: <span className="text-white font-bold">{String(anchorState.isConnected)}</span></div>
          <div>Paused: <span className={anchorState.paused ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>{String(anchorState.paused)}</span></div>
          <div>readyState: <span className="text-white font-bold">{anchorState.readyState ?? "N/A"}</span></div>
          <div>networkState: <span className="text-white font-bold">{anchorState.networkState ?? "N/A"}</span></div>
          <div>Volume / Muted: <span className="text-white">{anchorState.volume} / {String(anchorState.muted)}</span></div>
          <div>Current Time: <span className="text-white">{anchorState.currentTime}s</span></div>
        </div>

        {/* MediaSession & Iframe */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1.5">
          <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-1">MediaSession & Iframe</div>
          <div>playbackState: <span className="text-purple-300 font-bold">{mediaSessionPlaybackState}</span></div>
          <div>Iframe rendered: <span className="text-white font-bold">{String(iframeInfo.exists)}</span></div>
          <div>Iframe size: <span className="text-white">{iframeInfo.offsetWidth || 0}x{iframeInfo.offsetHeight || 0}px</span></div>
          <div>Title: <span className="text-zinc-300 truncate inline-block max-w-[180px]">
            {typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession.metadata?.title : "N/A"}
          </span></div>
        </div>
      </div>

      {/* Live Event Log Feed */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="font-bold text-zinc-300 text-sm">Recent Lifecycle Events</span>
          <span className="text-zinc-500 text-[11px]">{recentLogs.length} shown (reverse chrono)</span>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-zinc-500 py-6 text-center">No events captured yet. Play a song to begin.</div>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            {recentLogs.map((log, idx) => (
              <div
                key={idx}
                className="bg-black/40 border border-white/[0.04] p-2 rounded-lg space-y-0.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-400 font-bold">{log.type}</span>
                  <span className="text-zinc-500">{log.time}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 text-[10px] text-zinc-400">
                  <span>vis: <strong className="text-zinc-200">{log.visibilityState}</strong></span>
                  {log.ytStateName && (
                    <span>yt: <strong className="text-amber-300">{log.ytStateName}</strong></span>
                  )}
                  {log.mediaSessionPlaybackState && (
                    <span>ms: <strong className="text-blue-300">{log.mediaSessionPlaybackState}</strong></span>
                  )}
                  {log.audioAnchor?.paused !== undefined && (
                    <span>anchorPaused: <strong className={log.audioAnchor.paused ? "text-red-300" : "text-emerald-300"}>{String(log.audioAnchor.paused)}</strong></span>
                  )}
                </div>
                {log.extra && Object.keys(log.extra).length > 0 && (
                  <pre className="text-[9px] text-zinc-500 overflow-x-auto whitespace-pre-wrap mt-0.5">
                    {JSON.stringify(log.extra)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
