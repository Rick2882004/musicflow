"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";
import {
  Sparkles,
  Send,
  X,
  Play,
  ListPlus,
  PlusCircle,
  Bot,
  User,
  CheckCircle,
} from "lucide-react";
import { Track } from "@/types/music";
import { SafeImage } from "@/components/ui/SafeImage";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  tracks?: Track[];
  suggestedPlaylistTitle?: string;
  tags?: string[];
}

const QUICK_PROMPTS = [
  "Give me songs for a late-night drive 🌙",
  "Find songs similar to Arijit Singh 💕",
  "Make me a 30-minute workout playlist ⚡",
  "Show me underrated indie rock artists 🎸",
  "Deep focus Lo-Fi beats for coding 🧠",
  "Top Punjabi party bangers 🥁",
];

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const seqRef = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "assistant",
      text: "Hello! I am your AI Music Assistant. Tell me what mood, activity, or sound you are looking for, and I will curate a personalized session with real streaming tracks!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState("");

  const { setTrack, setQueue, queue, addPlaylist, addSongToPlaylist } = usePlayerStore(
    useShallow((s) => ({
      setTrack: s.setTrack,
      setQueue: s.setQueue,
      queue: s.queue,
      addPlaylist: s.addPlaylist,
      addSongToPlaylist: s.addSongToPlaylist,
    }))
  );

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 2200);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    seqRef.current += 1;
    const userMsg: ChatMessage = {
      id: `user-${seqRef.current}`,
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        seqRef.current += 1;
        const assistantMsg: ChatMessage = {
          id: `assistant-${seqRef.current}`,
          sender: "assistant",
          text: data.reply,
          tracks: data.tracks || [],
          suggestedPlaylistTitle: data.suggestedPlaylistTitle,
          tags: data.tags || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error("Failed to get assistant response");
      }
    } catch (err) {
      console.error(err);
      seqRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${seqRef.current}`,
          sender: "assistant",
          text: "I ran into an issue connecting to the AI curator service. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const playAllTracks = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    setQueue(tracks);
    const first = tracks[0];
    setTrack(first.videoId, first.title, first.artist, first.thumbnail, 0);
    showNotification("Playing AI Curated Mix");
  };

  const appendToQueue = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    const newQueue = [...queue, ...tracks];
    setQueue(newQueue);
    showNotification(`Added ${tracks.length} tracks to queue`);
  };

  const saveAsPlaylist = async (tracks: Track[], title?: string) => {
    if (tracks.length === 0) return;
    const plName = title || `AI Mix (${new Date().toLocaleDateString()})`;
    await addPlaylist(plName);
    // Find newly created playlist from state
    setTimeout(async () => {
      const currentPlaylists = usePlayerStore.getState().playlists;
      const created = currentPlaylists[currentPlaylists.length - 1];
      if (created) {
        for (const t of tracks) {
          await addSongToPlaylist(created.id, t);
        }
        showNotification(`Saved "${plName}" to library!`);
      }
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Notif Toast */}
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 z-[110] px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-2xl"
          >
            <CheckCircle size={14} /> {notif}
          </motion.div>
        )}

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl h-[85vh] max-h-[720px] rounded-[32px] bg-[#0c0c12]/95 border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0 bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-display text-base font-black text-white flex items-center gap-2">
                  MusicFlow AI Assistant
                </h3>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Conversational Music Discovery &amp; Playlist Generator
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-6 py-2.5 bg-white/[0.015] border-b border-white/[0.04] overflow-x-auto scrollbar-none flex gap-2 shrink-0">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-[10px] font-semibold text-zinc-300 hover:text-white transition whitespace-nowrap cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <Bot size={15} />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-3 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-purple-600 text-white font-semibold rounded-tr-sm shadow-md"
                        : "bg-white/[0.03] border border-white/[0.06] text-zinc-200 rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Render Tracks when present */}
                  {msg.tracks && msg.tracks.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                      {/* Action Bar for tracks */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.04]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                          {msg.suggestedPlaylistTitle || "Curated Tracks"} ({msg.tracks.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => playAllTracks(msg.tracks!)}
                            className="px-3 py-1 rounded-full bg-white text-black font-bold text-[10px] flex items-center gap-1.5 hover:bg-zinc-100 transition active:scale-95 cursor-pointer shadow-sm"
                          >
                            <Play size={10} fill="black" /> Play All
                          </button>
                          <button
                            onClick={() => appendToQueue(msg.tracks!)}
                            className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] font-semibold text-[10px] flex items-center gap-1 transition active:scale-95 cursor-pointer"
                          >
                            <ListPlus size={11} /> Queue
                          </button>
                          <button
                            onClick={() => saveAsPlaylist(msg.tracks!, msg.suggestedPlaylistTitle)}
                            className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] font-semibold text-[10px] flex items-center gap-1 transition active:scale-95 cursor-pointer"
                          >
                            <PlusCircle size={11} /> Save Playlist
                          </button>
                        </div>
                      </div>

                      {/* Track list grid */}
                      <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-none pr-1">
                        {msg.tracks.map((song, i) => (
                          <div
                            key={`${song.videoId}-${i}`}
                            onClick={() => {
                              setQueue(msg.tracks!);
                              setTrack(song.videoId, song.title, song.artist, song.thumbnail, i);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.03] transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-white/5">
                                <SafeImage src={song.thumbnail} videoId={song.videoId} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0 text-left">
                                <p className="text-[11px] font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                                  {song.title}
                                </p>
                                <p className="text-[9px] text-zinc-500 truncate">{song.artist}</p>
                              </div>
                            </div>
                            <Play size={10} fill="white" className="text-white opacity-0 group-hover:opacity-100 transition mr-1 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3.5 items-center">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot size={15} />
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400 flex items-center gap-2">
                  <Sparkles size={13} className="animate-spin text-purple-400" />
                  <span>Curating the perfect tracks for you...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="p-4 border-t border-white/[0.06] bg-white/[0.01] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for song recommendations, moods, playlist concepts..."
                className="w-full h-12 pl-4 pr-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs font-semibold text-white placeholder:text-zinc-600 outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 p-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
