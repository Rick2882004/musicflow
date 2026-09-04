"use client";

import { Users, Radio, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { motion, AnimatePresence } from "framer-motion";

type FriendActivityProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function FriendActivity({ isOpen, onClose }: FriendActivityProps) {
  const activeFriends: Array<{
    id: string;
    name: string;
    status: string;
    avatar: string;
    online: boolean;
  }> = [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
          />

          {/* Slide-over Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            aria-label="Friend Activity"
            className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col p-4 select-none"
            style={{
              background: "var(--mf-bg-surface)",
              borderLeft: "1px solid var(--mf-border)",
              boxShadow: "var(--mf-shadow-xl)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05] mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: "var(--mf-accent-light)" }} />
                <span
                  className="text-[10px] font-black uppercase tracking-[0.16em]"
                  style={{ color: "var(--mf-text-secondary)" }}
                >
                  Friend Activity
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/5 active:scale-90"
                style={{ color: "var(--mf-text-muted)" }}
                title="Close panel"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            {activeFriends.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                {activeFriends.map((friend) => (
                  <div key={friend.id} className="flex gap-2.5 items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-zinc-950">
                      <SafeImage src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{friend.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{friend.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--mf-border)",
                    color: "var(--mf-text-muted)",
                  }}
                >
                  <Radio size={16} />
                </div>
                <div>
                  <h3
                    className="text-xs font-bold"
                    style={{ color: "var(--mf-text-primary)" }}
                  >
                    Quiet for Now
                  </h3>
                  <p
                    className="text-[11px] mt-1 leading-relaxed"
                    style={{ color: "var(--mf-text-muted)" }}
                  >
                    Listen with friends on MusicFlow to see real-time tunes here.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              className="pt-3 mt-auto flex items-center gap-1.5 justify-center shrink-0"
              style={{ borderTop: "1px solid var(--mf-border-soft)", color: "var(--mf-text-dim)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-mono tracking-wider uppercase font-bold">
                Live Session Sync
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

