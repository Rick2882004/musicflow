"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Sparkles, Music, Heart, CheckCircle2, Trash2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "mix" | "release" | "playlist" | "like";
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Weekly Discover Ready",
      message: "Your fresh 30-track personalized mix has been updated.",
      time: "2h ago",
      read: false,
      type: "mix",
    },
    {
      id: "2",
      title: "New Release",
      message: "Arijit Singh released a new single: 'Kesariya Lofi Mix'.",
      time: "5h ago",
      read: false,
      type: "release",
    },
    {
      id: "3",
      title: "Playlist Recommendation",
      message: "Based on your recent listening, check out 'Bollywood Chill'.",
      time: "1d ago",
      read: true,
      type: "playlist",
    },
  ]);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "mix":
        return <Sparkles size={16} className="text-purple-400" />;
      case "release":
        return <Music size={16} className="text-blue-400" />;
      case "like":
        return <Heart size={16} className="text-pink-400" />;
      default:
        return <Bell size={16} className="text-amber-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-start justify-end p-4 md:p-6 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="w-full max-w-md bg-[#121216] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 text-left mt-16"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-550/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">Notifications</h3>
                <p className="text-[10px] text-zinc-400">Updates, releases & personalized mixes</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close notification center"
            >
              <X size={16} />
            </button>
          </div>

          {/* Action Toolbar */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 hover:text-purple-300 transition-colors cursor-pointer text-[11px] font-bold"
              >
                <CheckCircle2 size={13} /> Mark all read
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer text-[11px] font-bold"
              >
                <Trash2 size={13} /> Clear all
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {notifications.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] text-zinc-600 flex items-center justify-center mx-auto">
                  <Bell size={24} />
                </div>
                <p className="text-xs font-bold text-zinc-400">All caught up!</p>
                <p className="text-[10px] text-zinc-500">No new notifications at the moment.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex gap-3.5 ${
                    item.read
                      ? "bg-white/[0.015] border-white/[0.04]"
                      : "bg-purple-550/10 border-purple-500/20 shadow-md"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 border border-white/10 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <span className="text-[9px] text-zinc-500 shrink-0 font-medium">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-1 line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
