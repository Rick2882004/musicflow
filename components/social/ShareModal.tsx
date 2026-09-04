"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Copy,
  Check,
  FileText,
  MessageCircle,
  Send,
  Radio,
} from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  type: "playlist" | "album" | "artist" | "track";
  url?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  subtitle,
  thumbnail,
  type,
  url,
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
      platform: "MusicFlow",
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

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Listening to "${title}" on MusicFlow 🎵\n`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Check out "${title}" on MusicFlow: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`Check out "${title}" on MusicFlow`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-[#121216] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5 text-left relative overflow-hidden"
        >

          {/* Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Share2 size={15} />
              </div>
              <div>
                <h3 className="font-display text-sm font-black text-white capitalize">Share {type} Card</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Broadcast to social media or copy direct link</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition cursor-pointer"
              aria-label="Close share modal"
            >
              <X size={14} />
            </button>
          </div>

          {/* Glassmorphic Share Card Preview */}
          <div className="relative p-5 rounded-[24px] bg-gradient-to-br from-purple-900/30 via-zinc-900/40 to-black/60 border border-white/[0.08] shadow-xl overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-purple-300 font-black text-[10px] tracking-wider uppercase">
                <Radio size={12} className="animate-pulse" /> MusicFlow Stream
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-mono text-zinc-300 font-bold uppercase">
                {type}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950 shadow-md">
                <SafeImage src={thumbnail} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-white truncate leading-tight">{title}</h4>
                {subtitle && <p className="text-xs text-zinc-400 truncate mt-1">{subtitle}</p>}
                <p className="text-[10px] text-purple-400 font-mono mt-1 font-semibold">musicflow.io</p>
              </div>
            </div>
          </div>

          {/* Social Quick Share Buttons */}
          <div className="space-y-2">
            <label className="text-[9px] uppercase font-black tracking-widest text-zinc-500 block">
              Direct Social Share
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={shareToTwitter}
                className="py-2.5 px-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-[11px] font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>𝕏 Post</span>
              </button>
              <button
                onClick={shareToWhatsApp}
                className="py-2.5 px-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-[11px] font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageCircle size={13} className="text-emerald-400" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={shareToTelegram}
                className="py-2.5 px-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-[11px] font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send size={13} className="text-sky-400" />
                <span>Telegram</span>
              </button>
            </div>
          </div>

          {/* Direct Link Input & JSON Export */}
          <div className="space-y-3 pt-2 border-t border-white/[0.04]">
            <label className="text-[9px] uppercase font-black tracking-widest text-zinc-500 block">
              Shareable Direct Link
            </label>
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-zinc-300 w-full focus:outline-none truncate px-2 font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={handleExportMetadata}
              className="w-full py-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={13} /> Export Metadata (JSON)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
