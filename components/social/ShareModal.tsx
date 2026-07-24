"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Copy, Check, Lock, Globe, FileText } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  type: "playlist" | "album" | "artist" | "track";
  url?: string;
  isPublic?: boolean;
  onTogglePublic?: (isPublic: boolean) => void;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  subtitle,
  thumbnail,
  type,
  url,
  isPublic = true,
  onTogglePublic,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "https://musicflow.io");

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMetadata = () => {
    const meta = {
      title,
      subtitle: subtitle || "",
      type,
      url: shareUrl,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-metadata.json`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-zinc-950/95 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-purple-400" />
              <h3 className="font-display text-base font-bold text-white capitalize">Share {type}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close share modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Item Preview Card */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900">
              <SafeImage src={thumbnail} alt={title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-grow">
              <h4 className="text-sm font-bold text-white truncate">{title}</h4>
              {subtitle && <p className="text-xs text-zinc-400 truncate mt-0.5">{subtitle}</p>}
              <span className="inline-block px-2 py-0.5 rounded-full bg-purple-550/20 text-purple-300 text-[9px] font-bold uppercase tracking-wider mt-1.5 border border-purple-500/30">
                {type}
              </span>
            </div>
          </div>

          {/* Privacy Toggle (if applicable) */}
          {onTogglePublic && (
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isPublic ? <Globe size={16} className="text-emerald-400" /> : <Lock size={16} className="text-amber-400" />}
                <div>
                  <p className="text-xs font-bold text-white">{isPublic ? "Public Access" : "Private Access"}</p>
                  <p className="text-[10px] text-zinc-400">{isPublic ? "Anyone with link can view" : "Only you can view"}</p>
                </div>
              </div>
              <button
                onClick={() => onTogglePublic(!isPublic)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isPublic ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {isPublic ? "Public" : "Private"}
              </button>
            </div>
          )}

          {/* Direct Link Input & Actions */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Direct URL</label>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-zinc-300 w-full focus:outline-none truncate px-1"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-xl bg-purple-550 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={handleExportMetadata}
              className="w-full py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-zinc-300 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={14} /> Export Track Metadata JSON
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
