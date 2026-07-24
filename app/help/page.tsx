"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Search,
  MessageSquare,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  CheckCircle,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function HelpPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"faq" | "feedback" | "terms" | "privacy">("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const faqs = [
    {
      q: "How does offline listening work in MusicFlow PWA?",
      a: "MusicFlow operates as an installable Progressive Web App (PWA). When you install MusicFlow on your desktop or mobile device, static application assets and audio streams are automatically cached via Service Workers for offline playback.",
    },
    {
      q: "What audio quality resolutions does MusicFlow support?",
      a: "MusicFlow supports Normal (128kbps), High (256kbps), and Ultra Fidelity (320kbps) audio streams. You can configure your resolution under Settings > Audio & Streaming.",
    },
    {
      q: "How does the AI DJ Assistant generate recommendations?",
      a: "The AI DJ analyzes your active listening history, liked tracks, top artists, and playlist affinity to construct real-time YouTube music stream queries tailored to your mood.",
    },
    {
      q: "Are my playlists and listening statistics private?",
      a: "Yes. By default, your account details and listening statistics remain strictly private. You can toggle Private Session mode under Settings > Privacy & Security.",
    },
    {
      q: "How do I install MusicFlow as a desktop or mobile app?",
      a: "Click the 'Install App' banner at the top of your screen, or use your browser's menu (e.g. Chrome 'Install MusicFlow' or Safari 'Add to Home Screen').",
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSubmitted(true);
    setFeedbackText("");
    setTimeout(() => setFeedbackSubmitted(false), 3000);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-10 pt-6 md:pt-10 pb-36 text-left select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400 flex items-center gap-1.5 mb-1">
            <Sparkles size={11} /> Support &amp; Knowledge Base
          </span>
          <h1 className="font-display text-[36px] sm:text-[48px] font-black leading-[0.95] text-white">
            Help Center.
          </h1>
        </div>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-white/[0.05] pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: "faq", label: "FAQ & Knowledge Base", icon: HelpCircle },
          { id: "feedback", label: "Send Feedback", icon: MessageSquare },
          { id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
          { id: "terms", label: "Terms of Service", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "faq" | "feedback" | "terms" | "privacy")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                active
                  ? "bg-purple-550 text-white shadow-md shadow-purple-550/20"
                  : "bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.05]"
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: FAQ */}
      {activeTab === "faq" && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-550 transition"
            />
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.015] border border-white/[0.04] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-xs text-white hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={15}
                      className={`text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-white/[0.03] pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Feedback */}
      {activeTab === "feedback" && (
        <form onSubmit={handleFeedbackSubmit} className="space-y-4 max-w-xl">
          <div className="p-6 rounded-3xl bg-white/[0.015] border border-white/[0.04] space-y-4">
            <h3 className="font-display text-base font-bold text-white">Product Feedback &amp; Ideas</h3>
            <p className="text-xs text-zinc-400">
              Have a feature request or noticed an issue? Let our engineering team know directly.
            </p>

            {feedbackSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle size={16} /> Thank you! Your feedback has been logged.
              </div>
            ) : (
              <>
                <textarea
                  required
                  rows={5}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you love or what we should improve..."
                  className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-550 transition resize-none"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-550 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg"
                >
                  <Send size={13} /> Submit Feedback
                </button>
              </>
            )}
          </div>
        </form>
      )}

      {/* Tab 3: Privacy Policy */}
      {activeTab === "privacy" && (
        <div className="p-6 rounded-3xl bg-white/[0.015] border border-white/[0.04] space-y-4 text-xs text-zinc-400 leading-relaxed">
          <h3 className="font-display text-base font-bold text-white">Privacy Policy</h3>
          <p>
            MusicFlow respects your data privacy. We collect minimal telemetry (e.g. playback states, liked tracks, search terms) exclusively to provide personalized recommendations and session sync.
          </p>
          <p>
            Your authentication credentials are handled securely via Google Firebase Auth. Audio streams are fetched on-demand from YouTube public APIs.
          </p>
        </div>
      )}

      {/* Tab 4: Terms of Service */}
      {activeTab === "terms" && (
        <div className="p-6 rounded-3xl bg-white/[0.015] border border-white/[0.04] space-y-4 text-xs text-zinc-400 leading-relaxed">
          <h3 className="font-display text-base font-bold text-white">Terms of Service</h3>
          <p>
            By accessing or using MusicFlow, you agree to comply with our commercial terms of service. MusicFlow is provided for personal streaming purposes.
          </p>
          <p>
            All artist audio tracks and thumbnails remain intellectual property of their respective creators and copyright owners.
          </p>
        </div>
      )}
    </main>
  );
}
